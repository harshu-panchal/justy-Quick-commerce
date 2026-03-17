import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import AppSettings from "../../../models/AppSettings";
import Seller from "../../../models/Seller";
import Product from "../../../models/Product";
import SellerProductSlot from "../../../models/SellerProductSlot.model";
import { createRazorpayOrder, verifyPaymentSignature } from "../../../services/paymentService";
import mongoose from "mongoose";

/**
 * Get current seller's product limit and slot status
 */
export const getMyProductStatus = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user.userId;
  
  const settings = await AppSettings.getSettings();
  const seller = await Seller.findById(sellerId).select("freeProductsAdded paidSlotsTotal");
  
  if (!seller) {
    return res.status(404).json({ success: false, message: "Seller not found" });
  }
  
  const currentCount = await Product.countDocuments({ seller: sellerId });
  const config = settings.sellerProductConfig || {
    isEnabled: false,
    maxFreeProducts: 5,
    chargePerSlot: 99
  };
  
  const totalAllowed = config.maxFreeProducts + (seller.paidSlotsTotal || 0);
  
  return res.status(200).json({
    success: true,
    data: {
      isEnabled: config.isEnabled,
      maxFreeProducts: config.maxFreeProducts,
      chargePerSlot: config.chargePerSlot,
      freeProductsAdded: seller.freeProductsAdded || 0,
      paidSlotsTotal: seller.paidSlotsTotal || 0,
      currentProductCount: currentCount,
      totalAllowed: totalAllowed,
      isLimitReached: config.isEnabled && currentCount >= totalAllowed
    }
  });
});

/**
 * Create a Razorpay order for purchasing extra product slots
 */
export const createSlotOrder = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user.userId;
  const { numberOfSlots } = req.body;
  
  if (!numberOfSlots || numberOfSlots < 1) {
    return res.status(400).json({ success: false, message: "Invalid number of slots" });
  }
  
  const settings = await AppSettings.getSettings();
  const chargePerSlot = settings.sellerProductConfig?.chargePerSlot || 99;
  const totalAmount = numberOfSlots * chargePerSlot;
  
  const receipt = `pslot_${sellerId.toString().slice(-6)}_${Date.now()}`;
  const orderResponse = await createRazorpayOrder(receipt, totalAmount);
  
  if (!orderResponse.success) {
    return res.status(500).json(orderResponse);
  }
  
  // Create pending record
  await SellerProductSlot.create({
    sellerId,
    slotsPurchased: numberOfSlots,
    amountPaid: totalAmount,
    razorpayOrderId: orderResponse.data!.razorpayOrderId,
    status: "pending"
  });
  
  return res.status(200).json(orderResponse);
});

/**
 * Verify payment and increment seller's paid slots
 */
export const verifySlotPayment = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user.userId;
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  
  const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  
  if (!isValid) {
    return res.status(400).json({ success: false, message: "Invalid payment signature" });
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const slotRecord = await SellerProductSlot.findOne({ razorpayOrderId, sellerId }).session(session);
    
    if (!slotRecord) {
      throw new Error("Slot purchase record not found");
    }
    
    if (slotRecord.status === "paid") {
      return res.status(200).json({ success: true, message: "Payment already verified" });
    }
    
    // Update record
    slotRecord.status = "paid";
    slotRecord.razorpayPaymentId = razorpayPaymentId;
    slotRecord.razorpaySignature = razorpaySignature;
    await slotRecord.save({ session });
    
    // Increment seller's paid slots
    await Seller.findByIdAndUpdate(
      sellerId,
      { $inc: { paidSlotsTotal: slotRecord.slotsPurchased } },
      { session }
    );
    
    await session.commitTransaction();
    
    return res.status(200).json({
      success: true,
      message: "Payment verified and slots added successfully",
      slotsAdded: slotRecord.slotsPurchased
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Error verifying slot payment:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to verify payment" });
  } finally {
    session.endSession();
  }
});
