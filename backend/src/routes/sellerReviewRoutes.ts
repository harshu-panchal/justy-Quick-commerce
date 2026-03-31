import { Router } from "express";
import { getSellerReviews, updateReviewStatus, replyToReview } from "../modules/seller/controllers/reviewController";
import { authenticate, requireUserType } from "../middleware/auth";

const router = Router();

// Protect all routes: only sellers can access their reviews
router.use(authenticate);
router.use(requireUserType("Seller"));

// Get all reviews for the seller's products
router.get("/", getSellerReviews);

// Update status of a specific review
router.patch("/:reviewId/status", updateReviewStatus);

// Reply to a review
router.post("/:reviewId/reply", replyToReview);

export default router;
