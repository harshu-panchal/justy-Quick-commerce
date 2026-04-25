import axiosInstance from '../config';

export interface ExecutiveKycField {
    _id: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'time' | 'checkbox' | 'multi-input' | 'file' | 'toggle';
    options?: string[];
    section?: string;
    placeholder?: string;
    status: 'Active' | 'Inactive';
    dependsOn?: {
        fieldId: string | null;
        value: string;
    };
    isRequired: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateExecutiveKycFieldData {
    label: string;
    type: string;
    status: string;
    options?: string[];
    section?: string;
    placeholder?: string;
    dependsOn?: {
        fieldId: string | null;
        value: string;
    };
    isRequired: boolean;
}

export const getExecutiveKycFields = async () => {
    const response = await axiosInstance.get('/admin/executive-kyc-fields');
    return response.data;
};

export const createExecutiveKycField = async (data: CreateExecutiveKycFieldData) => {
    const response = await axiosInstance.post('/admin/executive-kyc-fields', data);
    return response.data;
};

export const updateExecutiveKycField = async (id: string, data: Partial<CreateExecutiveKycFieldData>) => {
    const response = await axiosInstance.put(`/admin/executive-kyc-fields/${id}`, data);
    return response.data;
};

export const deleteExecutiveKycField = async (id: string) => {
    const response = await axiosInstance.delete(`/admin/executive-kyc-fields/${id}`);
    return response.data;
};

// For executive app
export const getExecutiveKycFieldsForExecutive = async () => {
    const response = await axiosInstance.get('/executive/kyc-fields');
    return response.data;
};
