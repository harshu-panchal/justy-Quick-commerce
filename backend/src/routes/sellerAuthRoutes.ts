import { Router } from "express";
import * as sellerAuthController from "../modules/seller/controllers/sellerAuthController";
import { otpRateLimiter, loginRateLimiter } from "../middleware/rateLimiter";
import { authenticate } from "../middleware/auth";

const router = Router();

// Send OTP routes
router.post("/send-otp", otpRateLimiter, sellerAuthController.sendOTP);
router.post("/send-email-otp", otpRateLimiter, sellerAuthController.sendEmailOTP);
router.post("/send-mobile-otp-register", otpRateLimiter, sellerAuthController.sendRegistrationMobileOTP);

// Verify OTP routes
router.post("/verify-otp", loginRateLimiter, sellerAuthController.verifyOTP);
router.post("/verify-email-otp", loginRateLimiter, sellerAuthController.verifyEmailOTP);

// Register route
router.post("/register", sellerAuthController.register);

// Profile routes (protected)
router.get("/profile", authenticate, sellerAuthController.getProfile);
router.put("/profile", authenticate, sellerAuthController.updateProfile);
router.put("/toggle-shop-status", authenticate, sellerAuthController.toggleShopStatus);

export default router;
