import api from "./config";

interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

export const getCommissionReport = async (page = 1, limit = 50): Promise<ApiResponse<any>> => {
    const response = await api.get<ApiResponse<any>>("/admin/wallet/earnings", { params: { page, limit } });
    return response.data;
};
