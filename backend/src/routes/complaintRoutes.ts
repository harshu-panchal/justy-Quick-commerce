import express from "express";
import { authenticate } from "../middleware/auth";
import { createComplaint, getCustomerComplaints } from "../modules/customer/controllers/complaintController";

const router = express.Router();

router.post("/", authenticate, createComplaint);
router.get("/", authenticate, getCustomerComplaints);

export default router;
