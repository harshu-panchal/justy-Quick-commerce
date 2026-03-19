import api from "./config";

export interface ReferralStats {
  referralCode: string;
  isReferralApplied: boolean;
  appliedCode: string | null;
  referralCount: number;
  referralEarnings: number;
  referredUsers: Array<{
    name: string;
    date: string;
    isCompleted: boolean;
  }>;
}

export async function getMyReferralStats(): Promise<{ success: boolean; data: ReferralStats }> {
  const res = await api.get("/customer/referral/stats");
  return res.data;
}

export async function applyReferralCode(referralCode: string): Promise<{ success: boolean; message: string }> {
  const res = await api.post("/customer/referral/apply", { referralCode });
  return res.data;
}
