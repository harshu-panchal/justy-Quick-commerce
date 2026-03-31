import { Request, Response } from "express";
import Complaint from "../../../models/Complaint";
import Order from "../../../models/Order";
import Customer from "../../../models/Customer";
import Seller from "../../../models/Seller";
import mongoose from "mongoose";

export const createComplaint = async (req: Request, res: Response) => {
  try {
    const { category, subject, message, orderId, images } = req.body;
    const customerId = req.user?.userId;

    if (!customerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: "Subject and message are required" });
    }

    let sellerId;
    
    // If orderId is provided, linked it to the seller of that order
    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
        const order = await Order.findById(orderId).populate('seller');
        if (order) {
            sellerId = order.seller;
        }
    }

    const complaint = new Complaint({
      customer: customerId,
      order: orderId,
      seller: sellerId,
      category: category || "Other",
      subject,
      message,
      images: images || [],
      status: "Open",
      priority: "Medium",
    });

    await complaint.save();

    return res.status(201).json({
      success: true,
      data: complaint,
      message: "Complaint submitted successfully!",
    });
  } catch (error: any) {
    console.error("Error creating complaint:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerComplaints = async (req: Request, res: Response) => {
  try {
    const customerId = req.user?.userId;

    if (!customerId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const complaints = await Complaint.find({ customer: customerId })
      .populate('order', 'orderId status totalPrice')
      .populate('seller', 'name shopName')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: complaints,
    });
  } catch (error: any) {
    console.error("Error fetching complaints:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
