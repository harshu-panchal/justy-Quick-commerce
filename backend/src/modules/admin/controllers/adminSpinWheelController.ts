import crypto from "crypto";
import { Request, Response } from "express";
import SpinCampaign from "../../../models/SpinCampaign";
import { asyncHandler } from "../../../utils/asyncHandler";

function clampInt(v: any, min: number, max: number, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

export const getSpinCampaign = asyncHandler(async (_req: Request, res: Response) => {
  const campaign = await SpinCampaign.findOne().sort({ updatedAt: -1 }).lean();
  return res.status(200).json({ success: true, message: "Spin campaign fetched", data: campaign || null });
});

export const upsertSpinCampaign = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    isActive,
    megaEveryNSpins,
    megaRewardName,
    megaRewardImageUrl,
    coinRewards,
  } = req.body || {};

  const n = clampInt(megaEveryNSpins, 2, 100000, 100);
  const coins: Array<{ amount: number }> = Array.isArray(coinRewards)
    ? coinRewards
        .map((c: any) => ({ amount: clampInt(c?.amount ?? c, 1, 1000000, 10) }))
        .filter((c) => Number.isFinite(c.amount) && c.amount > 0)
    : [{ amount: 10 }, { amount: 20 }, { amount: 50 }];

  const megaName = String(megaRewardName || "").trim() || "Mega Reward";
  const megaImg = String(megaRewardImageUrl || "").trim() || undefined;

  const existing = await SpinCampaign.findOne().sort({ updatedAt: -1 });
  const winningSpinNumber = crypto.randomInt(1, n + 1);

  if (!existing) {
    const created = await SpinCampaign.create({
      title: String(title || "Spin & Win").trim(),
      isActive: typeof isActive === "boolean" ? isActive : true,
      megaEveryNSpins: n,
      megaReward: { name: megaName, imageUrl: megaImg },
      coinRewards: coins,
      blockSize: n,
      blockIndex: 1,
      blockSpinCount: 0,
      blockWinningSpinNumber: winningSpinNumber,
    });
    return res.status(201).json({ success: true, message: "Spin campaign created", data: created });
  }

  existing.title = String(title || existing.title).trim();
  if (typeof isActive === "boolean") existing.isActive = isActive;
  existing.megaEveryNSpins = n;
  existing.blockSize = n;
  existing.megaReward = { name: megaName, imageUrl: megaImg };
  existing.coinRewards = coins as any;

  // If admin changes N, reset block state to avoid inconsistent guarantees
  existing.blockIndex = 1;
  existing.blockSpinCount = 0;
  existing.blockWinningSpinNumber = winningSpinNumber;

  await existing.save();

  return res.status(200).json({ success: true, message: "Spin campaign updated", data: existing });
});

