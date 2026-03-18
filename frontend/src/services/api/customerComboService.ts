import api from './config';
import { ComboOffer } from './admin/adminComboService'; // We can reuse the interface from the admin service

export interface ComboOfferResponse {
    success: boolean;
    data: ComboOffer[];
    message?: string;
}

export interface SingleComboOfferResponse {
    success: boolean;
    data: ComboOffer;
    message?: string;
}

/**
 * Get active combo offers. Can optionally filter by the main product.
 * @param productId Optional ID of the main product to filter by
 */
export const getActiveComboOffers = async (productId?: string): Promise<ComboOfferResponse> => {
    const params: Record<string, string> = {};
    if (productId) {
        params.productId = productId;
    }
    const response = await api.get<ComboOfferResponse>('/customer/combo-offers', { params });
    return response.data;
};

/**
 * Get details for a specific combo offer
 * @param comboId The combo offer ID
 */
export const getComboOfferDetails = async (comboId: string): Promise<SingleComboOfferResponse> => {
    const response = await api.get<SingleComboOfferResponse>(`/customer/combo-offers/${comboId}`);
    return response.data;
};
