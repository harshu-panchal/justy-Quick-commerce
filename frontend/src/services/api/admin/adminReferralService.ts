import api from "../config";

export interface ReferralSettings {
  enabled: boolean;
  rewardAmount: number;
  rewardType: "Wallet" | "Points";
  minOrderValue: number;
  maxReferralsPerUser: number;
}

export interface AdminReferralStats {
  topReferrers: Array<{
    _id: string;
    name: string;
    phone: string;
    refCode: string;
    referralCount: number;
    referralEarnings: number;
  }>;
  totalReferrals: number;
  totalCoinsAwarded: number;
  totalReferrers: number;
  totalReferred: number;
}

export async function getReferralSettings(): Promise<{ success: boolean; data: ReferralSettings }> {
  const res = await api.get("/admin/settings/referral");
  return res.data;
}

export async function updateReferralSettings(payload: ReferralSettings): Promise<{ success: boolean; message?: string; data: ReferralSettings }> {
  const res = await api.put("/admin/settings/referral", payload);
  return res.data;
}

export async function getAdminReferralStats(): Promise<{ success: boolean; data: AdminReferralStats }> {
  const res = await api.get("/admin/referral/stats");
  return res.data;
}
