import { Router } from "express";
import * as executiveAuthController from "../modules/executive/controllers/executiveAuthController";
import * as executiveController from "../modules/executive/controllers/executiveController";
import { authenticate, requireUserType } from "../middleware/auth";

const router = Router();

// ==================== Public Auth Routes ====================
router.post("/auth/send-otp", executiveAuthController.sendOTP);
router.post("/auth/verify-otp", executiveAuthController.verifyOTP);
router.post("/auth/register", executiveAuthController.register);

// ==================== Protected Routes ====================
router.use(authenticate);
router.use(requireUserType("Executive"));

// Profile
router.patch("/profile", executiveAuthController.updateProfile);
router.patch("/profile/kyc", executiveAuthController.updateKYC);

// Dashboard & Stats
router.get("/dashboard/stats", executiveController.getDashboardStats);

// Sellers
router.get("/sellers", executiveController.getOnboardedSellers);

// Wallet & Withdrawals
router.get("/wallet/transactions", executiveController.getWalletTransactions);
router.post("/wallet/withdraw", executiveController.requestWithdrawal);

export default router;
