import api from '../config';

export interface Executive {
  _id: string;
  name: string;
  mobile?: string;
  email?: string;
  isActive: boolean;
  sellerCount?: number;
  kycDocuments?: {
    aadhaar?: string;
    pan?: string;
    resume?: string;
    bankPassbook?: string;
  };
  kycStatus: 'Pending' | 'Submitted' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  status: 'Pending' | 'Active' | 'Suspended';
  createdAt: string;
  updatedAt: string;
}

export interface ExecutiveResponse {
  success: boolean;
  message: string;
  data: Executive[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SingleExecutiveResponse {
  success: boolean;
  message: string;
  data: Executive;
}

export const getExecutives = async (params?: any) => {
  const response = await api.get<ExecutiveResponse>('/admin/executives', { params });
  return response.data;
};

export const getPublicExecutives = async () => {
  const response = await api.get<{ success: boolean, data: { _id: string, name: string }[] }>('/public/executives');
  return response.data;
};

export const getExecutiveById = async (id: string) => {
  const response = await api.get<SingleExecutiveResponse>(`/admin/executives/${id}`);
  return response.data;
};

export const createExecutive = async (data: Partial<Executive>) => {
  const response = await api.post<SingleExecutiveResponse>('/admin/executives', data);
  return response.data;
};

export const updateExecutive = async (id: string, data: Partial<Executive>) => {
  const response = await api.put<SingleExecutiveResponse>(`/admin/executives/${id}`, data);
  return response.data;
};

export const deleteExecutive = async (id: string) => {
  const response = await api.delete<{ success: boolean; message: string }>(`/admin/executives/${id}`);
  return response.data;
};
