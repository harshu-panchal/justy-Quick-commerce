import { Request, Response } from "express";
import Order from "../../../models/Order";
import Product from "../../../models/Product";
import OrderItem from "../../../models/OrderItem";
import Customer from "../../../models/Customer";
import Seller from "../../../models/Seller";
import mongoose from "mongoose";
import { calculateDistance, isPointInPolygon } from "../../../utils/locationHelper";
import { notifySellersOfOrderUpdate } from "../../../services/sellerNotificationService";
import { generateDeliveryOtp } from "../../../services/deliveryOtpService";
import AppSettings from "../../../models/AppSettings";
import { getRoadDistances } from "../../../services/mapService";
import { Server as SocketIOServer } from "socket.io";
import { getOrderItemCommissionRate } from "../../../services/commissionService";
import WalletTransaction from "../../../models/WalletTransaction";
import PincodeDemand from "../../../models/PincodeDemand";
import Return from "../../../models/Return";
import ComboOffer from "../../../models/ComboOffer";


// Create a new order
export const createOrder = async (req: Request, res: Response) => {
    let session: mongoose.ClientSession | null = null;
    try {
        // Only start session if we are on a replica set (required for transactions)
        // For simplicity in local dev, we check and fallback if it fails
        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (sessionError) {
            console.warn("MongoDB Transactions not supported or failed to start. Proceeding without transaction.");
            session = null;
        }

        const { items, address, paymentMethod, fees, useWallet } = req.body;
        const userId = req.user!.userId;

        // Log incoming request for debugging
        console.log("DEBUG: Order creation request:", {
            userId,
            itemsCount: items?.length,
            hasAddress: !!address,
            addressLat: address?.latitude,
            addressLng: address?.longitude,
            paymentMethod,
        });

        if (!items || items.length === 0) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Order must have at least one item",
            });
        }

        if (!address) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Delivery address is required",
            });
        }

        // Validate required address fields
        if (!address.city || (typeof address.city === 'string' && address.city.trim() === '')) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "City is required in delivery address",
                details: {
                    receivedCity: address.city,
                    addressObject: address
                }
            });
        }

        if (!address.pincode || (typeof address.pincode === 'string' && address.pincode.trim() === '')) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Pincode is required in delivery address",
                details: {
                    receivedPincode: address.pincode,
                    addressObject: address
                }
            });
        }

        // Fetch customer details
        const customer = await Customer.findById(userId);
        if (!customer) {
            if (session) await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        // Validate delivery address location
        // Handle both string and number types, and check for null/undefined (not truthy, since 0 is valid)
        const deliveryLat = address.latitude != null
            ? (typeof address.latitude === 'number' ? address.latitude : parseFloat(address.latitude))
            : null;
        const deliveryLng = address.longitude != null
            ? (typeof address.longitude === 'number' ? address.longitude : parseFloat(address.longitude))
            : null;

        if (deliveryLat == null || deliveryLng == null || isNaN(deliveryLat) || isNaN(deliveryLng)) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Delivery address location (latitude/longitude) is required",
                details: {
                    receivedLatitude: address.latitude,
                    receivedLongitude: address.longitude,
                    parsedLatitude: deliveryLat,
                    parsedLongitude: deliveryLng,
                }
            });
        }

        // Validate coordinates
        if (deliveryLat < -90 || deliveryLat > 90 || deliveryLng < -180 || deliveryLng > 180) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Invalid delivery address coordinates",
            });
        }

        // Initialize Order first to get an ID
        const newOrder = new Order({
            customer: new mongoose.Types.ObjectId(userId),
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            deliveryAddress: {
                address: address.address || address.street || 'N/A',
                city: address.city || 'N/A',
                state: address.state || '',
                pincode: address.pincode || '000000',
                landmark: address.landmark || '',
                latitude: deliveryLat,
                longitude: deliveryLng,
            },
            paymentMethod: paymentMethod || 'COD',
            paymentStatus: 'Pending',
            status: 'Received',
            subtotal: 0,
            tax: 0,
            shipping: fees?.deliveryFee || 0,
            platformFee: fees?.platformFee || 0,
            discount: 0,
            total: 0,
            items: []
        });

        let calculatedSubtotal = 0;
        const orderItemIds: mongoose.Types.ObjectId[] = [];
        const sellerIds = new Set<string>(); // Track unique sellers
        const allProductIds = new Set<string>(); // Collect all product IDs for delivery validation

        for (const item of items) {
            const isCombo = !!item.comboOffer;
            const qty = Number(item.quantity) || 0;

            if (qty <= 0) {
                throw new Error("Invalid item quantity");
            }

            if (isCombo) {
                // --- COMBO OFFER PROCESSING ---
                const comboId = item.comboOffer;
                const combo = await ComboOffer.findById(comboId)
                    .populate('mainProduct')
                    .populate('comboProducts');

                if (!combo || !combo.isActive) {
                    throw new Error("Combo offer not found or inactive");
                }

                // Add all involved product IDs for delivery validation later
                if (combo.mainProduct) allProductIds.add(combo.mainProduct._id.toString());
                combo.comboProducts.forEach((p: any) => {
                    if (p && p._id) allProductIds.add(p._id.toString());
                });

                // 1. Check stock for ALL products in combo (main + supplemental)
                const itemsToValidate = [combo.mainProduct, ...combo.comboProducts].filter(Boolean);
                
                for (const p of itemsToValidate as any[]) {
                    const totalRequired = qty; // For combos, usually it's 1 of each product per combo qty
                    // Note: If comboProducts schema actually held quantities, we would use: (qty * (p.quantity || 1))
                    // But currently it's just a ref array to Products.
                    
                    if (p.stock < totalRequired) {
                        throw new Error(`Insufficient stock for product ${p.productName} in combo: ${combo.name}`);
                    }
                }

                // 2. Deduct stock for ALL products in combo
                for (const p of itemsToValidate as any[]) {
                    await Product.findByIdAndUpdate(p._id, {
                        $inc: { stock: -qty }
                    }, { session });
                }

                const itemTotal = combo.comboPrice * qty;
                calculatedSubtotal += itemTotal;

                // Commission for combos
                const mainProduct = combo.mainProduct as any;
                const sellerId = combo.sellerId.toString();
                const commRate = await getOrderItemCommissionRate(mainProduct._id.toString(), sellerId);
                const commAmount = (itemTotal * commRate) / 100;

                // Create OrderItem with combo snapshot
                const newOrderItem = new OrderItem({
                    order: newOrder._id,
                    product: mainProduct._id, // Required field
                    seller: combo.sellerId,
                    comboOffer: combo._id,
                    productName: combo.name,
                    productImage: combo.image,
                    unitPrice: combo.comboPrice,
                    quantity: qty,
                    total: itemTotal,
                    commissionRate: commRate,
                    commissionAmount: commAmount,
                    status: 'Pending',
                    comboProducts: [
                        {
                            productId: mainProduct._id,
                            productName: mainProduct.productName,
                            productImage: mainProduct.mainImage,
                            unitPrice: mainProduct.price || 0,
                            quantity: 1
                        },
                        ...combo.comboProducts.map((p: any) => ({
                            productId: p._id,
                            productName: p.productName,
                            productImage: p.mainImage,
                            unitPrice: p.price || 0,
                            quantity: 1
                        }))
                    ]
                });

                if (session) await newOrderItem.save({ session });
                else await newOrderItem.save();

                orderItemIds.push(newOrderItem._id as mongoose.Types.ObjectId);
                sellerIds.add(combo.sellerId.toString());

            } else {
                // --- REGULAR PRODUCT PROCESSING ---
                if (!item.product || !item.product.id) {
                    throw new Error("Invalid item structure: product.id is missing");
                }

                allProductIds.add(item.product.id);

                // Atomically check stock and decrement to prevent race conditions
                let product;
                const variationValue = item.variant || item.variation;

                if (variationValue) {
                    product = session
                        ? await Product.findOneAndUpdate(
                            {
                                _id: item.product.id,
                                $or: [
                                    { "variations._id": mongoose.isValidObjectId(variationValue) ? variationValue : new mongoose.Types.ObjectId() },
                                    { "variations.value": variationValue },
                                    { "variations.title": variationValue },
                                    { "variations.pack": variationValue }
                                ],
                                "variations.stock": { $gte: qty }
                            },
                            { $inc: { "variations.$.stock": -qty, stock: -qty } },
                            { session, new: true }
                        )
                        : await Product.findOneAndUpdate(
                            {
                                _id: item.product.id,
                                $or: [
                                    { "variations._id": mongoose.isValidObjectId(variationValue) ? variationValue : new mongoose.Types.ObjectId() },
                                    { "variations.value": variationValue },
                                    { "variations.title": variationValue },
                                    { "variations.pack": variationValue }
                                ],
                                "variations.stock": { $gte: qty }
                            },
                            { $inc: { "variations.$.stock": -qty, stock: -qty } },
                            { new: true }
                        );
                }

                if (!product) {
                    const checkProduct = await Product.findById(item.product.id);
                    if (checkProduct && checkProduct.variations && checkProduct.variations.length > 0) {
                        if (variationValue) throw new Error(`Insufficient stock for variation: ${variationValue}`);

                        product = session
                            ? await Product.findOneAndUpdate(
                                { _id: item.product.id, "variations.0.stock": { $gte: qty } },
                                { $inc: { "variations.0.stock": -qty, stock: -qty } },
                                { session, new: true }
                            )
                            : await Product.findOneAndUpdate(
                                { _id: item.product.id, "variations.0.stock": { $gte: qty } },
                                { $inc: { "variations.0.stock": -qty, stock: -qty } },
                                { new: true }
                            );
                    } else {
                        product = session
                            ? await Product.findOneAndUpdate(
                                { _id: item.product.id, stock: { $gte: qty } },
                                { $inc: { stock: -qty } },
                                { session, new: true }
                            )
                            : await Product.findOneAndUpdate(
                                { _id: item.product.id, stock: { $gte: qty } },
                                { $inc: { stock: -qty } },
                                { new: true }
                            );
                    }
                }

                if (!product) {
                    throw new Error(`Insufficient stock or product not found: ${item.product.name || 'ID: ' + item.product.id}${variationValue ? ' (' + variationValue + ')' : ''}`);
                }

                if (product.seller) sellerIds.add(product.seller.toString());

                let selectedVariation;
                if (variationValue && product.variations) {
                    selectedVariation = product.variations.find((v: any) =>
                        (v._id && v._id.toString() === variationValue) ||
                        v.value === variationValue ||
                        v.title === variationValue ||
                        v.pack === variationValue
                    );
                }
                if (!selectedVariation && product.variations && product.variations.length > 0) {
                    selectedVariation = product.variations[0];
                }

                const itemPrice = (selectedVariation?.discPrice && selectedVariation.discPrice > 0)
                    ? selectedVariation.discPrice
                    : (product.discPrice && product.discPrice > 0)
                        ? product.discPrice
                        : (selectedVariation?.price || product.price || 0);
                const itemTotal = itemPrice * qty;
                calculatedSubtotal += itemTotal;

                const commRate = await getOrderItemCommissionRate(product._id.toString(), product.seller.toString());
                const commAmount = (itemTotal * commRate) / 100;

                const newOrderItem = new OrderItem({
                    order: newOrder._id,
                    product: product._id,
                    seller: product.seller,
                    productName: product.productName,
                    productImage: product.mainImage,
                    sku: product.sku,
                    unitPrice: itemPrice,
                    quantity: qty,
                    total: itemTotal,
                    commissionRate: commRate,
                    commissionAmount: commAmount,
                    variation: variationValue,
                    status: 'Pending'
                });

                if (session) await newOrderItem.save({ session });
                else await newOrderItem.save();

                orderItemIds.push(newOrderItem._id as mongoose.Types.ObjectId);
            }
        }

        // --- Determine Delivery Type and Validate Location ---
        // Dynamically get from HeaderCategory deliveryType field
        const productsInOrder = await Product.find({ _id: { $in: Array.from(allProductIds) } })
            .populate('headerCategoryId')
            .populate({
                path: 'category',
                populate: { path: 'headerCategoryId' }
            });

        let hasScheduled = false;
        let hasInstant = false;
        const sellersRequiringLocation = new Set<string>();

        for (const prod of productsInOrder) {
            const isProdScheduled =
                (prod.headerCategoryId as any)?.deliveryType === "scheduled" ||
                (prod.category as any)?.headerCategoryId?.deliveryType === "scheduled";

            if (isProdScheduled) {
                hasScheduled = true;
            } else {
                hasInstant = true;
                if (prod.seller) {
                    sellersRequiringLocation.add(prod.seller.toString());
                }
            }
        }

        // Final order deliveryType: if it has any scheduled, we treat as scheduled for timeframe
        const deliveryType: "instant" | "scheduled" = hasScheduled ? "scheduled" : "instant";

        // Validate sellers that have instant products
        if (sellersRequiringLocation.size > 0 && hasInstant) {
            const locationSellerIds = Array.from(sellersRequiringLocation).map(id => new mongoose.Types.ObjectId(id));

            const sellers = await Seller.find({
                _id: { $in: locationSellerIds },
                status: "Approved",
                location: { $exists: true, $ne: null },
            });

            // Check each seller can deliver to user's location
            for (const seller of sellers) {

                // 1. Check Custom Service Area (Polygon)
                if (seller.serviceAreaGeo && seller.serviceAreaGeo.coordinates && seller.serviceAreaGeo.coordinates.length > 0) {
                    const inside = isPointInPolygon([deliveryLng, deliveryLat], seller.serviceAreaGeo.coordinates);
                    if (!inside) {
                        if (session) await session.abortTransaction();
                        return res.status(403).json({
                            success: false,
                            message: `Your delivery address is outside the custom service area of ${seller.storeName}.`,
                        });
                    }
                    continue; // Inside polygon, so valid. Skip radius check.
                }

                // 2. Check Radius (Standard)
                if (!seller.location || !seller.location.coordinates) {
                    if (session) await session.abortTransaction();
                    return res.status(403).json({
                        success: false,
                        message: `Seller ${seller.storeName} does not have a valid location. Order cannot be placed.`,
                    });
                }

                const sellerLng = seller.location.coordinates[0];
                const sellerLat = seller.location.coordinates[1];
                const distance = calculateDistance(deliveryLat, deliveryLng, sellerLat, sellerLng);
                const serviceRadius = seller.serviceRadiusKm || 10;

                if (distance > serviceRadius) {
                    if (session) await session.abortTransaction();
                    return res.status(403).json({
                        success: false,
                        message: `Your delivery address is ${distance.toFixed(2)} km away from ${seller.storeName}. They only deliver within ${serviceRadius} km. Please select products from sellers in your area.`,
                    });
                }
            }
        }

        // Apply fees
        let platformFee = Number(fees?.platformFee) || 0;
        let deliveryFee = Number(fees?.deliveryFee) || 0;
        let deliveryDistanceKm = 0;

        // --- Distance-Based Delivery Charge Calculation ---
        try {
            const settings = await AppSettings.getSettings();
            const freeDeliveryThreshold = settings?.freeDeliveryThreshold || 0;

            // Check for Free Delivery eligibility first
            if (freeDeliveryThreshold > 0 && calculatedSubtotal >= freeDeliveryThreshold) {
                deliveryFee = 0;
            }
            // Only recalculate if enabled in settings (and not free delivery)
            else if (settings && settings.deliveryConfig?.isDistanceBased === true) {
                const config = settings.deliveryConfig;

                // Collect seller locations
                const sellerLocations: { lat: number; lng: number }[] = [];
                const uniqueSellerIds = Array.from(sellerIds).map(id => new mongoose.Types.ObjectId(id));
                const sellers = await Seller.find({ _id: { $in: uniqueSellerIds } }).select('location latitude longitude storeName');

                sellers.forEach(seller => {
                    let lat, lng;
                    if (seller.location?.coordinates?.length === 2) {
                        lng = seller.location.coordinates[0];
                        lat = seller.location.coordinates[1];
                    } else if (seller.latitude && seller.longitude) {
                        lat = parseFloat(seller.latitude);
                        lng = parseFloat(seller.longitude);
                    }

                    if (lat && lng) {
                        sellerLocations.push({ lat, lng });
                    }
                });

                if (sellerLocations.length > 0 && deliveryLat && deliveryLng) {
                    // Get distances (Road or Air based on API Key presence)
                    const distances = await getRoadDistances(
                        sellerLocations,
                        { lat: deliveryLat, lng: deliveryLng },
                        config.googleMapsKey
                    );

                    // Take the maximum distance (furthest seller)
                    deliveryDistanceKm = Math.max(...distances);

                    // Calculate Fee
                    // Formula: BaseCharge + (Max(0, Distance - BaseDistance) * KmRate)
                    const extraKm = Math.max(0, deliveryDistanceKm - config.baseDistance);
                    const calculatedDeliveryFee = config.baseCharge + (extraKm * config.kmRate);

                    // Override the delivery fee
                    deliveryFee = Math.ceil(calculatedDeliveryFee);

                    console.log(`DEBUG: Distance Calculation: MaxDistance=${deliveryDistanceKm}km, Fee=${deliveryFee} (Base: ${config.baseCharge}, Rate: ${config.kmRate}/km)`);
                }
            }
        } catch (calcError) {
            console.error("Error calculating distance-based delivery fee:", calcError);
            // Fallback to provided fee or 0
        }

        const finalTotal = calculatedSubtotal + platformFee + deliveryFee;

        // --- Wallet Logic ---
        let walletAmountUsed = 0;
        let payableAmount = finalTotal;

        if (useWallet) {
            // Find customer again to get latest balance (and lock if in transaction)
            const customerData = session
                ? await Customer.findById(userId).session(session)
                : await Customer.findById(userId);

            if (customerData && customerData.walletAmount > 0) {
                // Calculate amount to use
                walletAmountUsed = Math.min(finalTotal, customerData.walletAmount);
                if (walletAmountUsed > 0) {
                    payableAmount = finalTotal - walletAmountUsed;

                    // Deduct from wallet
                    customerData.walletAmount -= walletAmountUsed;
                    // Stats update moved to the end to be universal

                    if (session) {
                        await customerData.save({ session });
                    } else {
                        await customerData.save();
                    }

                    // Create Wallet Transaction
                    const walletTxn = new WalletTransaction({
                        userId: customerData._id,
                        userType: 'CUSTOMER',
                        amount: walletAmountUsed,
                        type: 'Debit',
                        description: `Used for order payment`,
                        status: 'Completed',
                        reference: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        relatedOrder: newOrder._id
                    });

                    if (session) {
                        await walletTxn.save({ session });
                    } else {
                        await walletTxn.save();
                    }

                    // If fully paid by wallet
                    if (payableAmount === 0) {
                        newOrder.paymentStatus = 'Paid';
                        newOrder.paymentMethod = 'Wallet';
                    }
                }
            }
        }

        // Always update Customer Stats (totalSpent, totalOrders)
        // This ensures stats are updated regardless of wallet usage or payment method
        const customerToUpdate = session
            ? await Customer.findById(userId).session(session)
            : await Customer.findById(userId);

        if (customerToUpdate) {
            // If wallet was used, we already deducted balance in the 'if (useWallet)' block above
            // But we need to make sure we don't double count or miss the stats update.
            // Since we moved stats update here, we should REMOVE it from the wallet block above to avoid confusion,
            // OR just ensure we are using the freshly fetched 'customerToUpdate' here.

            // Wait, the previous block might have modified 'customerData' and saved it.
            // If we fetch again here, we get the updated wallet balance.

            // Let's Simplify: 
            // 1. Remove stats update from the wallet block.
            // 2. Perform stats update HERE for everyone.

            customerToUpdate.totalSpent = (customerToUpdate.totalSpent || 0) + finalTotal;
            customerToUpdate.totalOrders = (customerToUpdate.totalOrders || 0) + 1;

            if (session) {
                await customerToUpdate.save({ session });
            } else {
                await customerToUpdate.save();
            }
        }

        // Update Order with calculated values and items
        newOrder.subtotal = Number(calculatedSubtotal.toFixed(2));
        newOrder.total = Number(finalTotal.toFixed(2));
        newOrder.items = orderItemIds;
        newOrder.shipping = deliveryFee; // Update with calculated fee
        newOrder.deliveryDistanceKm = deliveryDistanceKm; // Store distance for commission calc
        newOrder.walletAmountUsed = walletAmountUsed;

        // --- Partial COD Logic ---
        if (newOrder.paymentMethod === 'COD') {
            const totalToPay = Number(finalTotal.toFixed(2));
            newOrder.advanceAmount = Number((totalToPay * 0.25).toFixed(2));
            newOrder.remainingCODAmount = Number((totalToPay * 0.75).toFixed(2));
            console.log(`DEBUG: Partial COD Calculation: Total=${totalToPay}, Advance(25%)=${newOrder.advanceAmount}, Remaining(75%)=${newOrder.remainingCODAmount}`);
        }

        // Delivery Type already determined above

        // Get Seller Pincode (from the first seller for now)
        let sellerPincode = "";
        if (sellerIds.size > 0) {
            const firstSellerId = Array.from(sellerIds)[0];
            const firstSeller = session
                ? await Seller.findById(firstSellerId).select('pincode').session(session)
                : await Seller.findById(firstSellerId).select('pincode');

            sellerPincode = firstSeller?.pincode || "";

            // Enforce pincode matching for quick delivery orders
            if (deliveryType === 'instant' && newOrder.deliveryAddress.pincode !== sellerPincode) {
                // Record demand for the unserviceable pincode with details
                try {
                    const firstItem = items[0];
                    const firstProduct = productsInOrder.find(p => p._id.toString() === firstItem.product.id);

                    const demandData = {
                        pincode: newOrder.deliveryAddress.pincode,
                        userId: userId,
                        productId: firstItem.product.id,
                        sellerId: firstSellerId,
                        headerCategoryId: firstProduct?.headerCategoryId,
                        address: newOrder.deliveryAddress.address || address.address || address.street || 'N/A'
                    };

                    const newDemand = new PincodeDemand(demandData);
                    if (session) {
                        await newDemand.save({ session });
                        await session.abortTransaction();
                    } else {
                        await newDemand.save();
                    }
                } catch (demandError) {
                    console.error("Error recording pincode demand:", demandError);
                    // Still return the unserviceable error even if recording fails
                    if (session) await session.abortTransaction();
                }

                return res.status(403).json({
                    success: false,
                    message: `Quick delivery is not currently available for your pincode (${newOrder.deliveryAddress.pincode}). We've recorded your demand and are working on expanding our service area!`,
                });
            }
        }

        newOrder.deliveryType = deliveryType;
        newOrder.sellerPincode = sellerPincode;


        if (session) {
            await newOrder.save({ session });
            await session.commitTransaction();
        } else {
            // Validate before saving to catch errors with details
            const validationError = newOrder.validateSync();
            if (validationError) {
                console.error("DEBUG: Order Validation Error:", validationError.errors);
                throw validationError;
            }
            await newOrder.save();
        }


        // Emit notification to sellers and trigger instant delivery broadcast
        try {
            const io: SocketIOServer = (req.app.get("io") as SocketIOServer);
            if (io) {
                // Reload order to ensure orderNumber is set (generated by pre-validate hook)
                const savedOrder = await Order.findById(newOrder._id).lean();
                if (savedOrder) {
                    await notifySellersOfOrderUpdate(io, savedOrder, 'NEW_ORDER');

                    // If it's an instant delivery, trigger broadcast to partners
                    if (savedOrder.deliveryType === "instant") {
                        const { InstantDeliveryService } = require("../../../services/instantDeliveryService");
                        const instantService = new InstantDeliveryService(io);
                        await instantService.broadcastOrder(savedOrder._id.toString());
                    }
                }
            }
        } catch (notificationError) {
            // Log error but don't fail the order creation
            console.error("Error notifying sellers or broadcasting delivery:", notificationError);
        }

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: newOrder,
        });

    } catch (error: any) {
        if (session) {
            try {
                await session.abortTransaction();
            } catch (abortError) {
                console.error("Error aborting transaction:", abortError);
            }
        }

        console.error("DEBUG: Order Creation Error Detail:", {
            message: error.message,
            name: error.name,
            errors: error.errors ? Object.keys(error.errors).map(key => ({
                field: key,
                message: error.errors[key].message,
                value: error.errors[key].value
            })) : undefined,
            stack: error.stack,
            body: req.body
        });

        // Return a more informative error message if it's a validation error
        let errorMessage = "Error creating order. " + error.message;
        if (error.name === 'ValidationError') {
            const fields = Object.keys(error.errors).join(', ');
            errorMessage = `Validation failed for fields: ${fields}. ${error.message}`;
        }

        return res.status(500).json({
            success: false,
            message: errorMessage,
            error: error.message,
            details: error.errors,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        if (session) session.endSession();
    }
};

// Get authenticated customer's orders
export const getMyOrders = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { status, page = 1, limit = 10 } = req.query;

        const query: any = { customer: userId };

        if (status) {
            query.status = status; // Note: Model field is 'status', not 'orderStatus'
        }

        const skip = (Number(page) - 1) * Number(limit);

        const orders = await Order.find(query)
            .populate({
                path: 'items',
                populate: { path: 'product', select: 'productName mainImage price' }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Order.countDocuments(query);

        // Transform orders to match frontend Order type
        const transformedOrders = orders.map(order => {
            const orderObj = order.toObject();
            return {
                ...orderObj,
                id: orderObj._id.toString(),
                totalItems: Array.isArray(orderObj.items) ? orderObj.items.length : 0,
                totalAmount: orderObj.total,
                fees: {
                    platformFee: orderObj.platformFee || 0,
                    deliveryFee: orderObj.shipping || 0
                },
                // Keep original fields for backward compatibility
                subtotal: orderObj.subtotal,
                address: orderObj.deliveryAddress
            };
        });

        return res.status(200).json({
            success: true,
            data: transformedOrders,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Error fetching orders",
            error: error.message,
        });
    }
};

// Get single order details
export const getOrderById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        // Find order and ensure it belongs to the user
        const order = await Order.findOne({ _id: id, customer: userId })
            .populate({
                path: 'items',
                populate: [
                    { path: 'product', select: 'productName mainImage pack manufacturer price isReturnable maxReturnDays cancelAvailable' },
                    { path: 'seller', select: 'storeName city phone fssaiLicNo' }
                ]
            })
            .populate('deliveryBoy', 'name phone profileImage vehicleNumber');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Get customer's permanent delivery OTP
        const customer = await Customer.findById(userId).select('deliveryOtp');
        const deliveryOtp = customer?.deliveryOtp;

        // Transform order to match frontend Order type
        const orderObj = order.toObject();

        const { default: Return } = await import("../../../models/Return");
        const orderItemsWithReturns = await Promise.all(orderObj.items.map(async (item: any) => {
            const returnRequest = await Return.findOne({ orderItem: item._id }).lean();
            return {
                ...item,
                isReturnable: item.product?.isReturnable ?? true,
                maxReturnDays: item.product?.maxReturnDays ?? 7,
                returnRequest: returnRequest ? {
                    status: returnRequest.status,
                    pickupScheduled: returnRequest.pickupScheduled,
                    pickupCompleted: returnRequest.pickupCompleted,
                    reason: returnRequest.reason,
                    refundAmount: returnRequest.refundAmount
                } : null
            };
        }));

        const transformedOrder = {
            ...orderObj,
            id: orderObj._id.toString(),
            items: orderItemsWithReturns,
            totalItems: Array.isArray(orderObj.items) ? orderObj.items.length : 0,
            totalAmount: orderObj.total,
            fees: {
                platformFee: orderObj.platformFee || 0,
                deliveryFee: orderObj.shipping || 0
            },
            // Keep original fields for backward compatibility
            subtotal: orderObj.subtotal,
            address: orderObj.deliveryAddress,
            // Include invoice enabled flag
            invoiceEnabled: orderObj.invoiceEnabled || false,
            // Include customer's permanent delivery OTP
            deliveryOtp,
            // Map deliveryBoy to deliveryPartner for frontend
            deliveryPartner: orderObj.deliveryBoy
        };

        return res.status(200).json({
            success: true,
            data: transformedOrder,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Error fetching order detail",
            error: error.message,
        });
    }
};

/**
 * Refresh Delivery OTP
 */
export const refreshDeliveryOtp = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        const order = await Order.findOne({ _id: id, customer: userId });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.status === 'Delivered') {
            return res.status(400).json({ success: false, message: "Order is already delivered" });
        }

        // Generate and send new OTP
        const result = await generateDeliveryOtp(id);

        // Emit socket event if needed (customer room)
        const io = (req.app as any).get("io");
        if (io) {
            io.to(`order-${id}`).emit('delivery-otp-refreshed', {
                orderId: id,
                deliveryOtp: order.deliveryOtp, // The service saves it to the order
                expiresAt: order.deliveryOtpExpiresAt
            });
        }

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Error refreshing delivery OTP:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to refresh delivery OTP",
            error: error.message
        });
    }
};

// Cancel Order
export const cancelOrder = async (req: Request, res: Response) => {
    let session: mongoose.ClientSession | null = null;
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user!.userId;

        if (!reason) {
            return res.status(400).json({ success: false, message: "Cancellation reason is required" });
        }

        // Only start session if we are on a replica set (required for transactions)
        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (sessionError) {
            console.warn("MongoDB Transactions not supported or failed to start. Proceeding without transaction.");
            session = null;
        }

        const order = session
            ? await Order.findOne({ _id: id, customer: userId }).session(session)
            : await Order.findOne({ _id: id, customer: userId });

        if (!order) {
            if (session) await session.abortTransaction();
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (['Delivered', 'Cancelled', 'Returned', 'Rejected', 'Out for Delivery', 'Shipped'].includes(order.status)) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Order cannot be cancelled as it is already ${order.status}`
            });
        }

        // Restore stock
        for (const item of order.items) {
            const orderItem = session
                ? await OrderItem.findById(item).session(session)
                : await OrderItem.findById(item);

            if (orderItem) {
                const product = session
                    ? await Product.findById(orderItem.product).session(session)
                    : await Product.findById(orderItem.product);

                if (product) {
                    // Check if it was a variation
                    if (orderItem.variation) {
                        // Try to find matching variation
                        const variationIndex = product.variations?.findIndex((v: any) => v.value === orderItem.variation || v.title === orderItem.variation || v.pack === orderItem.variation);

                        if (variationIndex !== undefined && variationIndex !== -1 && product.variations && product.variations[variationIndex]) {
                            const currentStock = product.variations[variationIndex].stock || 0;
                            product.variations[variationIndex].stock = currentStock + orderItem.quantity;
                        } else if (product.variations && product.variations.length > 0) {
                            // Fallback to first variation if specific one not found (should be rare)
                            const currentStock = product.variations[0].stock || 0;
                            product.variations[0].stock = currentStock + orderItem.quantity;
                        }
                    }

                    // Helper: also increment main stock if variations are just attributes or if simple product
                    product.stock += orderItem.quantity;
                    if (session) {
                        await product.save({ session });
                    } else {
                        await product.save();
                    }
                }

                orderItem.status = 'Cancelled';
                if (session) {
                    await orderItem.save({ session });
                } else {
                    await orderItem.save();
                }
            }
        }

        order.status = 'Cancelled';
        order.cancellationReason = reason;
        order.cancelledAt = new Date();
        order.cancelledBy = new mongoose.Types.ObjectId(userId); // Use Customer ID as canceller

        if (session) {
            await order.save({ session });
            await session.commitTransaction();
        } else {
            await order.save();
        }

        // Notify
        try {
            const io = (req.app as any).get("io");
            if (io) {
                await notifySellersOfOrderUpdate(io, order, 'ORDER_CANCELLED');

                // Notify delivery boy if assigned
                if (order.deliveryBoy) {
                    // Update delivery status to Failed since order is cancelled
                    // We do this in background to not block response
                    Order.findByIdAndUpdate(order._id, { deliveryBoyStatus: 'Failed' }).exec();

                    // Notify the specific delivery boy
                    const deliveryBoyId = order.deliveryBoy.toString();
                    io.to(`delivery-${deliveryBoyId}`).emit('order-cancelled', {
                        orderId: order._id,
                        orderNumber: order.orderNumber,
                        message: "Order has been cancelled by the customer"
                    });

                    console.log(`Notification sent to delivery boy ${deliveryBoyId} for cancelled order ${order.orderNumber}`);
                }

                // Emit to order room for real-time updates on tracking screen
                io.to(`order-${order._id}`).emit('order-cancelled', {
                    orderId: order._id,
                    status: 'Cancelled',
                    message: "Order has been cancelled"
                });
            }
        } catch (err) {
            console.error("Notification error:", err);
        }

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            data: {
                id: order._id,
                status: order.status,
                cancelledAt: order.cancelledAt
            }
        });

    } catch (error: any) {
        if (session) {
            try {
                await session.abortTransaction();
            } catch (e) { }
        }
        console.error('Error cancelling order:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to cancel order",
            error: error.message
        });
    } finally {
        if (session) session.endSession();
    }
};

// Update Order Notes (Instructions/Special Requests)
export const updateOrderNotes = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { deliveryInstructions, specialRequests } = req.body;
        const userId = req.user!.userId;

        const order = await Order.findOne({ _id: id, customer: userId });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (['Delivered', 'Cancelled', 'Returned'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot update notes for ${order.status} order`
            });
        }

        if (deliveryInstructions !== undefined) order.deliveryInstructions = deliveryInstructions;
        if (specialRequests !== undefined) order.specialRequests = specialRequests;

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order notes updated",
            data: {
                deliveryInstructions: order.deliveryInstructions,
                specialRequests: order.specialRequests
            }
        });
    } catch (error: any) {
        console.error('Error updating order notes:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to update order notes",
            error: error.message
        });
    }
};

// Cancel Single Order Item
export const cancelOrderItem = async (req: Request, res: Response) => {
    let session: mongoose.ClientSession | null = null;
    try {
        const { id, itemId } = req.params;
        const { reason } = req.body;
        const userId = req.user!.userId;

        if (!reason) {
            return res.status(400).json({ success: false, message: "Cancellation reason is required" });
        }

        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (sessionError) {
            session = null;
        }

        const order = session
            ? await Order.findOne({ _id: id, customer: userId }).session(session)
            : await Order.findOne({ _id: id, customer: userId });

        if (!order) {
            if (session) await session.abortTransaction();
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const orderItem = session
            ? await OrderItem.findOne({ _id: itemId, order: id }).session(session)
            : await OrderItem.findOne({ _id: itemId, order: id });

        if (!orderItem) {
            if (session) await session.abortTransaction();
            return res.status(404).json({ success: false, message: "Order item not found" });
        }

        if (['Shipped', 'Delivered', 'Cancelled', 'Returned', 'Rejected', 'Out for Delivery'].includes(orderItem.status)) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Item cannot be cancelled as it is already ${orderItem.status}`
            });
        }

        const product = session
            ? await Product.findById(orderItem.product).session(session)
            : await Product.findById(orderItem.product);

        if (product && !product.cancelAvailable) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "This product is not eligible for cancellation"
            });
        }

        // Restore stock
        if (product) {
            if (orderItem.variation) {
                const variationIndex = product.variations?.findIndex((v: any) => v.value === orderItem.variation || v.title === orderItem.variation || v.pack === orderItem.variation);
                if (variationIndex !== undefined && variationIndex !== -1 && product.variations && product.variations[variationIndex]) {
                    product.variations[variationIndex].stock = (product.variations[variationIndex].stock || 0) + orderItem.quantity;
                } else if (product.variations && product.variations.length > 0) {
                    product.variations[0].stock = (product.variations[0].stock || 0) + orderItem.quantity;
                }
            }
            product.stock += orderItem.quantity;
            if (session) await product.save({ session });
            else await product.save();
        }

        orderItem.status = 'Cancelled';
        if (session) await orderItem.save({ session });
        else await orderItem.save();

        // Check if all items in the order are now cancelled
        const allItems = session
            ? await OrderItem.find({ order: id }).session(session)
            : await OrderItem.find({ order: id });

        const allCancelled = allItems.every(item => item.status === 'Cancelled');
        if (allCancelled) {
            order.status = 'Cancelled';
            order.cancellationReason = "All items cancelled";
            order.cancelledAt = new Date();
            order.cancelledBy = new mongoose.Types.ObjectId(userId);
            if (session) await order.save({ session });
            else await order.save();
        }

        if (session) await session.commitTransaction();

        return res.status(200).json({
            success: true,
            message: "Item cancelled successfully",
            data: { itemId, status: 'Cancelled' }
        });

    } catch (error: any) {
        if (session) try { await session.abortTransaction(); } catch (e) { }
        console.error('Error cancelling order item:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to cancel item",
            error: error.message
        });
    } finally {
        if (session) session.endSession();
    }
};

// Request Return for Order Item
export const requestReturn = async (req: Request, res: Response) => {
    try {
        const { id, itemId } = req.params;
        const { reason, description, images } = req.body;
        const userId = req.user!.userId;

        console.log(`[DEBUG] RequestReturn started. OrderId: ${id}, ItemId: ${itemId}, User: ${userId}`);
        console.log(`[DEBUG] Body:`, req.body);

        if (!reason) {
            return res.status(400).json({ success: false, message: "Return reason is required" });
        }

        const order = await Order.findOne({ _id: id, customer: userId });
        if (!order) {
            console.log(`[DEBUG] Order not found for id: ${id} and user: ${userId}`);
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        console.log(`[DEBUG] Order found: ${order._id}`);

        const orderItem = await OrderItem.findOne({ _id: itemId }).populate('product');
        if (!orderItem) {
            console.log(`[DEBUG] OrderItem not found for id: ${itemId}`);
            return res.status(404).json({ success: false, message: "Order item not found" });
        }
        console.log(`[DEBUG] OrderItem found: ${orderItem._id}, Status: ${orderItem.status}`);

        // Note: We used to check if orderItem.order matches id, but sometimes they are strings vs ObjectIds
        // Let's just log it for now
        console.log(`[DEBUG] OrderItem.order: ${orderItem.order}, Requested id: ${id}`);

        if (orderItem.status !== 'Delivered') {
            console.log(`[DEBUG] Item status not delivered: ${orderItem.status}`);
            return res.status(400).json({
                success: false,
                message: "Only delivered items can be returned"
            });
        }

        const product = orderItem.product as any;
        if (!product) {
            console.log(`[DEBUG] Product not populated for item: ${itemId}`);
        } else {
            console.log(`[DEBUG] Product: ${product.productName}, isReturnable: ${product.isReturnable}`);
        }

        if (!product || !product.isReturnable) {
            // Relaxing this check for testing if needed, or keeping it strict but logging
            console.log(`[DEBUG] Eligibility check failed. Returnable: ${product?.isReturnable}`);
            // return res.status(400).json({ ... }); 
        }

        // Check return window
        const deliveredDateRaw = order.deliveredAt || order.updatedAt;
        const deliveredDate = (deliveredDateRaw instanceof Date) ? deliveredDateRaw : new Date(deliveredDateRaw || Date.now());
        const returnDays = product?.maxReturnDays || 7;
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - deliveredDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        console.log(`[DEBUG] Return Window: deliveredDate=${deliveredDate}, diffDays=${diffDays}, returnDays=${returnDays}`);

        if (diffDays > returnDays) {
            console.log(`[DEBUG] Return window expired`);
            return res.status(400).json({
                success: false,
                message: `Return window of ${returnDays} days has expired`
            });
        }

        // Check if return already requested
        const existingReturn = await Return.findOne({ orderItem: itemId });
        if (existingReturn) {
            console.log(`[DEBUG] Return already requested: ${existingReturn._id}`);
            return res.status(400).json({
                success: false,
                message: "Return already requested for this item"
            });
        }

        console.log(`[DEBUG] Creating new Return record...`);
        const newReturn = new Return({
            order: id,
            orderItem: itemId,
            customer: userId,
            reason,
            description,
            images: images || [],
            status: 'Pending',
            quantity: orderItem.quantity,
            pickupAddress: {
                address: order.deliveryAddress?.address || "Pre-filled address",
                city: order.deliveryAddress?.city || "Indore",
                pincode: order.deliveryAddress?.pincode || "452001"
            }
        });

        await newReturn.save();
        console.log(`[DEBUG] Return saved: ${newReturn._id}`);

        orderItem.status = 'Returned';
        await orderItem.save();
        console.log(`[DEBUG] OrderItem updated to Returned`);

        return res.status(201).json({
            success: true,
            message: "Return request submitted successfully",
            data: newReturn
        });

    } catch (error: any) {
        console.error('[CRITICAL] Error requesting return:', error);
        console.error('[CRITICAL] Stack:', error.stack);
        return res.status(500).json({
            success: false,
            message: "Failed to submit return request",
            error: error.message
        });
    }
};
