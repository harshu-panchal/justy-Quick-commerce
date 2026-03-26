import { Request, Response } from 'express';
import { verifyQRToken } from '../../../utils/qrUtils';
import Order from '../../../models/Order';
import EquipmentOrder from '../../../models/EquipmentOrder';
import { regenerateQr as regenerateQrService } from '../../../services/qrService';

/**
 * SCAN QR (Delivery Role)
 * POST /api/v1/delivery/qr/scan
 */
export async function scanQr(req: Request, res: Response) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'QR token is required' });
    }

    const decoded = verifyQRToken(token);
    if (!decoded) {
      return res.status(400).json({ success: false, message: 'Invalid or expired QR code' });
    }

    const { orderId, orderType } = decoded as any;
    
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
    if (orderType === 'ORDER') {
      if (status === 'PICKED_UP') {
        order.status = 'Picked up';
      } else if (status === 'DELIVERED') {
        order.status = 'Delivered';
        order.deliveredAt = new Date();
        order.isQrScanned = true;
      }
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
