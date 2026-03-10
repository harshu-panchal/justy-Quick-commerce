import { Router } from "express";
import { getProducts, getProductById, getProductsBySubcategory } from "../modules/customer/controllers/customerProductController";

const router = Router();

// Public routes (no auth required for viewing products)
router.get("/", getProducts);
router.get("/subcategory/:slug", getProductsBySubcategory);
router.get("/:id", getProductById);

export default router;
