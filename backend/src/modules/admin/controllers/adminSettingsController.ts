import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import AppSettings from "../../../models/AppSettings";
import PaymentMethod from "../../../models/PaymentMethod";
import Customer from "../../../models/Customer";

/**
 * Get app settings
 */
export const getAppSettings = asyncHandler(
  async (_req: Request, res: Response) => {
    let settings = await AppSettings.findOne();

    // Create default settings if none exist
    if (!settings) {
      settings = await AppSettings.create({
        appName: "Dhakad Snazzy",
        contactEmail: "contact@dhakadsnazzy.com",
        contactPhone: "1234567890",
      });
    }

    return res.status(200).json({
      success: true,
      message: "App settings fetched successfully",
      data: settings,
    });
  }
);

/**
 * Update app settings
 */
export const updateAppSettings = asyncHandler(
  async (req: Request, res: Response) => {
    const updateData = req.body;
    updateData.updatedBy = req.user?.userId;

    console.log(`[DEBUG Settings] Incoming update payload:`, JSON.stringify(updateData, null, 2));

    let settings = await AppSettings.findOne();

    if (!settings) {
      settings = await AppSettings.create(updateData);
    } else {
      settings = await AppSettings.findOneAndUpdate({}, updateData, {
        new: true,
        runValidators: true,
      });
    }

    console.log(`[DEBUG Settings] Updated settings:`, JSON.stringify(settings, null, 2));

    return res.status(200).json({
      success: true,
      message: "App settings updated successfully",
      data: settings,
    });
  }
);

/**
 * Get payment methods
 */
export const getPaymentMethods = asyncHandler(
  async (_req: Request, res: Response) => {
    const paymentMethods = await PaymentMethod.find().sort({ order: 1 });

    return res.status(200).json({
      success: true,
      message: "Payment methods fetched successfully",
      data: paymentMethods,
    });
  }
);

/**
 * Update payment methods
 */
export const updatePaymentMethods = asyncHandler(
  async (req: Request, res: Response) => {
    const { paymentMethods } = req.body; // Array of payment method objects

    if (!Array.isArray(paymentMethods)) {
      return res.status(400).json({
        success: false,
        message: "Payment methods array is required",
      });
    }

    // Update or create each payment method
    const updatePromises = paymentMethods.map((pm: any) =>
      PaymentMethod.findOneAndUpdate({ name: pm.name }, pm, {
        upsert: true,
        new: true,
        runValidators: true,
      })
    );

    await Promise.all(updatePromises);

    const updatedMethods = await PaymentMethod.find().sort({ order: 1 });

    return res.status(200).json({
      success: true,
      message: "Payment methods updated successfully",
      data: updatedMethods,
    });
  }
);

/**
 * Get SMS gateway settings
 */
export const getSMSGatewaySettings = asyncHandler(
  async (_req: Request, res: Response) => {
    const settings = await AppSettings.findOne().select("smsGateway");

    return res.status(200).json({
      success: true,
      message: "SMS gateway settings fetched successfully",
      data: settings?.smsGateway || null,
    });
  }
);

/**
 * Update SMS gateway settings
 */
export const updateSMSGatewaySettings = asyncHandler(
  async (req: Request, res: Response) => {
    const { smsGateway } = req.body;

    let settings = await AppSettings.findOne();

    if (!settings) {
      settings = await AppSettings.create({
        appName: "Dhakad Snazzy",
        contactEmail: "contact@dhakadsnazzy.com",
        contactPhone: "1234567890",
        smsGateway,
      });
    } else {
      settings.smsGateway = smsGateway;
      settings.updatedBy = req.user?.userId as any;
      await settings.save();
    }

    return res.status(200).json({
      success: true,
      message: "SMS gateway settings updated successfully",
      data: settings.smsGateway,
    });
  }
);

/**
 * Get spinner settings
 */
export const getSpinnerSettings = asyncHandler(
  async (_req: Request, res: Response) => {
    const settings = await AppSettings.findOne().select("spinnerSettings");

    return res.status(200).json({
      success: true,
      message: "Spinner settings fetched successfully",
      data: settings?.spinnerSettings || null,
    });
  }
);

/**
 * Update spinner settings
 */
export const updateSpinnerSettings = asyncHandler(
  async (req: Request, res: Response) => {
    const { spinnerSettings } = req.body;

    let settings = await AppSettings.findOne();

    if (!settings) {
      settings = await AppSettings.create({
        contactEmail: "contact@dhakadsnazzy.com",
        contactPhone: "1234567890",
        spinnerSettings,
      });
    } else {
      settings.spinnerSettings = spinnerSettings;
      settings.updatedBy = req.user?.userId as any;
      await settings.save();
    }

    return res.status(200).json({
      success: true,
      message: "Spinner settings updated successfully",
      data: settings.spinnerSettings,
    });
  }
);

/**
 * Get referral settings
 */
export const getReferralSettings = asyncHandler(
  async (_req: Request, res: Response) => {
    const settings = await AppSettings.findOne().select("referralSettings");
    const defaults = {
      enabled: false,
      rewardAmount: 50,
      rewardType: "Wallet" as const,
      minOrderValue: 200,
      maxReferralsPerUser: 100,
    };
    return res.status(200).json({
      success: true,
      message: "Referral settings fetched successfully",
      data: settings?.referralSettings ?? defaults,
    });
  }
);

/**
 * Update referral settings
 */
export const updateReferralSettings = asyncHandler(
  async (req: Request, res: Response) => {
    const { enabled, rewardAmount, rewardType, minOrderValue, maxReferralsPerUser } = req.body;

    let settings = await AppSettings.findOne();
    const referralSettings = {
      enabled: Boolean(enabled),
      rewardAmount: Number(rewardAmount) || 50,
      rewardType: (rewardType === "Points" ? "Points" : "Wallet") as "Wallet" | "Points",
      minOrderValue: Number(minOrderValue) || 200,
      maxReferralsPerUser: Number(maxReferralsPerUser) || 100,
    };

    if (!settings) {
      settings = await AppSettings.create({
        contactEmail: "contact@dhakadsnazzy.com",
        contactPhone: "1234567890",
        referralSettings,
      });
    } else {
      settings.referralSettings = referralSettings;
      settings.updatedBy = req.user?.userId as any;
      await settings.save();
    }

    return res.status(200).json({
      success: true,
      message: "Referral settings updated successfully",
      data: settings.referralSettings,
    });
  }
);

/**
 * Admin: get top referrers list
 */
export const getAdminReferralStats = asyncHandler(
  async (_req: Request, res: Response) => {
    const topReferrers = await Customer.find({ referralCount: { $gt: 0 } })
      .select("name phone refCode referralCount referralEarnings")
      .sort({ referralCount: -1 })
      .limit(50)
      .lean();

    const totalReferrals = topReferrers.reduce((s, c) => s + (c.referralCount || 0), 0);
    const totalCoinsAwarded = topReferrers.reduce((s, c) => s + (c.referralEarnings || 0), 0);
    const totalReferrers = await Customer.countDocuments({ referralCount: { $gt: 0 } });
    const totalReferred = await Customer.countDocuments({ isReferralApplied: true });

    return res.status(200).json({
      success: true,
      data: { topReferrers, totalReferrals, totalCoinsAwarded, totalReferrers, totalReferred },
    });
  }
);
