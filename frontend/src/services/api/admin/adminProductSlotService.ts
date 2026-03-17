import api from "../config";
import { ApiResponse } from "./types";

export interface ProductSlotConfig {
  isEnabled: boolean;
  maxFreeProducts: number;
  chargePerSlot: number;
}

export interface SlotEarning {
  _id: string;
  sellerId: {
    _id: string;
    sellerName: string;
    email: string;
    mobile: string;
    storeName: string;
  };
  slotsPurchased: number;
  amountPaid: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: 'pending' | 'paid' | 'failed';
  createdAt: string;
}

export interface SlotEarningsResponse {
  success: boolean;
  data: SlotEarning[];
  summary: {
    total: number;
    slots: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Get product slot configuration
 */
export const getProductSlotConfig = async (): Promise<ApiResponse<ProductSlotConfig>> => {
  const response = await api.get<ApiResponse<ProductSlotConfig>>("/admin/product-slot-config");
  return response.data;
};

/**
 * Update product slot configuration
 */
export const updateProductSlotConfig = async (data: Partial<ProductSlotConfig>): Promise<ApiResponse<ProductSlotConfig>> => {
  const response = await api.put<ApiResponse<ProductSlotConfig>>("/admin/product-slot-config", data);
  return response.data;
};

/**
 * Get all product slot purchase earnings
 */
export const getSlotEarnings = async (params?: { page?: number; limit?: number; sellerId?: string }): Promise<SlotEarningsResponse> => {
  const response = await api.get<SlotEarningsResponse>("/admin/product-slot-earnings", { params });
  return response.data;
};
