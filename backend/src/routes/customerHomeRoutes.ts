import { Router } from "express";
import { getHomeContent, getStoreProducts, checkServiceability, getHeaderCategorySections } from "../modules/customer/controllers/customerHomeController";

const router = Router();

// Public routes
router.get("/serviceability", checkServiceability);
router.get("/", getHomeContent);
router.get("/header-category/:slug", getHeaderCategorySections);
router.get("/store/:storeId", getStoreProducts);

export default router;
