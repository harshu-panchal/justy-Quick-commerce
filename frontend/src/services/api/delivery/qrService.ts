import api from '../config';
import { ApiResponse } from '../orderService';

export interface ScanResponse {
  orderId: string;
  orderNumber: string;
  customerName: string;
  address: string;
  amount: number;
  status: string;
  orderType: 'ORDER' | 'EQUIPMENT';
  nextAllowedStatus: string[];
  order?: any;
}

/**
 * Scan QR Code
 */
export const scanQrCode = async (params: { token?: string; orderId?: string; orderType?: string }): Promise<ApiResponse<ScanResponse>> => {
  const response = await api.post<ApiResponse<ScanResponse>>('/delivery/qr/scan', params);
  return response.data;
};

/**
 * Update Order Status via QR
 */
export const updateOrderQrStatus = async (
  orderId: string, 
  status: string, 
  orderType: 'ORDER' | 'EQUIPMENT',
  location?: { lat: number; lng: number }
): Promise<ApiResponse<any>> => {
  const response = await api.patch<ApiResponse<any>>(`/delivery/qr/${orderId}/status`, {
    status,
    orderType,
    location
  });
  return response.data;
};
