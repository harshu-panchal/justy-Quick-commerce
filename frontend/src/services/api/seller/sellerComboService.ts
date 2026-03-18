import api from '../config';

export interface ComboOffer {
  _id?: string;
  name: string;
  description?: string;
  mainProduct: any;
  comboProducts: any[];
  comboPrice: number;
  originalPrice: number;
  image?: string;
  sellerId?: any;
  createdBy?: any;
  creatorType?: 'admin' | 'seller';
  isApproved?: boolean;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Get seller's own combo offers
export const getMyComboOffers = async () => {
  try {
    const response = await api.get('/seller/combo-offers');
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to fetch combo offers' };
  }
};

// Create a new combo offer for seller
export const createSellerCombo = async (data: Partial<ComboOffer>) => {
  try {
    const response = await api.post('/seller/combo-offers', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to create combo offer' };
  }
};

// Delete seller's own combo offer
export const deleteMyComboOffer = async (id: string) => {
  try {
    const response = await api.delete(`/seller/combo-offers/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to delete combo offer' };
  }
};
