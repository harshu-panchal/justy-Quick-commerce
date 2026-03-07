import { Router } from "express";
import { getQuickDeliveryProducts } from "../modules/customer/controllers/quickDeliveryController";

const router = Router();

// Public route to check quick delivery products in a pincode
router.get("/", getQuickDeliveryProducts);

export default router;
