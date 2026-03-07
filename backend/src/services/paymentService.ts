import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment';
import Order from '../models/Order';
import mongoose from 'mongoose';

// Initialize Razorpay instance
const getRazorpayInstance = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new Error('Razorpay credentials not configured');
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
};

/**
 * Create a Razorpay order
 */
export const createRazorpayOrder = async (
    orderId: string,
    amount: number,
    currency: string = 'INR'
) => {
    try {
        const razorpay = getRazorpayInstance();

        const options = {
            amount: Math.round(amount * 100), // Amount in paise
            currency,
            receipt: orderId,
            notes: {
                orderId,
            },
        };

        const razorpayOrder = await razorpay.orders.create(options);

        return {
            success: true,
            data: {
                razorpayOrderId: razorpayOrder.id,
                razorpayKey: process.env.RAZORPAY_KEY_ID, // Send key to frontend
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                receipt: razorpayOrder.receipt,
            },
        };
    } catch (error: any) {
        console.error('Error creating Razorpay order:', error);
        return {
            success: false,
            message: error.message || 'Failed to create Razorpay order',
        };
    }
};

/**
 * Verify Razorpay payment signature
 */
export const verifyPaymentSignature = (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
): boolean => {
    try {
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keySecret) {
            throw new Error('Razorpay key secret not configured');
        }

        const body = razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(body)
            .digest('hex');

        console.log('--- Signature Verification ---');
        console.log('Order ID:', razorpayOrderId);
        console.log('Payment ID:', razorpayPaymentId);
        console.log('Expected:', expectedSignature);
        console.log('Received:', razorpaySignature);
        console.log('Matches:', expectedSignature === razorpaySignature);

        return expectedSignature === razorpaySignature;
    } catch (error) {
        console.error('Error verifying payment signature:', error);
        return false;
    }
};

/**
 * Capture payment and update order
 */
export const capturePayment = async (
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Verify signature
        const isValid = verifyPaymentSignature(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        );

        if (!isValid) {
            throw new Error('Invalid payment signature');
        }

        // Find order
        const order = await Order.findById(orderId).session(session);
        if (!order) {
            throw new Error('Order not found');
        }

        // Create payment record
        const payment = new Payment({
            order: orderId,
            customer: order.customer,
            paymentMethod: 'Online',
            paymentGateway: 'Razorpay',
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            amount: order.total,
            currency: 'INR',
            status: 'Completed',
            paidAt: new Date(),
            gatewayResponse: {
                success: true,
                message: 'Payment captured successfully',
            },
        });

        await payment.save({ session });

        // Update order
        order.paymentStatus = 'Paid';
        order.paymentId = razorpayPaymentId;
        // Change order status from 'Pending' to 'Received' after successful payment
        if (order.status === 'Pending') {
            order.status = 'Received';
        }
        await order.save({ session });

        await session.commitTransaction();

        // Create Pending Commissions (Outside transaction as it has its own logic/logging and failure shouldn't rollback payment)
        try {
            const { createPendingCommissions } = await import('./commissionService');
            await createPendingCommissions(orderId);
        } catch (commError) {
            console.error("Failed to create pending commissions after payment:", commError);
            // Don't fail the request, just log it.
        }

        return {
            success: true,
            message: 'Payment captured successfully',
            data: {
                paymentId: payment._id,
                orderId: order._id,
            },
        };
    } catch (error: any) {
        await session.abortTransaction();
        console.error('Error capturing payment:', error);
        return {
            success: false,
            message: error.message || 'Failed to capture payment',
        };
    } finally {
        session.endSession();
    }
};

/**
 * Process refund
 */
export const processRefund = async (
    paymentId: string,
    amount?: number,
    reason?: string
) => {
    try {
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            throw new Error('Payment not found');
        }

        if (!payment.razorpayPaymentId) {
            throw new Error('Razorpay payment ID not found');
        }

        const razorpay = getRazorpayInstance();

        const refundAmount = amount || payment.amount;

        const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
            amount: Math.round(refundAmount * 100), // Amount in paise
            notes: {
                reason: reason || 'Order cancelled',
            },
        });

        // Update payment record
        payment.status = 'Refunded';
        payment.refundAmount = refundAmount;
        payment.refundedAt = new Date();
        payment.refundReason = reason;
        await payment.save();

        return {
            success: true,
            message: 'Refund processed successfully',
            data: {
                refundId: refund.id,
                amount: refundAmount,
            },
        };
    } catch (error: any) {
        console.error('Error processing refund:', error);
        return {
            success: false,
            message: error.message || 'Failed to process refund',
        };
    }
};

/**
 * Handle Razorpay webhook
 */
export const handleWebhook = async (
    body: any,
    signature: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            throw new Error('Razorpay webhook secret not configured');
        }

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(body))
            .digest('hex');

        if (expectedSignature !== signature) {
            throw new Error('Invalid webhook signature');
        }

        const event = body.event;
        const payload = body.payload.payment.entity;

        // Handle different events
        switch (event) {
            case 'payment.captured':
                // Payment was captured successfully
                await handlePaymentCaptured(payload);
                break;

            case 'payment.failed':
                // Payment failed
                await handlePaymentFailed(payload);
                break;

            case 'refund.created':
                // Refund was created
                await handleRefundCreated(body.payload.refund.entity);
                break;

            default:
                console.log('Unhandled webhook event:', event);
        }

        return {
            success: true,
            message: 'Webhook processed successfully',
        };
    } catch (error: any) {
        console.error('Error handling webhook:', error);
        return {
            success: false,
            message: error.message || 'Failed to process webhook',
        };
    }
};

/**
 * Create a Razorpay order for seller security deposit
 */
export const createSellerDepositOrder = async (
    sellerId: string,
    amount: number = 1000 // Fixed deposit amount
) => {
    try {
        const razorpay = getRazorpayInstance();

        const options = {
            amount: Math.round(amount * 100), // Amount in paise
            currency: 'INR',
            receipt: `sdep_${sellerId.slice(-10)}_${Date.now()}`,
            notes: {
                sellerId,
                paymentType: 'SecurityDeposit',
            },
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Find seller to ensure they exist
        const Seller = mongoose.models.Seller;
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            throw new Error('Seller not found');
        }

        return {
            success: true,
            data: {
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                razorpayKey: process.env.RAZORPAY_KEY_ID,
            },
        };
    } catch (error: any) {
        console.error('Error creating seller deposit order:', error);
        return {
            success: false,
            message: error.message || 'Failed to create deposit order',
        };
    }
};

/**
 * Capture seller deposit payment and update seller status
 */
export const captureSellerDepositPayment = async (
    sellerId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Verify Razorpay Signature (HMAC SHA256)
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) throw new Error('Razorpay secret not configured');

        const body = razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpaySignature) {
            throw new Error('Invalid payment signature');
        }

        // 2. Find seller
        const Seller = mongoose.models.Seller;
        // Use lean() to get a plain object and bypass initial Mongoose hydration issues if data is broken
        const seller: any = await Seller.findById(sellerId).session(session).lean();
        if (!seller) throw new Error('Seller not found');

        // Logic to detect if we need to surgically clean up broken GeoJSON to stay within index limits
        let shouldUnsetGeo = false;
        if (seller.serviceAreaGeo) {
            const coords = seller.serviceAreaGeo.coordinates;
            if (!coords || !Array.isArray(coords) || coords.length === 0 || !Array.isArray(coords[0]) || coords[0].length === 0) {
                shouldUnsetGeo = true;
                console.log('⚠️ [Verification] Detected invalid GeoJSON in seller. Will surgically unset during update.');
            }
        }

        // 3. Create payment record
        const payment = new Payment({
            seller: sellerId,
            paymentType: 'SecurityDeposit',
            paymentMethod: 'Online',
            paymentGateway: 'Razorpay',
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            amount: 1000,
            currency: 'INR',
            status: 'Completed',
            paidAt: new Date(),
            gatewayResponse: {
                success: true,
                message: 'Security deposit captured successfully',
            },
        });

        await payment.save({ session });

        // 4. Update seller fields using direct collection update to bypass all Mongoose and indexing overhead
        // This ensures that existing invalid GeoJSON data doesn't block the crucial payment update
        const updateResult = await mongoose.connection.db!.collection('sellers').updateOne(
            { _id: new mongoose.Types.ObjectId(sellerId) },
            {
                $set: {
                    securityDepositStatus: 'Paid',
                    securityDepositPaidAt: new Date(),
                    depositPaid: true,
                    depositAmount: 1000,
                    depositPaidAt: new Date(),
                    status: 'Approved'
                },
                // Surgically remove the broken field if it's there, to satisfy the 2dsphere indexer
                ...(shouldUnsetGeo && { $unset: { serviceAreaGeo: 1 } })
            },
            { session }
        );

        if (updateResult.matchedCount === 0) throw new Error('Seller not found for update');

        // Fetch the updated seller for the response - use lean to avoid any possible hydration errors
        const updatedSeller = await Seller.findById(sellerId).session(session).lean();

        await session.commitTransaction();
        console.log('✅ [Verification] Seller status updated and GeoJSON sanitized. Payment verification complete.');

        return {
            success: true,
            message: "Seller deposit payment successful",
            data: updatedSeller
        };
    } catch (error: any) {
        await session.abortTransaction();
        console.error('❌ Error capturing seller deposit:', error.message);
        return {
            success: false,
            message: error.message || 'Failed to capture deposit payment',
        };
    } finally {
        session.endSession();
    }
};

// Helper functions for webhook events
const handlePaymentCaptured = async (payload: any) => {
    try {
        const razorpayPaymentId = payload.id;
        const razorpayOrderId = payload.order_id;
        const notes = payload.notes || {};

        if (notes.paymentType === 'SecurityDeposit' && notes.sellerId) {
            // Handle seller deposit via webhook
            const Seller = mongoose.models.Seller;
            await Seller.findByIdAndUpdate(notes.sellerId, {
                securityDepositStatus: 'Paid',
                securityDepositPaidAt: new Date(),
                depositPaid: true,
                depositAmount: 1000,
                depositPaidAt: new Date(),
                status: 'Approved'
            });

            // Create payment record if it doesn't exist
            const existingPayment = await Payment.findOne({ razorpayOrderId });
            if (!existingPayment) {
                const payment = new Payment({
                    seller: notes.sellerId,
                    paymentType: 'SecurityDeposit',
                    paymentMethod: 'Online',
                    paymentGateway: 'Razorpay',
                    razorpayOrderId,
                    razorpayPaymentId,
                    amount: 1000,
                    currency: 'INR',
                    status: 'Completed',
                    paidAt: new Date(),
                });
                await payment.save();
            }
            return;
        }

        // Find payment record
        const payment = await Payment.findOne({ razorpayOrderId });

        if (payment) {
            payment.status = 'Completed';
            payment.razorpayPaymentId = razorpayPaymentId;
            payment.paidAt = new Date();
            await payment.save();

            // Update order
            await Order.findByIdAndUpdate(payment.order, {
                paymentStatus: 'Paid',
                paymentId: razorpayPaymentId,
            });
        }
    } catch (error) {
        console.error('Error handling payment captured:', error);
    }
};

const handlePaymentFailed = async (payload: any) => {
    try {
        const razorpayOrderId = payload.order_id;

        // Find payment record
        const payment = await Payment.findOne({ razorpayOrderId });

        if (payment) {
            payment.status = 'Failed';
            payment.gatewayResponse = {
                success: false,
                message: payload.error_description || 'Payment failed',
                rawResponse: payload,
            };
            await payment.save();

            // Update order
            await Order.findByIdAndUpdate(payment.order, {
                paymentStatus: 'Failed',
            });
        }
    } catch (error) {
        console.error('Error handling payment failed:', error);
    }
};

const handleRefundCreated = async (payload: any) => {
    try {
        const razorpayPaymentId = payload.payment_id;

        // Find payment record
        const payment = await Payment.findOne({ razorpayPaymentId });

        if (payment) {
            payment.status = 'Refunded';
            payment.refundAmount = payload.amount / 100; // Convert from paise
            payment.refundedAt = new Date();
            await payment.save();

            // Update order
            await Order.findByIdAndUpdate(payment.order, {
                paymentStatus: 'Refunded',
            });
        }
    } catch (error) {
        console.error('Error handling refund created:', error);
    }
};
