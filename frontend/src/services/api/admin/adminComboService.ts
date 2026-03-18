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
  isApproved: boolean;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Get all combo offers (Admin/Seller)
export const getAllComboOffers = async () => {
  try {
    const response = await api.get('/admin/combo-offers');
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to fetch combo offers' };
  }
};

// Create a new combo offer
export const createComboOffer = async (data: Partial<ComboOffer>) => {
  try {
    const response = await api.post('/admin/combo-offers', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to create combo offer' };
  }
};

// Update an existing combo offer
export const updateComboOffer = async (id: string, data: Partial<ComboOffer>) => {
  try {
    const response = await api.put(`/admin/combo-offers/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to update combo offer' };
  }
};

// Delete a combo offer
export const deleteComboOffer = async (id: string) => {
  try {
    const response = await api.delete(`/admin/combo-offers/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to delete combo offer' };
  }
};

// Get all pending seller combo offers
export const getPendingSellerCombos = async () => {
  try {
    const response = await api.get('/admin/combo-offers/pending');
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to fetch pending combo offers' };
  }
};

// Approve a seller combo offer
export const approveSellerCombo = async (id: string) => {
  try {
    const response = await api.post(`/admin/combo-offers/${id}/approve`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to approve combo offer' };
  }
};

// Reject a seller combo offer
export const rejectSellerCombo = async (id: string) => {
  try {
    const response = await api.post(`/admin/combo-offers/${id}/reject`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to reject combo offer' };
  }
};
