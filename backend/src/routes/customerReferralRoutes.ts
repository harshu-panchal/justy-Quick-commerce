import { Router } from "express";
import * as referralController from "../modules/customer/controllers/referralController";
import { authenticate } from "../middleware/auth";

const router = Router();

// Apply a referral code (protected route)
router.post("/apply", authenticate, referralController.applyReferralCode);

// Get referral statistics (protected route)
router.get("/stats", authenticate, referralController.getReferralStats);

export default router;
