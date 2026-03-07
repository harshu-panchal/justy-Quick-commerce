import { Request, Response } from "express";
import Order from "../../../models/Order";
import Delivery from "../../../models/Delivery";
import DeliveryAssignment from "../../../models/DeliveryAssignment";
import { asyncHandler } from "../../../utils/asyncHandler";

/**
 * Get available instant delivery requests in the partner's pincode
 */
export const getAvailableRequests = asyncHandler(async (req: Request, res: Response) => {
    const deliveryId = req.user!.userId;
    const partner = await Delivery.findById(deliveryId);

    if (!partner || !partner.pincode) {
        return res.status(400).json({ success: false, message: "Delivery partner pincode not set" });
    }

    // Find orders: instant, Received/Accepted/Pending/Processed (not yet assigned) matching pincode
    const orders = await Order.find({
        deliveryType: "instant",
        status: { $in: ["Received", "Accepted", "Pending", "Processed"] },
        sellerPincode: partner.pincode,
        deliveryBoy: { $exists: false }
    }).sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        data: orders
    });
});

/**
 * Accept an instant delivery request
 */
export const acceptRequest = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const deliveryId = req.user!.userId;
    const io = req.app.get("io");

    // Dynamic import to avoid circular dependency if any
    const { InstantDeliveryService } = require("../../../services/instantDeliveryService");
    const instantService = new InstantDeliveryService(io);
    const result = await instantService.acceptOrder(orderId, deliveryId);

    if (!result.success) {
        return res.status(400).json(result);
    }

    return res.status(200).json(result);
});

/**
 * Get active assignments for the partner
 */
export const getActiveAssignments = asyncHandler(async (req: Request, res: Response) => {
    const deliveryId = req.user!.userId;

    const assignments = await DeliveryAssignment.find({
        deliveryBoy: deliveryId,
        status: { $in: ["Assigned", "Picked Up", "In Transit"] }
    }).populate("order");

    return res.status(200).json({
        success: true,
        data: assignments
    });
});

/**
 * Update assignment status
 */
export const updateAssignmentStatus = asyncHandler(async (req: Request, res: Response) => {
    const { assignmentId } = req.params;
    const { status } = req.body; // Expected status from frontend
    const deliveryId = req.user!.userId;

    const assignment = await DeliveryAssignment.findOne({
        _id: assignmentId,
        deliveryBoy: deliveryId
    });

    if (!assignment) {
        return res.status(404).json({ success: false, message: "Assignment not found or not yours" });
    }

    assignment.status = status;
    if (status === "Delivered") {
        assignment.deliveredAt = new Date();
    }
    await assignment.save();

    // Also update the main order status
    const order = await Order.findById(assignment.order);
    if (order) {
        if (status === "Picked Up") {
            order.status = "Picked up";
            order.deliveryBoyStatus = "Picked Up";
        } else if (status === "In Transit") {
            order.status = "On the way";
            order.deliveryBoyStatus = "In Transit";
        } else if (status === "Delivered") {
            order.status = "Delivered";
            order.deliveryBoyStatus = "Delivered";
            order.deliveredAt = new Date();
            order.paymentStatus = "Paid";
        }
        await order.save();

        // Broadcast status update via Socket.IO
        const io = req.app.get("io");
        if (io) {
            io.to(`order-${order._id}`).emit("order_status_update", {
                orderId: order._id,
                status: order.status,
                deliveryBoyStatus: order.deliveryBoyStatus
            });
        }
    }

    return res.status(200).json({
        success: true,
        message: `Status updated to ${status}`,
        data: assignment
    });
});
