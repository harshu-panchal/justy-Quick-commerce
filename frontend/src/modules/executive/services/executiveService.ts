import api from '../../../services/api/config';

const API_URL = '/auth/executive';

// ==================== Auth Services ====================

export const sendOTP = async (mobile: string) => {
    const response = await api.post(`${API_URL}/send-otp`, { mobile });
    return response.data;
};

export const verifyOTP = async (mobile: string, otp: string) => {
    const response = await api.post(`${API_URL}/verify-otp`, { mobile, otp });
    return response.data;
};

export const register = async (data: any) => {
    const response = await api.post(`${API_URL}/register`, data);
    return response.data;
};

// ==================== Profile Services ====================

export const updateKYC = async (kycData: any) => {
    const response = await api.patch(`${API_URL}/profile/kyc`, kycData);
    return response.data;
};

export const updateProfile = async (profileData: any) => {
    const response = await api.patch(`${API_URL}/profile`, profileData);
    return response.data;
};

// ==================== Dashboard & Stats ====================

export const getDashboardStats = async () => {
    const response = await api.get(`${API_URL}/dashboard/stats`);
    return response.data;
};

// ==================== Seller Services ====================

export const getOnboardedSellers = async () => {
    const response = await api.get(`${API_URL}/sellers`);
    return response.data;
};

// ==================== Wallet Services ====================

export const getWalletTransactions = async () => {
    const response = await api.get(`${API_URL}/wallet/transactions`);
    return response.data;
};

export const requestWithdrawal = async (amount: number) => {
    const response = await api.post(`${API_URL}/wallet/withdraw`, { amount });
    return response.data;
};
