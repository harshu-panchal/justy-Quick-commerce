import api from "./config";
import { ApiResponse } from "./productService";

export interface SellerProductStatus {
  isEnabled: boolean;
  maxFreeProducts: number;
  chargePerSlot: number;
  freeProductsAdded: number;
  paidSlotsTotal: number;
  currentProductCount: number;
  totalAllowed: number;
  isLimitReached: boolean;
}

export interface RazorpayOrderData {
  razorpayOrderId: string;
  razorpayKey: string;
  amount: number;
  currency: string;
  receipt: string;
}

/**
 * Get current seller's product limit and slot status
 */
export const getMyProductStatus = async (): Promise<ApiResponse<SellerProductStatus>> => {
  const response = await api.get<ApiResponse<SellerProductStatus>>("/products/slot-status");
  return response.data;
};

/**
 * Create a Razorpay order for purchasing extra product slots
 */
export const createSlotOrder = async (numberOfSlots: number): Promise<ApiResponse<RazorpayOrderData>> => {
  const response = await api.post<ApiResponse<RazorpayOrderData>>("/products/slot-order", { numberOfSlots });
  return response.data;
};

/**
 * Verify payment and increment seller's paid slots
 */
export const verifySlotPayment = async (data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<ApiResponse<{ slotsAdded: number }>> => {
  const response = await api.post<ApiResponse<{ slotsAdded: number }>>("/products/slot-verify", data);
  return response.data;
};
