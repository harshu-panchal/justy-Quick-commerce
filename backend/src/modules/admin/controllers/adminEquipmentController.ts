import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { EquipmentItem, EquipmentOrder, Delivery } from '../../../models';
import * as paymentService from '../../../services/equipmentPaymentService';
import { generateAndAttachQr } from '../../../services/qrService';

/**
 * Manage Equipment Items
 */
export const createEquipmentItem = async (req: Request, res: Response) => {
    try {
        const item = new EquipmentItem(req.body);
        await item.save();
        res.status(201).json({ success: true, data: item });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getAllEquipmentItems = async (_req: Request, res: Response) => {
    try {
        const items = await EquipmentItem.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: items });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateEquipmentItem = async (req: Request, res: Response) => {
    try {
        const item = await EquipmentItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        return res.status(200).json({ success: true, data: item });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteEquipmentItem = async (req: Request, res: Response) => {
    try {
        const hasOrders = await EquipmentOrder.exists({ "items.equipmentItem": req.params.id });
        if (hasOrders) {
            // Soft delete if has orders to preserve historical data
            await EquipmentItem.findByIdAndUpdate(req.params.id, { isActive: false });
            return res.status(200).json({ success: true, message: 'Item deactivated as it has existing orders' });
        }
        await EquipmentItem.findByIdAndDelete(req.params.id);
        return res.status(200).json({ success: true, message: 'Item deleted' });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const toggleEquipmentItemStatus = async (req: Request, res: Response) => {
    try {
        const item = await EquipmentItem.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        item.isActive = !item.isActive;
        await item.save();
        return res.status(200).json({ success: true, data: item });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * Manage Equipment Orders
 */
export const getAllEquipmentOrders = async (_req: Request, res: Response) => {
    try {
        const orders = await EquipmentOrder.find()
            .populate('seller', 'sellerName email mobile')
            .populate('deliveryBoy', 'name mobile')
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: orders });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const assignDeliveryBoy = async (req: Request, res: Response) => {
    try {
        const { orderId, deliveryBoyId } = req.body;
        
        const order = await EquipmentOrder.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        if (order.paymentMethod === 'Online' && order.paymentStatus !== 'Paid') {
            return res.status(400).json({ success: false, message: 'Payment must be completed before assignment for Online orders' });
        }

        if (order.deliveryBoy) {
            return res.status(400).json({ success: false, message: 'Delivery boy already assigned' });
        }

        const deliveryBoy = await Delivery.findById(deliveryBoyId);
        if (!deliveryBoy) return res.status(404).json({ success: false, message: 'Delivery boy not found' });

        order.deliveryBoy = deliveryBoy._id as mongoose.Types.ObjectId;
        order.assignedAt = new Date();
        order.status = 'assigned';
        await order.save();

        // Notify delivery boy
        const io = req.app.get("io");
        if (io) {
            const { notifyDeliveryBoyOfAssignment } = await import("../../../services/deliveryNotificationService");
            await notifyDeliveryBoyOfAssignment(io, deliveryBoyId, order, "EQUIPMENT");
        }

        res.status(200).json({
            success: true,
            message: "Delivery boy assigned successfully",
            data: order,
        });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const approveEquipmentOrder = async (req: Request, res: Response) => {
    try {
        const order = await EquipmentOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        
        if (order.status !== 'pending' && order.status !== 'paid') {
            return res.status(400).json({ success: false, message: 'Only pending or paid orders can be approved' });
        }

        order.status = 'approved';
        await order.save();

        try {
            await generateAndAttachQr(order._id.toString(), 'EQUIPMENT');
            console.log(`QR generated for approved equipment order: ${order.orderNumber}`);
        } catch (qrErr) {
            console.error('Failed to generate QR for equipment order:', order.orderNumber, qrErr);
        }

        return res.status(200).json({ success: true, message: 'Order approved successfully', data: order });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const rejectEquipmentOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const order = await EquipmentOrder.findById(id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        if (order.status !== 'pending' && order.status !== 'paid') {
            return res.status(400).json({ success: false, message: 'Order cannot be rejected in current status' });
        }

        order.status = 'rejected';
        order.rejectionReason = reason;
        await order.save();

        return res.status(200).json({ 
            success: true, 
            message: order.paymentStatus === 'Paid' ? 'Order rejected. Seller can now initiate a refund request.' : 'Order rejected successfully', 
            data: order 
        });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
