import crypto from "crypto";
import mongoose from "mongoose";
import { Router } from "express";
import { authenticate, requireUserType } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import SpinCampaign from "../models/SpinCampaign";
import SpinAttempt from "../models/SpinAttempt";
import Seller from "../models/Seller";
import { creditWallet } from "../services/walletManagementService";

const COINS_PER_RUPEE = 10;

const router = Router();

router.use(authenticate);
router.use(requireUserType("Seller"));

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
      userType: "Seller",
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
      data: {
        campaign,
        mySpin,
        cooldownSeconds: 24 * 60 * 60,
        nextEligibleAt,
      },
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
      userType: "Seller",
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

    // Atomic increment using findOneAndUpdate (works without replica set)
    const prevCampaign = await SpinCampaign.findById(campaign._id);
    if (!prevCampaign || !prevCampaign.isActive) {
      return res.status(404).json({ success: false, message: "No active spin campaign" });
    }

    let blockIndex = prevCampaign.blockIndex;
    let blockWinningSpinNumber = prevCampaign.blockWinningSpinNumber;
    let newBlockSpinCount: number;

    if (prevCampaign.blockSpinCount >= prevCampaign.blockSize) {
      // start a new block
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
      userType: "Seller",
      userId: userObjectId,
      resultType: isMega ? "MEGA_REWARD" : "COINS",
      coinsWon,
      megaRewardName: isMega ? prevCampaign.megaReward?.name : undefined,
      megaRewardImageUrl: isMega ? prevCampaign.megaReward?.imageUrl : undefined,
      blockIndex,
      spinNumberInBlock: newBlockSpinCount,
    });

    // Credit coins to seller's coinBalance
    if (!isMega && coinsWon > 0) {
      await Seller.findByIdAndUpdate(userObjectId, { $inc: { coinBalance: coinsWon } });
    }

    const updatedSeller = await Seller.findById(userObjectId).select("coinBalance").lean();

    return res.status(200).json({
      success: true,
      message: isMega ? "Mega reward won!" : "Coins won",
      data: { ...spinDoc.toObject(), coinBalance: updatedSeller?.coinBalance ?? 0 },
    });
  })
);

// GET /seller/spin-wheel/coins/balance
router.get(
  "/coins/balance",
  asyncHandler(async (req, res) => {
    const rawUserId = req.user?.userId;
    if (!rawUserId || !mongoose.Types.ObjectId.isValid(rawUserId)) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const seller = await Seller.findById(rawUserId).select("coinBalance balance").lean();
    if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });
    return res.status(200).json({
      success: true,
      data: { coinBalance: seller.coinBalance ?? 0, walletBalance: seller.balance ?? 0 },
    });
  })
);

// POST /seller/spin-wheel/coins/convert
router.post(
  "/coins/convert",
  asyncHandler(async (req, res) => {
    const rawUserId = req.user?.userId;
    if (!rawUserId || !mongoose.Types.ObjectId.isValid(rawUserId)) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const { coins } = req.body;
    const coinsToConvert = Number(coins);
    if (!coinsToConvert || coinsToConvert < COINS_PER_RUPEE || coinsToConvert % COINS_PER_RUPEE !== 0) {
      return res.status(400).json({
        success: false,
        message: `Coins must be a multiple of ${COINS_PER_RUPEE} (minimum ${COINS_PER_RUPEE} coins = ₹1)`,
      });
    }

    const seller = await Seller.findById(rawUserId).select("coinBalance balance").lean();
    if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });
    if ((seller.coinBalance ?? 0) < coinsToConvert) {
      return res.status(400).json({ success: false, message: "Insufficient coin balance" });
    }

    const rupeesEarned = coinsToConvert / COINS_PER_RUPEE;

    await Seller.findByIdAndUpdate(rawUserId, { $inc: { coinBalance: -coinsToConvert } });
    await creditWallet(rawUserId, "SELLER", rupeesEarned, `Coins converted: ${coinsToConvert} coins → ₹${rupeesEarned}`);

    const updated = await Seller.findById(rawUserId).select("coinBalance balance").lean();
    return res.status(200).json({
      success: true,
      message: `${coinsToConvert} coins converted to ₹${rupeesEarned} successfully!`,
      data: { coinBalance: updated?.coinBalance ?? 0, walletBalance: updated?.balance ?? 0, rupeesEarned },
    });
  })
);

export default router;

