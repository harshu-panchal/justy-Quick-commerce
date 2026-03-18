import api from "./config";

export interface SpinCampaign {
  _id: string;
  title: string;
  isActive: boolean;
  megaEveryNSpins: number;
  megaReward: { name: string; imageUrl?: string };
  coinRewards: Array<{ amount: number }>;
}

export type SpinResultType = "MEGA_REWARD" | "COINS";

export interface SpinAttempt {
  _id: string;
  campaignId: string;
  userId?: string;
  userType?: "Customer" | "Seller" | "DeliveryPartner";
  resultType: SpinResultType;
  coinsWon?: number;
  megaRewardName?: string;
  megaRewardImageUrl?: string;
  blockIndex: number;
  spinNumberInBlock: number;
  createdAt: string;
  updatedAt: string;
  nextEligibleAt?: string;
}

export async function getSellerSpinWheelCampaign(): Promise<{
  success: boolean;
  message?: string;
  data: { campaign: SpinCampaign | null; mySpin: SpinAttempt | null; nextEligibleAt?: string | null };
}> {
  const res = await api.get("/seller/spin-wheel/campaign");
  return res.data;
}

export async function sellerSpinNow(): Promise<{ success: boolean; message?: string; data?: SpinAttempt }> {
  const res = await api.post("/seller/spin-wheel/spin");
  return res.data;
}

