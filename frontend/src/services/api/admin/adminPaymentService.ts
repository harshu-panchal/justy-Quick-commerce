import api from "../config";


import { ApiResponse } from "./types";

export interface PaymentMethodConfig {
  _id: string;
  name: string;
  description: string;
  status: "Active" | "InActive";
  hasApiKeys: boolean;
  apiKey?: string;
  secretKey?: string;
  type?: string;
  provider?: string;
}

export interface UpdatePaymentMethodData {
  description?: string;
  status?: "Active" | "InActive";
  apiKey?: string;
  secretKey?: string;
}

export interface OnboardingPayment {
  _id: string;
  seller: {
    _id: string;
    sellerName: string;
    storeName: string;
    categories: string[];
    email: string;
    mobile: string;
    category: string;
  };
  amount: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: string;
  paidAt?: string;
  createdAt: string;
}

export interface GetPaymentMethodsParams {
  status?: "Active" | "InActive";
}

/**
 * Get all payment methods
 */
/**
 * Get all payment methods
 */
export const getPaymentMethodConfigs = async (
  params?: GetPaymentMethodsParams
): Promise<ApiResponse<PaymentMethodConfig[]>> => {
  const response = await api.get<ApiResponse<PaymentMethodConfig[]>>(
    "/admin/payment-methods",
    { params }
  );
  return response.data;
};

/**
 * Get payment method by ID
 */
export const getPaymentMethodById = async (
  id: string
): Promise<ApiResponse<PaymentMethodConfig>> => {
  const response = await api.get<ApiResponse<PaymentMethodConfig>>(
    `/admin/payment-methods/${id}`
  );
  return response.data;
};

/**
 * Update payment method
 */
export const updatePaymentMethod = async (
  id: string,
  data: UpdatePaymentMethodData
): Promise<ApiResponse<PaymentMethodConfig>> => {
  const response = await api.put<ApiResponse<PaymentMethodConfig>>(
    `/admin/payment-methods/${id}`,
    data
  );
  return response.data;
};

/**
 * Update payment method status
 */
export const updatePaymentMethodStatus = async (
  id: string,
  status: "Active" | "InActive"
): Promise<ApiResponse<PaymentMethodConfig>> => {
  const response = await api.patch<ApiResponse<PaymentMethodConfig>>(
    `/admin/payment-methods/${id}/status`,
    { status }
  );
  return response.data;
};

/**
 * Get onboarding (security deposit) payments
 */
export const getOnboardingPayments = async (params?: any): Promise<ApiResponse<OnboardingPayment[]>> => {
  const response = await api.get<ApiResponse<OnboardingPayment[]>>(
    "/admin/onboarding-payments",
    { params }
  );
  return response.data;
};
