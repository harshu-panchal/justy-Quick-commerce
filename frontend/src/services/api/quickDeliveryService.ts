import api from "./config";

export interface QuickDeliveryResponse {
    success: boolean;
    available: boolean;
    message?: string;
    data?: {
        products: any[];
        sellers: any[];
    }
}

/**
 * Get quick delivery products for a specific pincode
 */
export const getQuickDeliveryProducts = async (pincode: string): Promise<QuickDeliveryResponse> => {
    const response = await api.get<QuickDeliveryResponse>("/customer/quick-delivery", {
        params: { pincode }
    });
    return response.data;
};
