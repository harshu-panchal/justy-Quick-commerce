import { Request, Response } from "express";
import Seller from "../../../models/Seller";
import Product from "../../../models/Product";
import PincodeDemand from "../../../models/PincodeDemand";

/**
 * Get quick delivery products
 * Logic:
 * 1. If pincode provided, find approved local sellers
 * 2. If local sellers found, return their products (available: true)
 * 3. If no pincode or no local sellers, return global quick products (available: false, isGlobal: true)
 */
export const getQuickDeliveryProducts = async (req: Request, res: Response) => {
    try {
        const { pincode } = req.query;
        let sellerIds: any[] = [];
        let isAvailable = false;

        if (pincode) {
            // Find sellers that match the pincode and are active
            const localSellers = await Seller.find({
                pincode: pincode as string,
                status: "Approved",
                isShopOpen: true,
                depositPaid: true,
                isPincodeActive: true,
            }).select("_id");
            
            if (localSellers && localSellers.length > 0) {
                sellerIds = localSellers.map((s) => s._id);
                isAvailable = true;
            }
        }

        const matchStage: any = {
            status: "Active",
            publish: true,
            stock: { $gt: 0 },
        };

        // If we have local sellers, filter by them. Otherwise, show global products.
        if (sellerIds.length > 0) {
            matchStage.seller = { $in: sellerIds };
        }

        /**
         * Filter products that:
         * 1. Are active, published, and in stock
         * 2. Have a HeaderCategory with deliveryType: 'quick' (either directly or via category)
         */
        const products = await Product.aggregate([
            { $match: matchStage },
            // Lookup HeaderCategory from product directly
            {
                $lookup: {
                    from: "headercategories",
                    localField: "headerCategoryId",
                    foreignField: "_id",
                    as: "directHeader",
                },
            },
            // Lookup Category to get its headerCategoryId
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "catDoc",
                },
            },
            { $unwind: { path: "$catDoc", preserveNullAndEmptyArrays: true } },
            // Lookup HeaderCategory from category
            {
                $lookup: {
                    from: "headercategories",
                    localField: "catDoc.headerCategoryId",
                    foreignField: "_id",
                    as: "catHeader",
                },
            },
            // Match if either direct header or category header is 'quick'
            {
                $match: {
                    $or: [
                        { "directHeader.deliveryType": "quick" },
                        {
                            $and: [
                                { "directHeader": { $size: 0 } }, // Header is missing on product
                                { "catHeader.deliveryType": "quick" },
                            ],
                        },
                        // Default to quick if NO header category is found at all (backwards compatibility for grocery)
                        {
                            $and: [
                                { "directHeader": { $size: 0 } },
                                { "catHeader": { $size: 0 } },
                            ],
                        },
                    ],
                },
            },
            { $sort: { rating: -1, createdAt: -1 } },
            { $limit: 20 },
            // Lookup seller details
            {
                $lookup: {
                    from: "sellers",
                    localField: "seller",
                    foreignField: "_id",
                    as: "sellerDetails",
                },
            },
            { $unwind: "$sellerDetails" },
            // Project to match expected frontend structure
            {
                $project: {
                    productName: 1,
                    smallDescription: 1,
                    description: 1,
                    mainImage: 1,
                    price: 1,
                    discPrice: 1,
                    compareAtPrice: 1,
                    stock: 1,
                    status: 1,
                    publish: 1,
                    rating: 1,
                    reviewsCount: 1,
                    discount: 1,
                    pack: 1,
                    tags: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    category: 1,
                    headerCategoryId: 1,
                    seller: {
                        _id: "$sellerDetails._id",
                        sellerName: "$sellerDetails.sellerName",
                        logo: "$sellerDetails.logo",
                        storeName: "$sellerDetails.storeName",
                    },
                },
            },
        ]);

        return res.status(200).json({
            success: true,
            available: isAvailable,
            isGlobal: !isAvailable,
            data: {
                products,
                sellers: isAvailable ? await Seller.find({ _id: { $in: sellerIds } }).select("_id sellerName logo storeName") : [],
            },
        });
    } catch (error: any) {
        console.error("Error in getQuickDeliveryProducts:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};

/**
 * Record pincode demand
 * Logic: Upsert based on pincode + category/product
 */
export const recordPincodeDemand = async (req: Request, res: Response) => {
    try {
        const { pincode, headerCategoryId, productId, userId, address } = req.body;

        if (!pincode) {
            return res.status(400).json({ success: false, message: "Pincode is required" });
        }

        // Search for existing demand for same pincode + category (or product)
        const filter: any = { pincode };
        if (headerCategoryId) filter.headerCategoryId = headerCategoryId;
        if (productId) filter.productId = productId;

        const update: any = {
            $inc: { count: 1 },
            $set: { updatedAt: new Date() }
        };

        if (userId) update.$set.userId = userId;
        if (address) update.$set.address = address;
        if (headerCategoryId) update.$set.headerCategoryId = headerCategoryId;
        if (productId) update.$set.productId = productId;

        await PincodeDemand.findOneAndUpdate(filter, update, { upsert: true, new: true });

        return res.status(200).json({
            success: true,
            message: "Demand recorded successfully"
        });
    } catch (error: any) {
        console.error("Error recordPincodeDemand:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to record demand"
        });
    }
};
