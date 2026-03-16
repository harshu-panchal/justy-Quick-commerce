import { Request, Response } from 'express';
import { Banner } from '../models';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Create a new banner (Admin)
 */
export const createBanner = asyncHandler(async (req: Request, res: Response) => {
    const { title, imageUrl, type, isActive } = req.body;

    const banner = await Banner.create({
        title,
        imageUrl,
        type,
        isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
        success: true,
        message: 'Banner created successfully',
        data: banner,
    });
});

/**
 * Get all banners (Admin)
 */
export const getAllBanners = asyncHandler(async (_req: Request, res: Response) => {
    const banners = await Banner.find().sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        data: banners,
    });
});

/**
 * Delete a banner (Admin)
 */
export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const banner = await Banner.findByIdAndDelete(id);

    if (!banner) {
        res.status(404).json({
            success: false,
            message: 'Banner not found',
        });
        return;
    }

    res.status(200).json({
        success: true,
        message: 'Banner deleted successfully',
    });
});

/**
 * Get banners by type (Public/User)
 */
export const getBannersByType = asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params;

    if (type !== 'quick' && type !== 'scheduled') {
        res.status(400).json({
            success: false,
            message: 'Invalid banner type. Must be "quick" or "scheduled".',
        });
        return;
    }

    const banners = await Banner.find({
        type,
        isActive: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        data: banners,
    });
});
