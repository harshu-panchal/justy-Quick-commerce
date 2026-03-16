import api from './config';

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  dateOfBirth?: string;
  registrationDate: string;
  status: string;
  refCode: string;
  walletAmount: number;
  totalOrders: number;
  totalSpent: number;
  referredBy?: string;
  isReferralApplied?: boolean;
  referralCount?: number;
  referralEarnings?: number;
}

export interface GetProfileResponse {
  success: boolean;
  message: string;
  data: CustomerProfile;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  dateOfBirth?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: CustomerProfile;
}

/**
 * Get customer profile
 */
export const getProfile = async (): Promise<GetProfileResponse> => {
  const response = await api.get<GetProfileResponse>('/customer/profile');
  return response.data;
};

/**
 * Update customer profile
 */
export const updateProfile = async (data: UpdateProfileData): Promise<UpdateProfileResponse> => {
  const response = await api.put<UpdateProfileResponse>('/customer/profile', data);
  return response.data;
};

/**
 * Apply a referral code
 */
export const applyReferralCode = async (referralCode: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.post('/customer/referral/apply', { referralCode });
  return response.data;
};

/**
 * Get referral statistics
 */
export const getReferralStats = async (): Promise<{ 
  success: boolean; 
  data: { 
    referralCode: string; 
    isReferralApplied: boolean;
    appliedCode: string | null;
    referralCount: number; 
    referralEarnings: number;
    referredUsers: Array<{ name: string; date: string; isCompleted: boolean }> 
  } 
}> => {
  const response = await api.get('/customer/referral/stats');
  return response.data;
};

