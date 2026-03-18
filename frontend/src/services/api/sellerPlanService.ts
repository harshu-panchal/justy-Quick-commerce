import api from "./config";

export type BillingPeriod = "daily" | "weekly" | "monthly" | "yearly";

export interface SellerPlan {
  _id: string;
  planType: "Seller";
  name: string;
  points?: string[];
  amount: number;
  currency: "INR";
  period: BillingPeriod;
  isActive: boolean;
  razorpayPlanId: string;
}

export interface SellerSubscription {
  _id: string;
  sellerId: string;
  planId: SellerPlan | string;
  razorpayPlanId: string;
  razorpaySubscriptionId: string;
  razorpayPaymentId?: string;
  status: string;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getSellerPlans(): Promise<{ success: boolean; data: SellerPlan[]; message?: string }> {
  const res = await api.get("/seller/plans");
  return res.data;
}

export async function getMyActiveSellerSubscription(): Promise<{
  success: boolean;
  data: SellerSubscription | null;
  message?: string;
}> {
  const res = await api.get("/seller/plans/my-subscription");
  return res.data;
}

export async function createSellerSubscription(planId: string): Promise<{
  success: boolean;
  data?: { subscriptionId: string; shortUrl?: string };
  message?: string;
}> {
  const res = await api.post("/seller/plans/subscribe", { planId });
  return res.data;
}

export async function verifySellerSubscription(payload: {
  razorpaySubscriptionId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<{ success: boolean; message?: string; data?: any }> {
  const res = await api.post("/seller/plans/verify", payload);
  return res.data;
}

