import { Router } from "express";
import {
  getSellerComplaints,
  updateComplaintStatus,
} from "../modules/seller/controllers/complaintController";
import { authenticate, requireUserType } from "../middleware/auth";

const router = Router();

// All routes require authentication and seller user type
router.use(authenticate);
router.use(requireUserType("Seller"));

// Get seller's complaints
router.get("/", getSellerComplaints);

// Update complaint status/response
router.patch("/:id/status", updateComplaintStatus);

export default router;
