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

    const prevCampaign = await SpinCampaign.findById(campaign._id);
    if (!prevCampaign || !prevCampaign.isActive) {
      return res.status(404).json({ success: false, message: "No active spin campaign" });
    }

    let blockIndex = prevCampaign.blockIndex;
    let blockWinningSpinNumber = prevCampaign.blockWinningSpinNumber;
    let newBlockSpinCount: number;

    if (prevCampaign.blockSpinCount >= prevCampaign.blockSize) {
      blockIndex += 1;
      blockWinningSpinNumber = crypto.randomInt(1, prevCampaign.blockSize + 1);
      newBlockSpinCount = 1;
    } else {
      newBlockSpinCount = prevCampaign.blockSpinCount + 1;
    }

    const isMega = newBlockSpinCount === blockWinningSpinNumber;
    const coinOptions = Array.isArray(prevCampaign.coinRewards) && prevCampaign.coinRewards.length
      ? prevCampaign.coinRewards : [{ amount: 10 }];
    const coinPick = coinOptions[crypto.randomInt(0, coinOptions.length)];
    const coinsWon = isMega ? 0 : Number((coinPick as any).amount || 0);

    await SpinCampaign.findByIdAndUpdate(campaign._id, {
      $set: { blockIndex, blockWinningSpinNumber, blockSpinCount: newBlockSpinCount },
    });

    const spinDoc = await SpinAttempt.create({
      campaignId: campaign._id,
      userType: "Customer",
      userId: userObjectId,
      customerId: userObjectId,
      resultType: isMega ? "MEGA_REWARD" : "COINS",
      coinsWon,
      megaRewardName: isMega ? prevCampaign.megaReward?.name : undefined,
      megaRewardImageUrl: isMega ? prevCampaign.megaReward?.imageUrl : undefined,
      blockIndex,
      spinNumberInBlock: newBlockSpinCount,
    });

    return res.status(200).json({
      success: true,
      message: isMega ? "Mega reward won!" : "Coins won",
      data: spinDoc,
    });
  })
);

export default router;

