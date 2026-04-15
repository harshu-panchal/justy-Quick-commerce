import { Router } from "express";
import adminAuthRoutes from "./adminAuthRoutes";
import sellerAuthRoutes from "./sellerAuthRoutes";
import dashboardRoutes from "./dashboardRoutes";
import customerAuthRoutes from "./customerAuthRoutes";
import deliveryRoutes from "./deliveryRoutes";
import deliveryAuthRoutes from "./deliveryAuthRoutes";

// ... (other imports)
import { authenticate, requireUserType } from "../middleware/auth";
import customerRoutes from "./customerRoutes";
import customerReferralRoutes from "./customerReferralRoutes";
import sellerRoutes from "./sellerRoutes";
import uploadRoutes from "./uploadRoutes";
import productRoutes from "./productRoutes";
import headerCategoryRoutes from "./headerCategoryRoutes";
import categoryRoutes from "./categoryRoutes";
import orderRoutes from "./orderRoutes";
import returnRoutes from "./returnRoutes";
import reportRoutes from "./reportRoutes";
import walletRoutes from "./walletRoutes";
import taxRoutes from "./taxRoutes";
import customerProductRoutes from "./customerProductRoutes";
import customerCategoryRoutes from "./customerCategoryRoutes";
import customerCouponRoutes from "./customerCouponRoutes";
import customerAddressRoutes from "./customerAddressRoutes";
import customerHomeRoutes from "./customerHomeRoutes";
import customerQuickDeliveryRoutes from "./customerQuickDeliveryRoutes";
import customerCartRoutes from "./customerCartRoutes";
import wishlistRoutes from "./wishlistRoutes";
import productReviewRoutes from "./productReviewRoutes";
import adminRoutes from "./adminRoutes";
import customerTrackingRoutes from "../modules/customer/routes/trackingRoutes";
import deliveryTrackingRoutes from "../modules/delivery/routes/trackingRoutes";
import fcmTokenRoutes from "./fcmTokenRoutes";
import paymentRoutes from "./paymentRoutes";
import sellerWalletRoutes from "./sellerWalletRoutes";
import deliveryWalletRoutes from "./deliveryWalletRoutes";
import adminWithdrawalRoutes from "./adminWithdrawalRoutes";
import * as bannerController from "../controllers/bannerController";
import sellerComboRoutes from "./sellerComboRoutes";
import sellerCallRoutes from "./sellerCallRoutes";
import aiRoutes from "./aiRoutes";
import sellerPlanRoutes from "./sellerPlanRoutes";
import customerPlanRoutes from "./customerPlanRoutes";
import deliveryPlanRoutes from "./deliveryPlanRoutes";
import customerSpinWheelRoutes from "./customerSpinWheelRoutes";
import sellerSpinWheelRoutes from "./sellerSpinWheelRoutes";
import deliverySpinWheelRoutes from "./deliverySpinWheelRoutes";
import equipmentRoutes from "./equipmentRoutes";
import sellerReviewRoutes from "./sellerReviewRoutes";
import complaintRoutes from "./complaintRoutes";
import sellerComplaintRoutes from "./sellerComplaintRoutes";

import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  cancelOrderItem,
  requestReturn,
  updateOrderNotes,
  getPublicOrderDetails,
} from "../modules/customer/controllers/customerOrderController";

import faqRoutes from "./faqRoutes";

const router = Router();
router.use("/faqs", faqRoutes);

// Public Order View (QR Scan)
router.get("/public/orders/:id", getPublicOrderDetails);

// Health check route
router.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    message: "API is healthy",
    timestamp: new Date().toISOString(),
  });
});

router.get("/ping", (req, res) => {
  res.json({ success: true, message: "pong" });
});

// Debug all requests to v1
router.use((req, _res, next) => {
  console.log(`[V1-DEBUG] ${req.method} ${req.originalUrl}`);
  next();
});

// Specific order routes first to avoid overlap
router.post("/customer/orders/:id/items/:itemId/return", authenticate, requireUserType("Customer"), requestReturn);
router.post("/customer/orders/:id/items/:itemId/cancel", authenticate, requireUserType("Customer"), cancelOrderItem);
router.post("/customer/orders/:id/cancel", authenticate, requireUserType("Customer"), cancelOrder);
router.get("/customer/orders/:id", authenticate, requireUserType("Customer"), getOrderById);
router.get("/customer/orders", authenticate, requireUserType("Customer"), getMyOrders);
router.patch("/customer/orders/:id/notes", authenticate, requireUserType("Customer"), updateOrderNotes);

router.post(
  "/customer/orders",
  (_req, _res, next) => {
    console.log("✅ POST /customer/orders ROUTE MATCHED!");
    next();
  },
  authenticate,
  requireUserType("Customer"),
  createOrder
);

// Authentication routes
router.use("/auth/admin", adminAuthRoutes);
router.use("/auth/seller", sellerAuthRoutes);
router.use("/auth/customer", customerAuthRoutes);
router.use("/auth/delivery", deliveryAuthRoutes);

// Public settings route
import { getPublicSettings } from "../controllers/settingsController";
router.get("/public/settings", getPublicSettings);

// FCM Token routes (protected - requires authentication)
router.use("/fcm-tokens", authenticate, fcmTokenRoutes);

// Delivery routes (protected)
router.use(
  "/delivery",
  authenticate,
  requireUserType("Delivery"),
  deliveryRoutes
);
router.use(
  "/delivery",
  authenticate,
  requireUserType("Delivery"),
  deliveryTrackingRoutes
);

// Customer routes - Specific routes MUST be registered before general /customer route
// to prevent Express from matching the broader route first
router.use("/customer/referral", customerReferralRoutes);
router.use("/customer/products", customerProductRoutes);
router.use("/customer/categories", customerCategoryRoutes);

// Tracking routes (must be after specific order routes)
router.use("/customer", customerTrackingRoutes);

// Customer specific sub-routes
router.use("/customer/coupons", customerCouponRoutes);
router.use("/customer/addresses", customerAddressRoutes);
router.use("/customer/home", customerHomeRoutes);
router.use("/customer/quick-delivery", customerQuickDeliveryRoutes);
router.use("/customer/cart", customerCartRoutes);
router.use("/customer/wishlist", wishlistRoutes);
router.use("/customer/reviews", productReviewRoutes);
router.use("/customer/complaints", complaintRoutes);

// General customer profile/location routes (catch-all for /customer)
router.use("/customer", customerRoutes);

// Seller dashboard routes
router.use("/seller/dashboard", dashboardRoutes);

// Seller management routes (protected, admin only)
router.use("/sellers", sellerRoutes);

// Banner routes (public)
router.get("/banners/:type", bannerController.getBannersByType);

// Role Management Routes
import roleRoutes from "./roleRoutes";
router.use("/admin/roles", roleRoutes);

// Admin routes (protected, admin only)
router.use("/admin", (req, res, next) => {
  console.log(`[ROUTE-DEBUG] Hit /admin - Path: ${req.path}`);
  next();
}, adminRoutes);

// Upload routes (protected)
router.use("/upload", uploadRoutes);

// Product routes (protected, seller only)
router.use("/products", productRoutes);

// Category routes (protected, seller/admin)
router.use("/categories", categoryRoutes);

// Header Category Routes
router.use("/header-categories", headerCategoryRoutes);

// Order routes (protected, seller only)
router.use("/orders", orderRoutes);

// Return routes (protected, seller only)
router.use("/returns", returnRoutes);

// Report routes (protected, seller only)
router.use("/seller/reports", reportRoutes);

// Wallet routes (protected, seller only)
router.use("/seller/wallet", walletRoutes);

// Seller Combo Offer routes
router.use("/seller/complaints", sellerComplaintRoutes);
router.use("/seller/combo-offers", sellerComboRoutes);

// Tax routes (protected, seller/admin)
router.use("/seller/taxes", taxRoutes);

// Payment routes (Razorpay integration)
router.use("/payment", paymentRoutes);

// Equipment Marketplace Routes
router.use("/equipment", equipmentRoutes);

// Seller wallet routes (protected, seller only)
router.use("/seller/wallet-new", authenticate, requireUserType("Seller"), sellerWalletRoutes);

// Seller call routes (protected, seller only)
router.use("/seller/calls", sellerCallRoutes);

// Seller plan routes (protected, seller only)
router.use("/seller/plans", sellerPlanRoutes);

// Customer plan routes (protected, customer only)
router.use("/customer/plans", customerPlanRoutes);

// Customer spin wheel (protected, customer only)
router.use("/customer/spin-wheel", customerSpinWheelRoutes);
router.use("/seller/spin-wheel", sellerSpinWheelRoutes);
router.use("/delivery/spin-wheel", deliverySpinWheelRoutes);

// Delivery plan routes (protected, delivery only)
router.use("/delivery/plans", deliveryPlanRoutes);

// AI helper routes (protected, seller only)
router.use("/ai", aiRoutes);

// Delivery wallet routes (protected, delivery only)
router.use("/delivery/wallet", authenticate, requireUserType("Delivery"), deliveryWalletRoutes);

// Admin withdrawal management routes (protected, admin only)
router.use("/admin/withdrawals", authenticate, requireUserType("Admin"), adminWithdrawalRoutes);

// Seller Review Routes
router.use("/seller/reviews", sellerReviewRoutes);

// Admin commission management routes (protected, admin only)


// Add more routes here
// router.use('/users', userRoutes);

export default router;
