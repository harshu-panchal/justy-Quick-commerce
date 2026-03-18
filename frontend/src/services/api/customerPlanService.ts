import api from "./config";

export type BillingPeriod = "daily" | "weekly" | "monthly" | "yearly";

export interface CustomerPlan {
  _id: string;
  planType: "Customer";
  name: string;
  points?: string[];
  amount: number;
  currency: "INR";
  period: BillingPeriod;
  isActive: boolean;
  razorpayPlanId: string;
}

export interface CustomerSubscription {
  _id: string;
  customerId: string;
  planId: CustomerPlan | string;
  razorpayPlanId: string;
  razorpaySubscriptionId: string;
  status: string;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getCustomerPlans(): Promise<{ success: boolean; data: CustomerPlan[]; message?: string }> {
  const res = await api.get("/customer/plans");
  return res.data;
}

export async function getMyActiveCustomerSubscription(): Promise<{
  success: boolean;
  data: CustomerSubscription | null;
  message?: string;
}> {
  const res = await api.get("/customer/plans/my-subscription");
  return res.data;
}

export async function createCustomerSubscription(planId: string): Promise<{
  success: boolean;
  data?: { subscriptionId: string; shortUrl?: string };
  message?: string;
}> {
  const res = await api.post("/customer/plans/subscribe", { planId });
  return res.data;
}

