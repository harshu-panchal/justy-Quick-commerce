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

        // Notify via Sockets for real-time dashboard refresh
        const io = (req.app as any).get("io");
        if (io) {
            // Notify specific order room
            io.to(`order-${order._id}`).emit("order-delivered", {
                orderId: order._id,
                orderNumber: order.orderNumber,
                message: "Equipment delivered successfully"
            });

            // Notify delivery boy room for history refresh
            io.to(`delivery-${req.user!.userId}`).emit("order-delivered", {
                orderId: order._id,
                orderNumber: order.orderNumber
            });

            // Notify seller (customer/renter)
            io.to(`seller-${order.seller}`).emit("equipment-order-update", {
                orderId: order._id,
                status: order.status
            });

            // Notify admin
            io.to("admin-room").emit("equipment-order-update", {
                orderId: order._id,
                status: order.status
            });
        }

        return res.status(200).json({ success: true, message: 'Marked as delivered successfully' });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
