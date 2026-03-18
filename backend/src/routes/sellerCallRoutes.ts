import { Router } from "express";
import { authenticate, requireUserType } from "../middleware/auth";
import { listVendorsForCall, createAgoraRtcToken } from "../modules/seller/controllers/sellerCallController";

const router = Router();

router.use(authenticate);
router.use(requireUserType("Seller"));

router.get("/vendors", listVendorsForCall);
router.post("/agora-token", createAgoraRtcToken);

export default router;

