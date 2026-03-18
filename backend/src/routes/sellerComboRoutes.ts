import { Router } from "express";
import * as sellerComboController from "../modules/seller/controllers/sellerComboController";
import { authenticate, requireUserType } from "../middleware/auth";

const router = Router();

// All seller combo routes require authentication and "Seller" user type
router.use(authenticate);
router.use(requireUserType("Seller"));

// Get seller's own combos
router.get("/", sellerComboController.getMyComboOffers);

// Create a new combo
router.post("/", sellerComboController.createSellerCombo);

// Delete a combo
router.delete("/:id", sellerComboController.deleteMyComboOffer);

export default router;
