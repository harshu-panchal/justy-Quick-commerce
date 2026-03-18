import api from "../config";
import { ApiResponse } from "./types";

export interface SpinCampaign {
  _id: string;
  title: string;
  isActive: boolean;
  megaEveryNSpins: number;
  megaReward: { name: string; imageUrl?: string };
  coinRewards: Array<{ amount: number }>;
  blockSize: number;
  blockIndex: number;
  blockSpinCount: number;
  blockWinningSpinNumber: number;
  createdAt?: string;
  updatedAt?: string;
}

export async function getSpinCampaign(): Promise<ApiResponse<SpinCampaign | null>> {
  const res = await api.get<ApiResponse<SpinCampaign | null>>("/admin/spin-wheel/campaign");
  return res.data;
}

export async function upsertSpinCampaign(payload: {
  title?: string;
  isActive?: boolean;
  megaEveryNSpins: number;
  megaRewardName: string;
  megaRewardImageUrl?: string;
  coinRewards: Array<{ amount: number } | number>;
}): Promise<ApiResponse<SpinCampaign>> {
  const res = await api.put<ApiResponse<SpinCampaign>>("/admin/spin-wheel/campaign", payload);
  return res.data;
}

