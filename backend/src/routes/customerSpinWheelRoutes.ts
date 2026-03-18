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
    const customerId = req.user?.userId;
    const campaign = await SpinCampaign.findOne({ isActive: true }).sort({ updatedAt: -1 }).lean();
    if (!campaign) {
      return res.status(200).json({ success: true, message: "No active campaign", data: { campaign: null, mySpin: null } });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const mySpin = customerId
      ? await SpinAttempt.findOne({
          campaignId: campaign._id,
          userType: "Customer",
          userId: customerId,
          createdAt: { $gte: since },
        })
          .sort({ createdAt: -1 })
          .lean()
      : null;

    return res.status(200).json({
      success: true,
      message: "Campaign fetched",
      data: {
        campaign,
        mySpin,
        cooldownSeconds: 24 * 60 * 60,
        nextEligibleAt: mySpin?.createdAt ? new Date(new Date(mySpin.createdAt).getTime() + 24 * 60 * 60 * 1000) : null,
      },
    });
  })
);

router.post(
  "/spin",
  asyncHandler(async (req, res) => {
    const customerId = req.user?.userId;
    if (!customerId) return res.status(401).json({ success: false, message: "Authentication required" });

    const campaign = await SpinCampaign.findOne({ isActive: true }).sort({ updatedAt: -1 });
    if (!campaign) return res.status(404).json({ success: false, message: "No active spin campaign" });

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await SpinAttempt.findOne({
      campaignId: campaign._id,
      userType: "Customer",
      userId: customerId,
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

    // optimistic-concurrency loop to guarantee 1 mega per block even under load
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

        // start new block if needed
        if (fresh.blockSpinCount >= fresh.blockSize) {
          fresh.blockIndex += 1;
          fresh.blockSpinCount = 0;
          fresh.blockWinningSpinNumber = crypto.randomInt(1, fresh.blockSize + 1);
        }

        const nextSpinNumber = fresh.blockSpinCount + 1; // 1..blockSize
        const isMega = nextSpinNumber === fresh.blockWinningSpinNumber;

        // pick coin reward for non-mega
        const coinOptions = Array.isArray(fresh.coinRewards) && fresh.coinRewards.length ? fresh.coinRewards : [{ amount: 10 }];
        const coinPick = coinOptions[crypto.randomInt(0, coinOptions.length)];
        const coinsWon = isMega ? 0 : Number((coinPick as any).amount || 0);

        // update campaign count
        fresh.blockSpinCount = nextSpinNumber;
        await fresh.save({ session });

        // create spin attempt
        const spinDoc = await SpinAttempt.create(
          [
            {
              campaignId: fresh._id,
              userType: "Customer",
              userId: customerId,
              customerId, // backward compatibility
              resultType: isMega ? "MEGA_REWARD" : "COINS",
              coinsWon,
              megaRewardName: isMega ? fresh.megaReward?.name : undefined,
              megaRewardImageUrl: isMega ? fresh.megaReward?.imageUrl : undefined,
              blockIndex: fresh.blockIndex,
              spinNumberInBlock: nextSpinNumber,
            },
          ],
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

        // Retry on duplicate key (another concurrent spin)
        const msg = String(e?.message || "");
        if (msg.includes("E11000") || msg.toLowerCase().includes("duplicate")) continue;
        return res.status(500).json({ success: false, message: e?.message || "Spin failed" });
      }
    }

    return res.status(429).json({ success: false, message: "Too much contention. Please retry." });
  })
);

export default router;

