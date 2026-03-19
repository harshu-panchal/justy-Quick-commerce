import { Router } from "express";
import { authenticate, requireUserType } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { generateProductDescription } from "../services/geminiService";

const router = Router();

router.use(authenticate);

// Sellers and Admin can use product‑related AI helpers
router.use(requireUserType("Seller", "Admin"));

router.post(
  "/product-description",
  asyncHandler(async (req, res) => {
    const { name, category, tags, existingDescription } = req.body || {};

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    const description = await generateProductDescription({
      name,
      category,
      tags: Array.isArray(tags) ? tags : undefined,
      existingDescription:
        typeof existingDescription === "string" ? existingDescription : undefined,
    });

    return res.status(200).json({
      success: true,
      message: "AI description generated",
      data: { description },
    });
  })
);

export default router;

