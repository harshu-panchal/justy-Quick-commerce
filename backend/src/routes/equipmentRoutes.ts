import { Router } from 'express';
import { authenticate, requireUserType } from '../middleware/auth';
import * as sellerEquipmentController from '../modules/seller/controllers/sellerEquipmentController';

const router = Router();

// All routes require seller authentication
router.use(authenticate);
router.use(requireUserType('Seller'));

/**
 * Equipment Marketplace (Seller facing)
 */
router.get('/items', sellerEquipmentController.getActiveEquipmentItems);
router.post('/orders', sellerEquipmentController.createEquipmentOrder);
router.post('/orders/:orderId/create-payment', sellerEquipmentController.createEquipmentRazorpayOrder);
router.post('/orders/:orderId/verify-payment', sellerEquipmentController.verifyEquipmentPayment);
router.get('/orders/my', sellerEquipmentController.getSellerEquipmentOrders);
router.post('/orders/:id/cancel', sellerEquipmentController.cancelEquipmentOrder);
router.post('/orders/request-refund', sellerEquipmentController.requestEquipmentRefund);

export default router;
