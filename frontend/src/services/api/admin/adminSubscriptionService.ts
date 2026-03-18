import api from "../config";
import { ApiResponse } from "./types";

export type SubscriptionType = "Seller" | "Customer" | "DeliveryPartner";

export interface AdminSubscriptionRow {
  _id: string;
  userId: string;
  subType: SubscriptionType;
  planId: string;
  planName?: string;
  status: "active" | "cancelled" | "expired" | "pending";
  startDate?: string;
  endDate?: string;
  startsAt?: string;
  endsAt?: string;
  razorpaySubscriptionId?: string;
  razorpayPlanId?: string;
  createdAt: string;
  updatedAt: string;
}

export const getAdminSubscriptions = async (params?: {
  type?: SubscriptionType | "all";
  page?: number;
  limit?: number;
}): Promise<ApiResponse<AdminSubscriptionRow[]>> => {
  const response = await api.get<ApiResponse<AdminSubscriptionRow[]>>("/admin/subscriptions", { params });
  return response.data;
};

export interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  type: 'Customer' | 'Seller';
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  cardColor: string;
  status: boolean;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export const getSubscriptionPlans = async (params?: any): Promise<ApiResponse<SubscriptionPlan[]>> => {
  const response = await api.get<ApiResponse<SubscriptionPlan[]>>("/admin/subscription-plans", { params });
  return response.data;
};

export const createSubscriptionPlan = async (data: any): Promise<ApiResponse<SubscriptionPlan>> => {
  const response = await api.post<ApiResponse<SubscriptionPlan>>("/admin/subscription-plans", data);
  return response.data;
};

export const updateSubscriptionPlan = async (id: string, data: any): Promise<ApiResponse<SubscriptionPlan>> => {
  const response = await api.put<ApiResponse<SubscriptionPlan>>(`/admin/subscription-plans/${id}`, data);
  return response.data;
};

export const deleteSubscriptionPlan = async (id: string): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/admin/subscription-plans/${id}`);
  return response.data;
};

export const toggleSubscriptionPlanStatus = async (id: string, status: boolean): Promise<ApiResponse<SubscriptionPlan>> => {
  const response = await api.patch<ApiResponse<SubscriptionPlan>>(`/admin/subscription-plans/${id}/status`, { status });
  return response.data;
};
