import api from "./config";

export interface QuickDeliveryResponse {
    success: boolean;
    available: boolean;
    isGlobal?: boolean;
    message?: string;
    data?: {
        products: any[];
        sellers: any[];
    }
}

/**
 * Get quick delivery products for a specific pincode
 */
export const getQuickDeliveryProducts = async (pincode?: string): Promise<QuickDeliveryResponse> => {
    const response = await api.get<QuickDeliveryResponse>("/customer/quick-delivery", {
        params: { pincode }
    });
    return response.data;
};

/**
 * Record demand for a pincode (Coming Soon notification)
 */
export const recordPincodeDemand = async (pincode: string, headerCategoryId?: string, productId?: string): Promise<{ success: boolean }> => {
    const response = await api.post("/customer/quick-delivery", {
        pincode,
        headerCategoryId,
        productId
    });
    return response.data;
};
