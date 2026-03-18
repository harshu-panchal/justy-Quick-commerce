import api from "./config";

export type BillingPeriod = "daily" | "weekly" | "monthly" | "yearly";

export interface DeliveryPlan {
  _id: string;
  planType: "DeliveryPartner";
  name: string;
  points?: string[];
  amount: number;
  currency: "INR";
  period: BillingPeriod;
  isActive: boolean;
  razorpayPlanId: string;
}

export interface DeliverySubscription {
  _id: string;
  deliveryId: string;
  planId: DeliveryPlan | string;
  razorpayPlanId: string;
  razorpaySubscriptionId: string;
  status: string;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getDeliveryPlans(): Promise<{ success: boolean; data: DeliveryPlan[]; message?: string }> {
  const res = await api.get("/delivery/plans");
  return res.data;
}

export async function getMyActiveDeliverySubscription(): Promise<{
  success: boolean;
  data: DeliverySubscription | null;
  message?: string;
}> {
  const res = await api.get("/delivery/plans/my-subscription");
  return res.data;
}

export async function createDeliverySubscription(planId: string): Promise<{
  success: boolean;
  data?: { subscriptionId: string; shortUrl?: string };
  message?: string;
}> {
  const res = await api.post("/delivery/plans/subscribe", { planId });
  return res.data;
}

