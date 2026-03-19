import crypto from "crypto";
import mongoose from "mongoose";
import { Router } from "express";
import { authenticate, requireUserType } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import SpinCampaign from "../models/SpinCampaign";
import SpinAttempt from "../models/SpinAttempt";

const router = Router();

router.use(authenticate);
router.use(requireUserType("Customer"));

router.get(
  "/campaign",
  asyncHandler(async (req, res) => {
    const rawUserId = req.user?.userId;
    if (!rawUserId || !mongoose.Types.ObjectId.isValid(rawUserId)) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const userObjectId = new mongoose.Types.ObjectId(rawUserId);

    const campaign = await SpinCampaign.findOne({ isActive: true }).sort({ updatedAt: -1 }).lean();
    if (!campaign) {
      return res.status(200).json({ success: true, message: "No active campaign", data: { campaign: null, mySpin: null } });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const mySpin = await SpinAttempt.findOne({
      campaignId: campaign._id,
      userType: "Customer",
      userId: userObjectId,
      createdAt: { $gte: since },
    })
      .sort({ createdAt: -1 })
      .lean();

    const nextEligibleAt = mySpin?.createdAt
      ? new Date(new Date(mySpin.createdAt).getTime() + 24 * 60 * 60 * 1000)
      : null;

    return res.status(200).json({
      success: true,
      message: "Campaign fetched",
      data: { campaign, mySpin, cooldownSeconds: 24 * 60 * 60, nextEligibleAt },
    });
  })
);

router.post(
  "/spin",
  asyncHandler(async (req, res) => {
    const rawUserId = req.user?.userId;
    if (!rawUserId || !mongoose.Types.ObjectId.isValid(rawUserId)) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const userObjectId = new mongoose.Types.ObjectId(rawUserId);

    const campaign = await SpinCampaign.findOne({ isActive: true }).sort({ updatedAt: -1 });
    if (!campaign) return res.status(404).json({ success: false, message: "No active spin campaign" });

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await SpinAttempt.findOne({
      campaignId: campaign._id,
      userType: "Customer",
      userId: userObjectId,
      createdAt: { $gte: since },
    })
      .sort({ createdAt: -1 })
      .lean();
    if (recent) {
      const nextEligibleAt = new Date(new Date(recent.createdAt).getTime() + 24 * 60 * 60 * 1000);
      return res.status(200).json({
        success: true,
        message: "Cooldown active",
        data: { ...recent, nextEligibleAt },
      });
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const fresh = await SpinCampaign.findById(campaign._id).session(session);
        if (!fresh || !fresh.isActive) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ success: false, message: "No active spin campaign" });
        }

        if (fresh.blockSpinCount >= fresh.blockSize) {
          fresh.blockIndex += 1;
          fresh.blockSpinCount = 0;
          fresh.blockWinningSpinNumber = crypto.randomInt(1, fresh.blockSize + 1);
        }

        const nextSpinNumber = fresh.blockSpinCount + 1;
        const isMega = nextSpinNumber === fresh.blockWinningSpinNumber;

        const coinOptions = Array.isArray(fresh.coinRewards) && fresh.coinRewards.length ? fresh.coinRewards : [{ amount: 10 }];
        const coinPick = coinOptions[crypto.randomInt(0, coinOptions.length)];
        const coinsWon = isMega ? 0 : Number((coinPick as any).amount || 0);

        fresh.blockSpinCount = nextSpinNumber;
        await fresh.save({ session });

        const spinDoc = await SpinAttempt.create(
          [{
            campaignId: fresh._id,
            userType: "Customer",
            userId: userObjectId,
            customerId: userObjectId,
            resultType: isMega ? "MEGA_REWARD" : "COINS",
            coinsWon,
            megaRewardName: isMega ? fresh.megaReward?.name : undefined,
            megaRewardImageUrl: isMega ? fresh.megaReward?.imageUrl : undefined,
            blockIndex: fresh.blockIndex,
            spinNumberInBlock: nextSpinNumber,
          }],
          { session }
        );

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
          success: true,
          message: isMega ? "Mega reward won!" : "Coins won",
          data: spinDoc[0],
        });
      } catch (e: any) {
        await session.abortTransaction();
        session.endSession();
        const msg = String(e?.message || "");
        if (msg.includes("E11000") || msg.toLowerCase().includes("duplicate")) continue;
        return res.status(500).json({ success: false, message: e?.message || "Spin failed" });
      }
    }

    return res.status(429).json({ success: false, message: "Too much contention. Please retry." });
  })
);

export default router;

