import { Request, Response } from "express";
import AppSettings from "../../../models/AppSettings";
import { SellerProductSlot } from "../../../models/SellerProductSlot.model";
import { asyncHandler } from "../../../utils/asyncHandler";

// Admin Product Slot Controller

/**
 * Get product slot configuration from AppSettings
 */
export const getProductSlotConfig = asyncHandler(async (req: Request, res: Response) => {
  const settings = await AppSettings.getSettings();
  
  return res.status(200).json({
    success: true,
    data: settings.sellerProductConfig || {
      isEnabled: false,
      maxFreeProducts: 5,
      chargePerSlot: 99
    }
  });
});

/**
 * Update product slot configuration in AppSettings
 */
export const updateProductSlotConfig = asyncHandler(async (req: Request, res: Response) => {
  const { isEnabled, maxFreeProducts, chargePerSlot } = req.body;
  
  const settings = await AppSettings.getSettings();
  settings.sellerProductConfig = {
    isEnabled: isEnabled ?? settings.sellerProductConfig?.isEnabled ?? false,
    maxFreeProducts: maxFreeProducts ?? settings.sellerProductConfig?.maxFreeProducts ?? 5,
    chargePerSlot: chargePerSlot ?? settings.sellerProductConfig?.chargePerSlot ?? 99,
  };
  
  await settings.save();
  
  return res.status(200).json({
    success: true,
    message: "Product slot configuration updated successfully",
    data: settings.sellerProductConfig
  });
});

/**
 * Get all product slot purchase earnings
 */
export const getSlotEarnings = asyncHandler(async (req: Request, res: Response) => {
  const { page = "1", limit = "10", sellerId } = req.query;
  
  const query: any = { status: "paid" };
  if (sellerId) {
    query.sellerId = sellerId;
  }
  
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;
  
  const earnings = await SellerProductSlot.find(query)
    .populate("sellerId", "sellerName email mobile storeName")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);
    
  const total = await SellerProductSlot.countDocuments(query);
  
  // Calculate total earnings sum
  const totalEarningsResult = await SellerProductSlot.aggregate([
    { $match: { status: "paid" } },
    { $group: { _id: null, total: { $sum: "$amountPaid" }, slots: { $sum: "$slotsPurchased" } } }
  ]);
  
  const summary = totalEarningsResult[0] || { total: 0, slots: 0 };
  
  return res.status(200).json({
    success: true,
    data: earnings,
    summary,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});
