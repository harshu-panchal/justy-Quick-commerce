import { Request, Response } from "express";
import Plan from "../../../models/Plan";
import { asyncHandler } from "../../../utils/asyncHandler";
import { createRazorpayPlan } from "../../../services/razorpaySubscriptionService";

const PERIODS = ["daily", "weekly", "monthly", "yearly"] as const;
const PLAN_TYPES = ["Customer", "Seller", "DeliveryPartner"] as const;

export const listPlans = asyncHandler(async (_req: Request, res: Response) => {
  const plans = await Plan.find().sort({ createdAt: -1 }).lean();
  return res.status(200).json({
    success: true,
    message: "Plans fetched successfully",
    data: plans,
  });
});

export const createPlan = asyncHandler(async (req: Request, res: Response) => {
  const { planType, name, points, amount, period, isActive } = req.body || {};

  if (!planType || !PLAN_TYPES.includes(planType)) {
    return res.status(400).json({ success: false, message: "Valid planType is required" });
  }
  if (!name || typeof name !== "string") {
    return res.status(400).json({ success: false, message: "Name is required" });
  }
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
    return res.status(400).json({ success: false, message: "Valid amount is required" });
  }
  if (!PERIODS.includes(period)) {
    return res.status(400).json({ success: false, message: "Valid period is required" });
  }

  const safePoints = Array.isArray(points)
    ? points.map((p) => String(p).trim()).filter(Boolean).slice(0, 20)
    : [];

  const rp = await createRazorpayPlan({
    name: `${String(planType)} - ${String(name).trim()}`.slice(0, 120),
    description: safePoints.length ? safePoints.join(" | ").slice(0, 255) : String(planType),
    amountInRupees: parsedAmount,
    currency: "INR",
    period,
    interval: 1, // fixed
  });

  const plan = await Plan.create({
    planType,
    name: String(name).trim(),
    points: safePoints,
    amount: parsedAmount,
    currency: "INR",
    period,
    isActive: typeof isActive === "boolean" ? isActive : true,
    razorpayPlanId: rp.id,
  });

  return res.status(201).json({
    success: true,
    message: "Plan created successfully",
    data: plan,
  });
});

export const updatePlan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { planType, name, points, amount, period, isActive } = req.body || {};

  const plan = await Plan.findById(id);
  if (!plan) {
    return res.status(404).json({ success: false, message: "Plan not found" });
  }

  const nextPlanType = planType !== undefined ? planType : (plan as any).planType;
  const nextName = typeof name === "string" ? name.trim() : plan.name;
  const nextAmount = amount !== undefined ? Number(amount) : plan.amount;
  const nextPeriod = period !== undefined ? period : plan.period;
  const nextPoints =
    points !== undefined
      ? Array.isArray(points)
        ? points.map((p) => String(p).trim()).filter(Boolean).slice(0, 20)
        : []
      : (plan as any).points || [];

  if (!nextPlanType || !PLAN_TYPES.includes(nextPlanType)) {
    return res.status(400).json({ success: false, message: "Valid planType is required" });
  }
  if (!nextName) {
    return res.status(400).json({ success: false, message: "Name is required" });
  }
  if (!Number.isFinite(nextAmount) || nextAmount < 0) {
    return res.status(400).json({ success: false, message: "Valid amount is required" });
  }
  if (!PERIODS.includes(nextPeriod)) {
    return res.status(400).json({ success: false, message: "Valid period is required" });
  }

  const requiresNewRazorpayPlan =
    nextPlanType !== (plan as any).planType ||
    nextName !== plan.name ||
    nextAmount !== plan.amount ||
    nextPeriod !== plan.period ||
    JSON.stringify(nextPoints) !== JSON.stringify((plan as any).points || []);

  if (requiresNewRazorpayPlan) {
    const rp = await createRazorpayPlan({
      name: `${String(nextPlanType)} - ${nextName}`.slice(0, 120),
      description: nextPoints.length ? nextPoints.join(" | ").slice(0, 255) : String(nextPlanType),
      amountInRupees: nextAmount,
      currency: "INR",
      period: nextPeriod,
      interval: 1, // fixed
    });
    plan.previousRazorpayPlanIds = [
      ...(plan.previousRazorpayPlanIds || []),
      plan.razorpayPlanId,
    ];
    plan.razorpayPlanId = rp.id;
  }

  (plan as any).planType = nextPlanType;
  plan.name = nextName;
  (plan as any).points = nextPoints;
  plan.amount = nextAmount;
  plan.period = nextPeriod;
  if (typeof isActive === "boolean") plan.isActive = isActive;

  await plan.save();

  return res.status(200).json({
    success: true,
    message: "Plan updated successfully",
    data: plan,
  });
});

export const deletePlan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const plan = await Plan.findById(id);
  if (!plan) {
    return res.status(404).json({ success: false, message: "Plan not found" });
  }

  // Soft delete (Razorpay plans cannot be deleted reliably; archive locally)
  plan.isActive = false;
  await plan.save();

  return res.status(200).json({
    success: true,
    message: "Plan disabled successfully",
  });
});

