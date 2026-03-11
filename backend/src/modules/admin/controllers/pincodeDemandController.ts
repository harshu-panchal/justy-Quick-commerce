import { Request, Response } from "express";
import PincodeDemand from "../../../models/PincodeDemand";

// @desc    Get all pincode demands (Admin)
// @route   GET /api/v1/pincode-demands
// @access  Private/Admin
export const getPincodeDemands = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const demands = await PincodeDemand.find()
      .sort({ requestCount: -1, lastRequested: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PincodeDemand.countDocuments();

    return res.json({
      success: true,
      data: demands,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
