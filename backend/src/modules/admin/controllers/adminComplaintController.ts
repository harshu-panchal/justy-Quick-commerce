import { Request, Response } from "express";
import Complaint from "../../../models/Complaint";
import { asyncHandler } from "../../../utils/asyncHandler";

export const getAllComplaints = asyncHandler(async (req: Request, res: Response) => {
  const { status, raisedByType, priority, category, search, page = 1, limit = 15 } = req.query;

  const query: any = {};
  if (status && status !== "All") query.status = status;
  if (raisedByType && raisedByType !== "All") query.raisedByType = raisedByType;
  if (priority && priority !== "All") query.priority = priority;
  if (category && category !== "All") query.category = category;

  if (search) {
    query.$or = [
      { subject: { $regex: search, $options: "i" } },
      { message: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate("customer", "name email mobile")
      .populate("seller", "name shopName email mobile")
      .populate("order", "orderNumber totalPrice status")
      .populate("respondedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Complaint.countDocuments(query),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      complaints,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    },
  });
});

export const getComplaintById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const complaint = await Complaint.findById(id)
    .populate("customer", "name email mobile")
    .populate("seller", "name shopName email mobile")
    .populate("order", "orderNumber totalPrice status")
    .populate("respondedBy", "name email");

  if (!complaint) {
    return res.status(404).json({ success: false, message: "Complaint not found" });
  }

  return res.status(200).json({ success: true, data: complaint });
});

export const respondToComplaint = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, response } = req.body;
  const adminId = req.user?.userId;

  const complaint = await Complaint.findById(id);
  if (!complaint) {
    return res.status(404).json({ success: false, message: "Complaint not found" });
  }

  if (status) complaint.status = status;
  if (response) {
    complaint.response = response;
    complaint.respondedBy = adminId as any;
    complaint.respondedAt = new Date();
  }

  await complaint.save();

  return res.status(200).json({
    success: true,
    data: complaint,
    message: "Complaint updated successfully",
  });
});

export const getComplaintStats = asyncHandler(async (_req: Request, res: Response) => {
  const [total, open, inProgress, resolved, closed, fromCustomers, fromSellers] = await Promise.all([
    Complaint.countDocuments(),
    Complaint.countDocuments({ status: "Open" }),
    Complaint.countDocuments({ status: "In Progress" }),
    Complaint.countDocuments({ status: "Resolved" }),
    Complaint.countDocuments({ status: "Closed" }),
    Complaint.countDocuments({ raisedByType: "Customer" }),
    Complaint.countDocuments({ raisedByType: "Seller" }),
  ]);

  return res.status(200).json({
    success: true,
    data: { total, open, inProgress, resolved, closed, fromCustomers, fromSellers },
  });
});
