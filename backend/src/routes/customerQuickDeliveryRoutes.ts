import { Router } from "express";
import { getQuickDeliveryProducts, recordPincodeDemand } from "../modules/customer/controllers/quickDeliveryController";

const router = Router();

// Public route to check quick delivery products in a pincode
router.get("/", getQuickDeliveryProducts);

// Route to record pincode demand
router.post("/", recordPincodeDemand);

export default router;
