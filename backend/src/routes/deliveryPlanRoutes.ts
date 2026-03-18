import { Router } from "express";
import { authenticate, requireUserType } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import Plan from "../models/Plan";
import DeliverySubscription from "../models/DeliverySubscription";
import { createRazorpaySubscription } from "../services/razorpaySubscriptionService";

const router = Router();

router.use(authenticate);
router.use(requireUserType("Delivery"));

// My active subscription (latest)
router.get(
  "/my-subscription",
  asyncHandler(async (req, res) => {
    const deliveryId = req.user?.userId;
    if (!deliveryId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const sub = await DeliverySubscription.findOne({ deliveryId, status: "active" })
      .sort({ updatedAt: -1 })
      .populate("planId")
      .lean();

    return res.status(200).json({ success: true, message: "Subscription fetched", data: sub || null });
  })
);

// List active delivery partner plans
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const plans = await Plan.find({ planType: "DeliveryPartner", isActive: true })
      .sort({ amount: 1, createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, message: "Delivery plans fetched", data: plans });
  })
);

// Create subscription
router.post(
  "/subscribe",
  asyncHandler(async (req, res) => {
    const deliveryId = req.user?.userId;
    const { planId } = req.body || {};

    if (!deliveryId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (!planId || typeof planId !== "string") {
      return res.status(400).json({ success: false, message: "planId is required" });
    }

    const active = await DeliverySubscription.findOne({ deliveryId, status: "active" }).lean();
    if (active) {
      return res
        .status(400)
        .json({ success: false, message: "You already have an active subscription. Upgrade/downgrade is not allowed." });
    }

    const plan = await Plan.findOne({ _id: planId, planType: "DeliveryPartner", isActive: true });
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const rp = await createRazorpaySubscription({
      planId: (plan as any).razorpayPlanId,
      totalCount: 12,
      customerNotify: 1,
      notes: {
        deliveryId: String(deliveryId),
        planId: String(plan._id),
        planName: plan.name,
      },
    });

    await DeliverySubscription.create({
      deliveryId,
      planId: plan._id,
      razorpayPlanId: (plan as any).razorpayPlanId,
      razorpaySubscriptionId: rp.id,
      status: (rp.status as any) || "created",
      razorpaySubscriptionObject: { id: rp.id, status: rp.status, short_url: rp.shortUrl },
    });

    return res.status(200).json({
      success: true,
      message: "Subscription created",
      data: { subscriptionId: rp.id, shortUrl: rp.shortUrl },
    });
  })
);

export default router;

