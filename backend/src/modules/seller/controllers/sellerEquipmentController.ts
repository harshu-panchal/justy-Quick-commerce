import { Request, Response } from 'express';
import { EquipmentItem, EquipmentOrder, Seller } from '../../../models';
import * as paymentService from '../../../services/equipmentPaymentService';

/**
 * Seller Equipment Marketplace 
 */
export const getActiveEquipmentItems = async (_req: Request, res: Response) => {
    try {
        const items = await EquipmentItem.find({ isActive: true }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: items });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const createEquipmentOrder = async (req: Request, res: Response) => {
    try {
        const { items, paymentMethod = 'Online', deliveryAddress } = req.body; // Array of { equipmentItem, quantity }, and address object
        const sellerId = req.user!.userId;

        const seller = await Seller.findById(sellerId);
        if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

        let total = 0;
        const orderItems = [];

        for (const inputItem of items) {
            const equipmentItem = await EquipmentItem.findById(inputItem.equipmentItem);
            if (!equipmentItem || !equipmentItem.isActive) {
                return res.status(400).json({ success: false, message: `Item ${inputItem.equipmentItem} not found or inactive` });
            }

            if (equipmentItem.stock < inputItem.quantity) {
                 return res.status(400).json({ success: false, message: `Insufficient stock for ${equipmentItem.name}. Available: ${equipmentItem.stock}` });
            }

            const deliveryCharge = (equipmentItem.deliveryCharge || 0) * inputItem.quantity;
            const platformFee = (equipmentItem.platformFee || 0) * inputItem.quantity;
            const subtotal = (equipmentItem.price * inputItem.quantity) + deliveryCharge + platformFee;
            total += subtotal;

            orderItems.push({
                equipmentItem: equipmentItem._id,
                name: equipmentItem.name,
                price: equipmentItem.price,
                imageUrl: equipmentItem.imageUrl,
                quantity: inputItem.quantity,
                subtotal,
                deliveryCharge,
                platformFee
            });
        }

        const order = new EquipmentOrder({
            seller: sellerId,
            sellerName: seller.sellerName,
            sellerPhone: seller.mobile,
            sellerAddress: seller.address || 'N/A',
            deliveryAddress: deliveryAddress || {
                address: seller.address || 'N/A',
                city: seller.city || 'N/A',
                pincode: seller.pincode || 'N/A'
            },
            items: orderItems,
            total,
            paymentMethod,
            status: 'pending',
            paymentStatus: 'Pending'
        });

        await order.save();

        return res.status(201).json({ success: true, data: order });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const createEquipmentRazorpayOrder = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const order = await EquipmentOrder.findById(orderId);
        
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        if (order.seller.toString() !== req.user!.userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        if (order.paymentStatus === 'Paid') {
            return res.status(400).json({ success: false, message: 'Order already paid' });
        }

        const result = await paymentService.createEquipmentRazorpayOrder(orderId, order.total);
        if (!result.success) return res.status(400).json(result);

        return res.status(200).json(result);
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyEquipmentPayment = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        const result = await paymentService.captureEquipmentPayment(
            orderId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        );

        if (!result.success) {
            console.error('Equipment Payment Capture Failed:', result.message);
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getSellerEquipmentOrders = async (req: Request, res: Response) => {
    try {
        const orders = await EquipmentOrder.find({ seller: req.user!.userId })
            .populate('deliveryBoy', 'name mobile')
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: orders });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const cancelEquipmentOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const sellerId = req.user!.userId;

        const order = await EquipmentOrder.findById(id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        if (order.seller.toString() !== sellerId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        if (order.status !== 'pending' && order.status !== 'approved' && order.status !== 'paid') {
            return res.status(400).json({ success: false, message: 'Order cannot be cancelled in current status' });
        }

        if (order.deliveryBoy) {
            return res.status(400).json({ success: false, message: 'Order already assigned for delivery' });
        }

        order.status = 'cancelled';
        order.cancellationReason = reason;
        await order.save();

        return res.status(200).json({ 
            success: true, 
            message: order.paymentStatus === 'Paid' ? 'Order cancelled. Please initiate a refund request.' : 'Order cancelled successfully', 
            data: order 
        });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

import RefundRequest from '../../../models/RefundRequest';

export const requestEquipmentRefund = async (req: Request, res: Response) => {
    try {
        const { orderId, bankDetails } = req.body;
        const sellerId = req.user!.userId;

        const order = await EquipmentOrder.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        if (order.seller.toString() !== sellerId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        if (order.paymentStatus !== 'Paid') {
            return res.status(400).json({ success: false, message: 'Refund only allowed for paid orders' });
        }

        if (order.status !== 'cancelled' && order.status !== 'rejected') {
            return res.status(400).json({ success: false, message: 'Refund only allowed for cancelled or rejected orders' });
        }

        if (order.refundStatus !== 'NONE') {
            return res.status(400).json({ success: false, message: 'Refund already initiated or processed' });
        }

        // Validate bank details
        if (!bankDetails.accountHolderName || !bankDetails.accountNumber || !bankDetails.ifscCode) {
            return res.status(400).json({ success: false, message: 'Incomplete bank details' });
        }

        const refundRequest = new RefundRequest({
            orderId,
            sellerId,
            amount: order.total,
            refundMethod: 'BANK',
            bankDetails,
            status: 'PENDING'
        });

        await refundRequest.save();

        order.refundStatus = 'PENDING';
        order.refundRequestId = refundRequest._id;
        await order.save();

        // Also update seller's saved bank details if provided
        await Seller.findByIdAndUpdate(sellerId, {
            accountName: bankDetails.accountHolderName,
            accountNumber: bankDetails.accountNumber,
            ifsc: bankDetails.ifscCode,
            upiId: bankDetails.upiId
        });

        return res.status(201).json({ success: true, message: 'Refund initiated', data: refundRequest });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
