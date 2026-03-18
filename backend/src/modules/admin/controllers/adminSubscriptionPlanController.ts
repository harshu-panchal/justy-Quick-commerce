import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import SubscriptionPlan from "../../../models/SubscriptionPlan";

/**
 * Create a new subscription plan
 */
export const createSubscriptionPlan = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      description,
      type,
      price,
      interval,
      features,
      cardColor,
      status,
      icon,
    } = req.body;

    if (!name || !type || price === undefined || !interval) {
      return res.status(400).json({
        success: false,
        message: "Name, type, price, and interval are required",
      });
    }

    const plan = await SubscriptionPlan.create({
      name,
      description,
      type,
      price,
      interval,
      features: features || [],
      cardColor,
      status: status !== undefined ? status : true,
      icon,
    });

    return res.status(201).json({
      success: true,
      message: "Subscription plan created successfully",
      data: plan,
    });
  }
);

/**
 * Get all subscription plans
 */
export const getSubscriptionPlans = asyncHandler(
  async (req: Request, res: Response) => {
    const { type, status, search } = req.query;

    const query: any = {};
    if (type) query.type = type;
    if (status !== undefined) query.status = status === "true";
    if (search) {
      query.name = { $regex: search as string, $options: "i" };
    }

    const plans = await SubscriptionPlan.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Subscription plans fetched successfully",
      data: plans,
    });
  }
);

/**
 * Update subscription plan
 */
export const updateSubscriptionPlan = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subscription plan updated successfully",
      data: plan,
    });
  }
);

/**
 * Delete subscription plan
 */
export const deleteSubscriptionPlan = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const plan = await SubscriptionPlan.findByIdAndDelete(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subscription plan deleted successfully",
    });
  }
);

/**
 * Toggle subscription plan status
 */
export const toggleSubscriptionPlanStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (status === undefined) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Subscription plan status updated to ${status ? "Active" : "Inactive"}`,
      data: plan,
    });
  }
);
