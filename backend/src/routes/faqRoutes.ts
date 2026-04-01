import { Router } from "express";
import FAQ from "../models/FAQ";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * Get all active FAQs with optional category filter
 */
router.get("/", asyncHandler(async (req, res) => {
    const { category } = req.query;
    const query: any = { status: "Active" };
    
    if (category) {
        query.category = category;
    }

    const faqs = await FAQ.find(query).sort({ order: 1, createdAt: -1 });

    return res.status(200).json({
        success: true,
        data: faqs,
    });
}));

/**
 * Get FAQ by ID
 */
router.get("/:id", asyncHandler(async (req, res) => {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) {
        return res.status(404).json({ success: false, message: "FAQ not found" });
    }
    return res.status(200).json({ success: true, data: faq });
}));

export default router;
