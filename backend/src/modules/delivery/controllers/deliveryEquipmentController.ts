import { Request, Response } from 'express';
import { EquipmentOrder, AppSettings, Commission } from '../../../models';
import { processEquipmentDeliveryCommission } from '../../../services/commissionService';

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

        // Enhance with commission info
        const settings = await AppSettings.getSettings();
        const config = settings.equipmentDeliveryCommission;

        const enhancedOrders = await Promise.all(orders.map(async (order: any) => {
            const orderObj = order.toObject();
            
            // If delivered, look up actual commission
            if (order.status === 'delivered') {
                const comm = await Commission.findOne({ equipmentOrder: order._id, type: 'EQUIPMENT_DELIVERY' });
                orderObj.earnedCommission = comm?.commissionAmount || 0;
            } else if (config && config.enabled) {
                // Estimate based on current settings
                let est = 0;
                if (config.payMode === 'FIXED_PER_ORDER') est = config.amount;
                else if (config.payMode === 'FIXED_PER_ITEM') {
                    const totalQty = order.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
                    est = config.amount * totalQty;
                } else if (config.payMode === 'PERCENTAGE') {
                    est = (order.total * config.amount) / 100;
                }
                orderObj.estimatedCommission = Math.round(est * 100) / 100;
            }
            
            return orderObj;
        }));

        return res.status(200).json({ success: true, data: enhancedOrders });
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

        // Process Delivery Boy Commission
        await processEquipmentDeliveryCommission(order._id.toString());

        return res.status(200).json({ success: true, message: 'Marked as delivered successfully' });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
