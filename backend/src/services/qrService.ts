import Order from '../models/Order';
import EquipmentOrder from '../models/EquipmentOrder';
import { createAndUploadQR, QRPayload } from '../utils/qrUtils';

/**
 * Generate and attach QR to an order (Normal or Equipment)
 */
export async function generateAndAttachQr(orderId: string, orderType: 'ORDER' | 'EQUIPMENT'): Promise<void> {
  try {
    let order: any;
    let payload: QRPayload;

    if (orderType === 'ORDER') {
      order = await Order.findById(orderId).populate('customer seller');
      if (!order) throw new Error('Order not found');

      // Check if it's already scanned/cancelled? 
      // The controller should handle the trigger condition (status === "Accepted")
      
      payload = {
        orderId: order._id.toString(),
        orderType: 'ORDER',
        timestamp: Date.now()
      };

    } else {
      order = await EquipmentOrder.findById(orderId);
      if (!order) throw new Error('Equipment Order not found');

        payload = {
          orderId: order._id.toString(),
          orderType: 'EQUIPMENT'
        };
    }

    const { url, token } = await createAndUploadQR(payload);

    order.qrCodeUrl = url;
    order.qrData = token;
    order.qrGeneratedAt = new Date();
    order.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    order.isQrScanned = false;

    await order.save();
    console.log(`[QR-SERVICE] QR generated for ${orderType} ${orderId}`);

  } catch (error) {
    console.error(`[QR-SERVICE] Error generating QR for ${orderType} ${orderId}:`, error);
    throw error;
  }
}

/**
 * Regenerate QR for an order
 */
export async function regenerateQr(orderId: string, orderType: 'ORDER' | 'EQUIPMENT'): Promise<string> {
  await generateAndAttachQr(orderId, orderType);
  const Model = (orderType === 'ORDER' ? Order : EquipmentOrder) as any;
  const order = await Model.findById(orderId);
  return order?.qrCodeUrl || '';
}
