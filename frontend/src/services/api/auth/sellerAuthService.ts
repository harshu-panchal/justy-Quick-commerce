import api, { setAuthToken, removeAuthToken } from '../config';

export interface SendOTPResponse {
  success: boolean;
  message: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      sellerName: string;
      mobile: string;
      email: string;
      storeName: string;
      status: string;
      logo?: string;
      address?: string;
      city?: string;
    };
  };
}

export interface RegisterData {
  sellerName: string;
  mobile: string;
  alternateMobile?: string;
  email: string;
  storeName: string;
  nearestLandmark?: string;
  category?: string; // primary category (optional if categories array provided)
  categories: string[]; // multiple categories
  address: string;
  city: string;
  state?: string;
  pincode: string;
  serviceableArea?: string;
  searchLocation?: string;
  latitude?: string;
  longitude?: string;
  serviceRadiusKm?: string | number;
  serviceAreaGeo?: {
    type: string;
    coordinates: number[][][];
  } | null;
  fssaiLicNo?: string;
  storeDescription?: string;
  gstNumber?: string;
  accountNumber?: string;
  ifsc?: string;
  upiId?: string;
  panCard?: string;
  isDeliveryByPlatform?: boolean;
  cancelledChequeUrl?: string;
  shopEstablishmentUrl?: string;
  drivingLicenseUrl?: string;
  businessLicenseUrl?: string;
  businessLicenseType?: string;
  gstCertificateUrl?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      sellerName: string;
      mobile: string;
      email: string;
      storeName: string;
      status: string;
      categories?: string[];
    };
  };
}

/**
 * Send OTP to seller mobile number
 */
export const sendOTP = async (mobile: string): Promise<SendOTPResponse> => {
  const response = await api.post<SendOTPResponse>('/auth/seller/send-otp', { mobile });
  return response.data;
};

/**
 * Verify OTP and login seller
 */
export const verifyOTP = async (mobile: string, otp: string): Promise<VerifyOTPResponse> => {
  const response = await api.post<VerifyOTPResponse>('/auth/seller/verify-otp', { mobile, otp });
  return response.data;
};

/**
 * Send OTP to seller email
 */
export const sendEmailOTP = async (email: string): Promise<SendOTPResponse> => {
  const response = await api.post<SendOTPResponse>('/auth/seller/send-email-otp', { email });
  return response.data;
};

/**
 * Verify Email OTP
 */
export const verifyEmailOTP = async (email: string, otp: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.post<{ success: boolean; message: string }>('/auth/seller/verify-email-otp', { email, otp });
  return response.data;
};

/**
 * Register new seller
 */
export const register = async (data: RegisterData): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>('/auth/seller/register', data);
  return response.data;
};

/**
 * Get current seller profile
 */
export const getSellerProfile = async (): Promise<any> => {
  const response = await api.get('/auth/seller/profile');
  return response.data;
};

/**
 * Update seller profile
 */
export const updateSellerProfile = async (data: any): Promise<any> => {
  const response = await api.put('/auth/seller/profile', data);
  return response.data;
};

/**
 * Logout seller
 */
export const logout = (): void => {
  removeAuthToken();
};

/**
 * Toggle shop status (Open/Close)
 */
export const toggleShopStatus = async (): Promise<any> => {
  const response = await api.put('/auth/seller/toggle-shop-status');
  return response.data;
};


