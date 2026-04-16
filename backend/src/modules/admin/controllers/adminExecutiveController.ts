import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import Executive from "../../../models/Executive";

/**
 * Get all executives
 */
export const getExecutives = asyncHandler(async (req: Request, res: Response) => {
    const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc",
    } = req.query;

    const query: any = {};

    // Search filter
    if (search) {
        query.name = { $regex: search, $options: "i" };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const sort: any = {};
    sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    const [executives, total] = await Promise.all([
        Executive.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit as string)),
        Executive.countDocuments(query),
    ]);

    return res.status(200).json({
        success: true,
        message: "Executives fetched successfully",
        data: executives,
        pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
        },
    });
});

/**
 * Get executive by ID
 */
export const getExecutiveById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const executive = await Executive.findById(id);

    if (!executive) {
        return res.status(404).json({
            success: false,
            message: "Executive not found",
        });
    }

    return res.status(200).json({
        success: true,
        message: "Executive fetched successfully",
        data: executive,
    });
});

/**
 * Create a new executive
 */
export const createExecutive = asyncHandler(async (req: Request, res: Response) => {
    const { name, mobile, isActive } = req.body;

    if (!name) {
        return res.status(400).json({
            success: false,
            message: "Executive name is required",
        });
    }

    // Check for duplicate name
    const existing = await Executive.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
        return res.status(400).json({
            success: false,
            message: "An executive with this name already exists",
        });
    }

    const executive = await Executive.create({
        name,
        mobile,
        isActive: isActive !== undefined ? isActive : true,
    });

    return res.status(201).json({
        success: true,
        message: "Executive created successfully",
        data: executive,
    });
});

/**
 * Update executive
 */
export const updateExecutive = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, mobile, isActive } = req.body;

    const executive = await Executive.findById(id);

    if (!executive) {
        return res.status(404).json({
            success: false,
            message: "Executive not found",
        });
    }

    if (name !== undefined) {
        // Check for duplicate name if name is changing
        if (name.toLowerCase() !== executive.name.toLowerCase()) {
            const existing = await Executive.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: "An executive with this name already exists",
                });
            }
        }
        executive.name = name;
    }
    if (mobile !== undefined) executive.mobile = mobile;
    if (isActive !== undefined) executive.isActive = isActive;

    await executive.save();

    return res.status(200).json({
        success: true,
        message: "Executive updated successfully",
        data: executive,
    });
});

/**
 * Delete executive
 */
export const deleteExecutive = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const executive = await Executive.findById(id);

    if (!executive) {
        return res.status(404).json({
            success: false,
            message: "Executive not found",
        });
    }

    await Executive.findByIdAndDelete(id);

    return res.status(200).json({
        success: true,
        message: "Executive deleted successfully",
    });
});

/**
 * Get active executives for public use (e.g. signup)
 */
export const getPublicExecutives = asyncHandler(async (_req: Request, res: Response) => {
    const executives = await Executive.find({ isActive: true }).select("name");

    return res.status(200).json({
        success: true,
        message: "Executives fetched successfully",
        data: executives,
    });
});
