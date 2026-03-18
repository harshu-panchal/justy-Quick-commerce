import { Router } from "express";
import { authenticate, requireUserType } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import Plan from "../models/Plan";
import SellerSubscription from "../models/SellerSubscription";
import {
  createRazorpaySubscription,
  verifyRazorpaySubscriptionSignature,
} from "../services/razorpaySubscriptionService";

const router = Router();

router.use(authenticate);
router.use(requireUserType("Seller"));

// Get my active seller subscription (latest)
router.get(
  "/my-subscription",
  asyncHandler(async (req, res) => {
    const sellerId = req.user?.userId;
    if (!sellerId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const sub = await SellerSubscription.findOne({ sellerId, status: "active" })
      .sort({ updatedAt: -1 })
      .populate("planId")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Subscription fetched",
      data: sub || null,
    });
  })
);

// List active seller plans
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const plans = await Plan.find({ planType: "Seller", isActive: true })
      .sort({ amount: 1, createdAt: -1 })
      .lean();
    return res.status(200).json({
      success: true,
      message: "Seller plans fetched",
      data: plans,
    });
  })
);

// Create a Razorpay subscription for the seller
router.post(
  "/subscribe",
  asyncHandler(async (req, res) => {
    const sellerId = req.user?.userId;
    const { planId } = req.body || {};

    if (!sellerId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (!planId || typeof planId !== "string") {
      return res.status(400).json({ success: false, message: "planId is required" });
    }

    const plan = await Plan.findOne({ _id: planId, planType: "Seller", isActive: true });
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const rp = await createRazorpaySubscription({
      planId: (plan as any).razorpayPlanId,
      totalCount: 12,
      customerNotify: 1,
      notes: {
        sellerId: String(sellerId),
        planId: String(plan._id),
        planName: plan.name,
      },
    });

    await SellerSubscription.create({
      sellerId,
      planId: plan._id,
      razorpayPlanId: (plan as any).razorpayPlanId,
      razorpaySubscriptionId: rp.id,
      status: rp.status || "created",
    });

    return res.status(200).json({
      success: true,
      message: "Subscription created",
      data: {
        subscriptionId: rp.id,
        shortUrl: rp.shortUrl,
      },
    });
  })
);

// Verify subscription payment after checkout
router.post(
  "/verify",
  asyncHandler(async (req, res) => {
    const sellerId = req.user?.userId;
    const { razorpaySubscriptionId, razorpayPaymentId, razorpaySignature } = req.body || {};

    if (!sellerId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (!razorpaySubscriptionId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: "Missing verification parameters" });
    }

    const ok = verifyRazorpaySubscriptionSignature({
      razorpaySubscriptionId,
      razorpayPaymentId,
      razorpaySignature,
    });
    if (!ok) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const sub = await SellerSubscription.findOne({
      sellerId,
      razorpaySubscriptionId,
    });
    if (!sub) {
      return res.status(404).json({ success: false, message: "Subscription record not found" });
    }

    sub.razorpayPaymentId = razorpayPaymentId;
    // Mark active locally; Razorpay webhook can be added later for full lifecycle sync
    sub.status = "active";
    await sub.save();

    return res.status(200).json({
      success: true,
      message: "Subscription verified",
      data: { subscriptionId: razorpaySubscriptionId },
    });
  })
);

export default router;

