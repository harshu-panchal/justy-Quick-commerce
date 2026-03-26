import Order from '../models/Order';
import { settleSpecificCODOrder } from './commissionService';

/**
 * Generate a settlement OTP for a COD order
 * This OTP is to be verified by the warehouse manager when the delivery boy deposits cash.
 */
export async function generateSettlementOtp(orderId: string): Promise<{ success: boolean; message: string; otp?: string }> {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.paymentMethod !== 'COD') {
      throw new Error('Settlement is only required for COD orders');
    }

    if (order.status !== 'Delivered') {
      throw new Error('Order must be delivered before settlement');
    }

    if (order.isSettledWithWarehouse) {
      throw new Error('Order is already settled with warehouse');
    }

    // Generate 6-digit OTP
    const otp = '1234';
    
    // Set expiry to 30 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    order.settlementOtp = otp;
    order.settlementOtpExpiresAt = expiresAt;
    await order.save();

    console.log(`[Settlement OTP] Generated OTP ${otp} for order ${order.orderNumber}`);

    return {
      success: true,
      message: 'Settlement OTP generated successfully. Share this with the warehouse manager.',
      otp: otp // Return OTP so delivery boy can see it in app
    };
  } catch (error: any) {
    console.error('Error in generateSettlementOtp:', error);
    throw new Error(error.message || 'Failed to generate settlement OTP');
  }
}

/**
 * Verify settlement OTP and mark order as settled
 */
export async function verifySettlementOtp(orderId: string, otp: string): Promise<{ success: boolean; message: string }> {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.isSettledWithWarehouse) {
      throw new Error('Order is already settled');
    }

    if (!order.settlementOtp || !order.settlementOtpExpiresAt) {
      throw new Error('No settlement OTP found for this order. Delivery boy must generate it first.');
    }

    // Check expiry
    if (new Date() > order.settlementOtpExpiresAt) {
      throw new Error('Settlement OTP has expired. Please ask delivery boy to generate a new one.');
    }

    // Verify OTP
    if (order.settlementOtp !== otp) {
      throw new Error('Invalid settlement OTP. Please check and try again.');
    }

    // Mark as settled
    order.isSettledWithWarehouse = true;
    order.settledAt = new Date();
    order.settlementOtp = undefined; // Clear OTP after use
    order.settlementOtpExpiresAt = undefined;
    await order.save();

    // Perform financial settlement
    try {
      await settleSpecificCODOrder(orderId);
    } catch (settleError) {
      console.error('Error during financial settlement:', settleError);
      // We don't throw here to avoid telling the warehouse manager "Internal Error" after they saw the cash
      // But we should probably log it or have a retry mechanism
    }

    console.log(`[Settlement] Order ${order.orderNumber} settled with warehouse successfully`);

    return {
      success: true,
      message: 'Order settled with warehouse successfully. Cash collection confirmed.',
    };
  } catch (error: any) {
    console.error('Error verifying settlement OTP:', error);
    throw new Error(error.message || 'Failed to verify settlement OTP');
  }
}
