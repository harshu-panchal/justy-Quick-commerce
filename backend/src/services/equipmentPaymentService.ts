import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { EquipmentOrder, EquipmentItem } from '../models';

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
 * Create a Razorpay order for equipment purchase
 */
export const createEquipmentRazorpayOrder = async (
    equipmentOrderId: string,
    amount: number,
    currency: string = 'INR'
) => {
    try {
        const razorpay = getRazorpayInstance();

        const options = {
            amount: Math.round(amount * 100), // Amount in paise
            currency,
            receipt: equipmentOrderId,
            notes: {
                equipmentOrderId,
                paymentType: 'EquipmentPurchase'
            },
        };

        const razorpayOrder = await razorpay.orders.create(options);

        return {
            success: true,
            data: {
                razorpayOrderId: razorpayOrder.id,
                razorpayKey: process.env.RAZORPAY_KEY_ID,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                receipt: razorpayOrder.receipt,
            },
        };
    } catch (error: any) {
        console.error('Error creating Equipment Razorpay order:', error);
        return {
            success: false,
            message: error.message || 'Failed to create Razorpay order',
        };
    }
};

/**
 * Verify Razorpay payment signature
 */
export const verifyEquipmentPaymentSignature = (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
): boolean => {
    try {
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) throw new Error('Razorpay key secret not configured');

        const body = razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(body)
            .digest('hex');

        console.log('--- Equipment Signature Verification ---');
        console.log('Order ID:', razorpayOrderId);
        console.log('Payment ID:', razorpayPaymentId);
        console.log('Expected:', expectedSignature);
        console.log('Received:', razorpaySignature);
        console.log('Matches:', expectedSignature === razorpaySignature);

        return expectedSignature === razorpaySignature;
    } catch (error) {
        console.error('Error verifying equipment payment signature:', error);
        return false;
    }
};

/**
 * Capture payment, update stock, and update order status
 */
export const captureEquipmentPayment = async (
    equipmentOrderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Verify Signature
        const isValid = verifyEquipmentPaymentSignature(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        );

        if (!isValid) throw new Error('Invalid payment signature');

        // 2. Find Order
        const order = await EquipmentOrder.findById(equipmentOrderId).session(session);
        if (!order) throw new Error('Equipment order not found');

        // Idempotency check: if already paid, just return success
        if (order.paymentStatus === 'Paid') {
             await session.commitTransaction();
             return { 
                success: true, 
                message: 'Payment already captured',
                data: { orderId: order._id }
            };
        }

        // 3. Update stock and validate (Atomic check inside transaction)
        for (const item of order.items) {
            const equipmentItem = await EquipmentItem.findById(item.equipmentItem).session(session);
            if (!equipmentItem) throw new Error(`Item ${item.name} no longer exists`);
            
            if (equipmentItem.stock < item.quantity) {
                throw new Error(`Insufficient stock for ${item.name}. Available: ${equipmentItem.stock}`);
            }

            equipmentItem.stock -= item.quantity;
            await equipmentItem.save({ session });
        }

        // 4. Update Order
        order.paymentStatus = 'Paid';
        order.status = 'paid';
        order.razorpayOrderId = razorpayOrderId;
        order.razorpayPaymentId = razorpayPaymentId;
        order.razorpaySignature = razorpaySignature;
        
        await order.save({ session });

        await session.commitTransaction();

        return {
            success: true,
            message: 'Equipment payment captured successfully',
            data: { 
                orderId: order._id,
                paymentStatus: 'Paid'
            }
        };
    } catch (error: any) {
        await session.abortTransaction();
        console.error('Error capturing equipment payment:', error);
        return {
            success: false,
            message: error.message || 'Failed to capture payment',
        };
    } finally {
        session.endSession();
    }
};

/**
 * Refund a Razorpay payment for equipment purchase
 */
export const refundEquipmentOrder = async (orderId: string, refundMethod: "WALLET" | "BANK" = "WALLET") => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await EquipmentOrder.findById(orderId).session(session);
        if (!order) throw new Error('Order not found');

        if (order.status === 'refunded' || order.paymentStatus === 'Refunded') {
            throw new Error('Order already refunded');
        }

        if (order.paymentStatus !== 'Paid') {
            throw new Error('Only paid orders can be refunded');
        }

        // 1. Process Razorpay Refund if paymentId exists
        if (order.razorpayPaymentId && order.paymentMethod === 'Online') {
            const razorpay = getRazorpayInstance();
            const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
                amount: Math.round(order.total * 100),
                notes: { orderId, reason: 'Order Rejection/Cancellation' }
            });
            order.refundTransactionId = refund.id;
        }

        // 2. Restore Stock
        for (const item of order.items) {
            await EquipmentItem.findByIdAndUpdate(
                item.equipmentItem, 
                { $inc: { stock: item.quantity } },
                { session }
            );
        }

        // 3. Update Order Status
        order.status = 'refunded';
        order.paymentStatus = 'Refunded';
        order.refundStatus = 'REFUNDED';
        order.refundMethod = refundMethod;
        
        await order.save({ session });

        await session.commitTransaction();

        return {
            success: true,
            message: 'Order refunded successfully and stock restored',
            data: { orderId, refundTransactionId: order.refundTransactionId }
        };
    } catch (error: any) {
        await session.abortTransaction();
        console.error('Error refunding equipment order:', error);
        return {
            success: false,
            message: error.message || 'Failed to process refund',
        };
    } finally {
        session.endSession();
    }
};
