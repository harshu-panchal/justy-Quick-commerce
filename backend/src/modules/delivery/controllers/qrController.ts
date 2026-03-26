import { Request, Response } from 'express';
import { verifyQRToken } from '../../../utils/qrUtils';
import Order from '../../../models/Order';
import EquipmentOrder from '../../../models/EquipmentOrder';
import { regenerateQr as regenerateQrService } from '../../../services/qrService';
import { processOrderStatusTransition } from '../../../services/orderService';

/**
 * SCAN QR (Delivery Role)
 * POST /api/v1/delivery/qr/scan
 */
export async function scanQr(req: Request, res: Response) {
  try {
    const { token, orderId: reqOrderId, orderType: reqOrderType } = req.body;

    let orderId, orderType;

    if (token) {
      const decoded = verifyQRToken(token);
      if (decoded) {
        orderId = (decoded as any).orderId;
        orderType = (decoded as any).orderType;
      }
    }

    // Fallback to direct ID/Type (used by the new URL-based scanner)
    if (!orderId) {
      orderId = reqOrderId;
      orderType = reqOrderType;
    }

    if (!orderId || !orderType) {
      return res.status(400).json({ success: false, message: 'Invalid QR code or missing order details' });
    }
    
    const Model = (orderType === 'ORDER' ? Order : EquipmentOrder) as any;
    const order = await Model.findById(orderId).populate(orderType === 'ORDER' ? 'items customer' : { path: 'items', populate: { path: 'equipmentItem' } });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Validations
    if (order.status === 'Cancelled' || order.status === 'cancelled') {
       return res.status(400).json({ success: false, message: 'Order is cancelled' });
    }

    if (order.isQrScanned && order.status === 'Delivered' || order.status === 'delivered') {
       return res.status(400).json({ success: false, message: 'Order already delivered and QR deactivated' });
    }

    // Check if delivery boy is assigned and matches
    if (order.deliveryBoy?.toString() !== (req as any).user.userId) {
       return res.status(403).json({ success: false, message: 'This order is not assigned to you' });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: orderType === 'ORDER' ? order.customerName : (order.sellerName || 'Seller'),
        address: orderType === 'ORDER' ? (order.deliveryAddress?.address || order.address) : order.sellerAddress,
        amount: order.total || order.grandTotal || 0,
        status: order.status,
        orderType,
        nextAllowedStatus: orderType === 'ORDER' 
          ? (order.status === 'Ready for pickup' ? ['PICKED_UP'] : (order.status === 'Picked up' ? ['DELIVERED'] : []))
          : (order.status === 'assigned' ? ['PICKED_UP'] : (order.status === 'picked_up' ? ['DELIVERED'] : [])),
        order
      }
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * UPDATE STATUS VIA SCAN (Delivery Role)
 * PATCH /api/v1/delivery/qr/:orderId/status
 */
export async function updateStatusViaQr(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    const { status, orderType, location } = req.body;

    const Model = (orderType === 'ORDER' ? Order : EquipmentOrder) as any;
    const order = await (Model as any).findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Authorization
    if (order.deliveryBoy?.toString() !== (req as any).user.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Map status
    let previousStatus = order.status;
    if (orderType === 'ORDER') {
      if (status === 'PICKED_UP') {
        order.status = 'Picked up';
      } else if (status === 'DELIVERED') {
        order.status = 'Delivered';
        order.deliveredAt = new Date();
        order.isQrScanned = true;
      }
      
      // Call centralized transition service for side effects (OrderItem status, commissions, etc.)
      await processOrderStatusTransition(orderId, order.status, previousStatus);
    } else {
      // Equipment Order
      if (status === 'PICKED_UP') {
        order.status = 'picked_up';
      } else if (status === 'DELIVERED') {
        order.status = 'delivered';
        order.isQrScanned = true;
      }
    }

    // Log scan
    if (!order.scanLogs) order.scanLogs = [];
    order.scanLogs.push({
      scannedAt: new Date(),
      scannedBy: (req as any).user.userId,
      location: location
    });

    await order.save();

    // Emit socket events for real-time dashboard updates
    const io = (req.app as any).get("io");
    if (io) {
      if (status === 'PICKED_UP') {
        io.to(`order-${orderId}`).emit("order-taken", {
          orderId: orderId,
          orderNumber: order.orderNumber,
          message: `Order picked up from ${order.sellerName || 'seller'}`
        });
      } else if (status === 'DELIVERED') {
        io.to(`order-${orderId}`).emit("order-delivered", {
          orderId: orderId,
          orderNumber: order.orderNumber,
          message: "Order delivered successfully"
        });
        
        // Notify delivery boy room for history refresh
        io.to(`delivery-${(req as any).user.userId}`).emit("order-delivered", {
          orderId: orderId,
          orderNumber: order.orderNumber
        });
      }

      // Notify sellers/admin for UI refreshes
      if (orderType === 'ORDER') {
        const { notifySellersOfOrderUpdate } = await import("../../../services/sellerNotificationService");
        notifySellersOfOrderUpdate(io, order, "STATUS_UPDATE");
      } else {
        // For equipment, notify the seller (who is the customer/renter)
        io.to(`seller-${order.seller}`).emit("equipment-order-update", {
          orderId: orderId,
          status: order.status
        });
        // Also notify admin
        io.to("admin-room").emit("equipment-order-update", {
          orderId: orderId,
          status: order.status
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      data: order
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * REGENERATE QR (Seller/Admin Role)
 */
export async function regenerateQr(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { orderType } = req.body; // 'ORDER' or 'EQUIPMENT'

    const qrUrl = await regenerateQrService(id, orderType);
    
    res.status(200).json({
      success: true,
      data: { qrCodeUrl: qrUrl }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
