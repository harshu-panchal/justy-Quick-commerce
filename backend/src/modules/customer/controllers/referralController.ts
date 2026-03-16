import { Request, Response } from "express";
import Customer from "../../../models/Customer";
import AppSettings from "../../../models/AppSettings";
import { asyncHandler } from "../../../utils/asyncHandler";

/**
 * Apply a referral code
 */
export const applyReferralCode = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { referralCode } = req.body;

  if (!userId || (req as any).user?.userType !== "Customer") {
    return res.status(401).json({
      success: false,
      message: "Unauthorized or not a customer",
    });
  }

  if (!referralCode) {
    return res.status(400).json({
      success: false,
      message: "Referral code is required",
    });
  }

  const customer = await Customer.findById(userId);
  if (!customer) {
    return res.status(404).json({
      success: false,
      message: "Customer not found",
    });
  }

  if (customer.isReferralApplied) {
    return res.status(400).json({
      success: false,
      message: "Referral code has already been applied for this account",
    });
  }

  if (customer.refCode === referralCode.toUpperCase()) {
    return res.status(400).json({
      success: false,
      message: "You cannot apply your own referral code",
    });
  }

  const referrer = await Customer.findOne({ refCode: referralCode.toUpperCase() });
  if (!referrer) {
    return res.status(404).json({
      success: false,
      message: "Invalid referral code",
    });
  }

  // Check if referrer has reached max referrals limit
  const settings = await AppSettings.findOne();
  if (settings?.referralSettings?.enabled) {
    const maxReferrals = settings.referralSettings.maxReferralsPerUser || 10;
    if ((referrer.referralCount || 0) >= maxReferrals) {
      return res.status(400).json({
        success: false,
        message: "This referral code has reached its maximum usage limit",
      });
    }
  }

  customer.referredBy = referrer._id;
  customer.isReferralApplied = true;
  await customer.save();

  return res.status(200).json({
    success: true,
    message: "Referral code applied successfully. Rewards will be credited after your first successful order.",
  });
});

/**
 * Get referral statistics and history
 */
export const getReferralStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId || (req as any).user?.userType !== "Customer") {
    return res.status(401).json({
      success: false,
      message: "Unauthorized or not a customer",
    });
  }

  const customer = await Customer.findById(userId);
  if (!customer) {
    return res.status(404).json({
      success: false,
      message: "Customer not found",
    });
  }

  // Find users referred by this customer
  const referredUsers = await Customer.find({ referredBy: userId })
    .select("name registrationDate totalOrders status")
    .sort({ registrationDate: -1 });

  // Get applied referral code if exists
  let appliedCode = null;
  if (customer.referredBy) {
    const referrer = await Customer.findById(customer.referredBy).select("refCode");
    appliedCode = referrer?.refCode || null;
  }

  return res.status(200).json({
    success: true,
    message: "Referral stats retrieved successfully",
    data: {
      referralCode: customer.refCode,
      isReferralApplied: customer.isReferralApplied || false,
      appliedCode,
      referralCount: customer.referralCount || 0,
      referralEarnings: customer.referralEarnings || 0,
      referredUsers: referredUsers.map(u => ({
        name: u.name,
        date: u.registrationDate,
        isCompleted: u.totalOrders > 0, // Simplified check for "completed" referral
      })),
    },
  });
});
