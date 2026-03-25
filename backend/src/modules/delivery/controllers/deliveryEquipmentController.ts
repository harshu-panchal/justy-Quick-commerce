import { Request, Response } from 'express';
import { EquipmentOrder } from '../../../models';

/**
 * Delivery Boy Equipment Assignments
 */
export const getMyEquipmentDeliveries = async (req: Request, res: Response) => {
    try {
        const orders = await EquipmentOrder.find({ 
            deliveryBoy: req.user!.userId,
            status: { $in: ['assigned', 'delivered'] }
        })
        .populate('seller', 'sellerName mobile address')
        .sort({ assignedAt: -1 });

        return res.status(200).json({ success: true, data: orders });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const markEquipmentDelivered = async (req: Request, res: Response) => {
    try {
        const order = await EquipmentOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        if (order.deliveryBoy?.toString() !== req.user!.userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        if (order.status !== 'assigned') {
            return res.status(400).json({ success: false, message: 'Order must be in assigned state' });
        }

        order.status = 'delivered';
        if (order.paymentMethod === 'COD') {
            order.paymentStatus = 'Paid';
        }
        await order.save();

        return res.status(200).json({ success: true, message: 'Marked as delivered successfully' });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
