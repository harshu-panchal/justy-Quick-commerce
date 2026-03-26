import Order from "../models/Order";

/**
 * Generate a 4-digit handover OTP for the rider
 * Valid for 30 minutes
 */
export const generateHandoverOtp = async (orderId: string) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  const otp = '1234';
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

  order.handoverOtp = otp;
  order.handoverOtpExpiresAt = expiresAt;
  await order.save();

  return { success: true, otp, expiresAt, message: "Handover OTP generated" };
};

/**
 * Verify handover OTP entered by warehouse
 */
export const verifyHandoverOtp = async (orderId: string, otp: string) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  if (!order.handoverOtp) throw new Error("No handover OTP requested for this order");
  if (new Date() > (order.handoverOtpExpiresAt as Date)) throw new Error("OTP has expired");
  if (order.handoverOtp !== otp) throw new Error("Invalid Handover OTP");

  // Update status to Out for Delivery (Handed over to rider)
  order.status = "Out for Delivery";
  order.handoverOtp = undefined;
  order.handoverOtpExpiresAt = undefined;
  await order.save();

  return { success: true, message: "Order handed over to rider successfully" };
};
