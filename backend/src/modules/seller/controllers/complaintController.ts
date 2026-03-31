import { Request, Response } from "express";
import Complaint from "../../../models/Complaint";
import { asyncHandler } from "../../../utils/asyncHandler";

export const getSellerComplaints = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = req.user?.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const query: any = { seller: sellerId };
    if (status && status !== 'All Status') {
      query.status = status;
    }

    const complaints = await Complaint.find(query)
      .populate('customer', 'name email mobile')
      .populate('order', 'orderNumber status totalPrice')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Complaint.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        complaints,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  }
);

export const updateComplaintStatus = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const { status, response } = req.body;
        const sellerId = req.user?.userId;

        const complaint = await Complaint.findOne({ _id: id, seller: sellerId });
        if (!complaint) {
            return res.status(404).json({ success: false, message: "Complaint not found" });
        }

        if (status) complaint.status = status;
        if (response) {
            complaint.response = response;
            complaint.respondedAt = new Date();
            complaint.respondedBy = sellerId as any;
        }

        await complaint.save();

        return res.status(200).json({
            success: true,
            data: complaint,
            message: "Complaint updated successfully"
        });
    }
);
