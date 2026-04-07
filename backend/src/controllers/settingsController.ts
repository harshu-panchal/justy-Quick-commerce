import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import AppSettings from "../models/AppSettings";

/**
 * Get public app settings
 */
export const getPublicSettings = asyncHandler(
  async (_req: Request, res: Response) => {
    const settings = await AppSettings.getSettings();
    
    // Only return non-sensitive fields
    const publicSettings = {
      appName: settings.appName,
      appLogo: settings.appLogo,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      sellerSecurityDeposit: settings.sellerSecurityDeposit || 1000,
    };

    return res.status(200).json({
      success: true,
      message: "Public settings fetched successfully",
      data: publicSettings,
    });
  }
);
