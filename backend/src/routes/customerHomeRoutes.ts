import { Router } from "express";
import { getHomeContent, getStoreProducts, checkServiceability, getHeaderCategorySections, getPublicSpinnerSettings } from "../modules/customer/controllers/customerHomeController";

const router = Router();

// Public routes
router.get("/serviceability", checkServiceability);
router.get("/", getHomeContent);
router.get("/header-category/:slug", getHeaderCategorySections);
router.get("/store/:storeId", getStoreProducts);
router.get("/spinner-settings", getPublicSpinnerSettings);

export default router;
