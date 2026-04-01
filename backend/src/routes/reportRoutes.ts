import { Router } from "express";
import { getSalesReport, getAnalytics, getGrowthInsights } from "../modules/seller/controllers/reportController";
import { authenticate, requireUserType } from "../middleware/auth";

const router = Router();

router.use(authenticate);
router.use(requireUserType("Seller"));

router.get("/sales", getSalesReport);
router.get("/analytics", getAnalytics);
router.get("/growth", getGrowthInsights);

export default router;
