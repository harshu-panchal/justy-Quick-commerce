import { Router } from 'express';
import {
    createBanner,
    getAllBanners,
    deleteBanner,
    getBannersByType,
} from '../controllers/bannerController';
import { authenticate, requireUserType } from '../middleware/auth';

const router = Router();

/**
 * Public Routes
 * These will be accessible at GET /api/v1/banners/:type
 */
router.get('/banners/:type', getBannersByType);

/**
 * Admin Routes (Protected)
 * These will be accessible at:
 * POST /api/v1/admin/banners
 * GET /api/v1/admin/banners
 * DELETE /api/v1/admin/banners/:id
 */
router.post('/admin/banners', authenticate, requireUserType('Admin'), createBanner);
router.get('/admin/banners', authenticate, requireUserType('Admin'), getAllBanners);
router.delete('/admin/banners/:id', authenticate, requireUserType('Admin'), deleteBanner);

export default router;
