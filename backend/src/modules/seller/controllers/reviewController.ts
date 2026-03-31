import { Request, Response } from "express";
import Review from "../../../models/Review";
import Product from "../../../models/Product";
import mongoose from "mongoose";
import { asyncHandler } from "../../../utils/asyncHandler";

/**
 * Get all reviews for the products belonging to the logged-in seller
 */
export const getSellerReviews = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user?.userId;

  if (!sellerId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Seller not found",
    });
  }

  // Step 1: Find all products belonging to this seller
  const sellerProducts = await Product.find({ seller: sellerId }).select("_id");
  const productIds = sellerProducts.map((p) => p._id);

  // Step 2: Find all reviews for these products
  const reviews = await Review.find({ product: { $in: productIds } })
    .populate("product", "productName mainImage")
    .populate("customer", "name profileImage")
    .sort({ createdAt: -1 });

  // Step 3: Calculate summary statistics
  const stats = {
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 
      ? Math.round((reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length) * 10) / 10 
      : 0,
    distribution: {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    }
  };

  return res.status(200).json({
    success: true,
    count: reviews.length,
    stats,
    data: reviews,
  });
});

/**
 * Update review status (optional, if seller can approve/reject)
 */
export const updateReviewStatus = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const { status } = req.body;
  const sellerId = (req as any).user?.userId;

  if (!["Approved", "Rejected", "Pending"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status value",
    });
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: "Review not found",
    });
  }

  // Check if the product belongs to the seller
  const product = await Product.findById(review.product);
  if (!product || product.seller.toString() !== sellerId) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized: You can only update status for your own product reviews",
    });
  }

  review.status = status;
  await review.save();

  return res.status(200).json({
    success: true,
    message: `Review status updated to ${status}`,
    data: review,
  });
});

/**
 * Seller reply to a review
 */
export const replyToReview = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const { reply } = req.body;
  const sellerId = (req as any).user?.userId;

  if (!reply || reply.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Reply content is required",
    });
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: "Review not found",
    });
  }

  // Check if the product belongs to the seller
  const product = await Product.findById(review.product);
  if (!product || product.seller.toString() !== sellerId) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized: You can only reply to reviews for your own products",
    });
  }

  review.sellerReply = reply;
  review.sellerRepliedAt = new Date();
  await review.save();

  return res.status(200).json({
    success: true,
    message: "Reply posted successfully",
    data: review,
  });
});
