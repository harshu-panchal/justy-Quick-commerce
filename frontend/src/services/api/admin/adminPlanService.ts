import api from "../config";
import { ApiResponse } from "./types";

export type BillingPeriod = "daily" | "weekly" | "monthly" | "yearly";
export type PlanType = "Customer" | "Seller" | "DeliveryPartner";

export interface Plan {
  _id: string;
  planType: PlanType;
  name: string;
  points?: string[];
  amount: number;
  currency: "INR";
  period: BillingPeriod;
  isActive: boolean;
  razorpayPlanId: string;
  previousRazorpayPlanIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePlanPayload {
  planType: PlanType;
  name: string;
  points?: string[];
  amount: number;
  period: BillingPeriod;
  isActive?: boolean;
}

export interface UpdatePlanPayload extends Partial<CreatePlanPayload> {}

export const getPlans = async (): Promise<ApiResponse<Plan[]>> => {
  const response = await api.get<ApiResponse<Plan[]>>("/admin/plans");
  return response.data;
};

export const createPlan = async (payload: CreatePlanPayload): Promise<ApiResponse<Plan>> => {
  const response = await api.post<ApiResponse<Plan>>("/admin/plans", payload);
  return response.data;
};

export const updatePlan = async (id: string, payload: UpdatePlanPayload): Promise<ApiResponse<Plan>> => {
  const response = await api.put<ApiResponse<Plan>>(`/admin/plans/${id}`, payload);
  return response.data;
};

export const deletePlan = async (id: string): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/admin/plans/${id}`);
  return response.data;
};

