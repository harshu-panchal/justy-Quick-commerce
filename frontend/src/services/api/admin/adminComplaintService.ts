import api from "../config";

export interface IComplaint {
  _id: string;
  customer?: { _id: string; name: string; email: string; mobile?: string };
  seller?: { _id: string; name: string; shopName?: string; email: string; mobile?: string };
  order?: { _id: string; orderNumber?: string; totalPrice?: number; status?: string };
  raisedByType: "Customer" | "Seller";
  category: string;
  subject: string;
  message: string;
  images?: string[];
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High" | "Urgent";
  response?: string;
  respondedBy?: { _id: string; name: string; email: string };
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  fromCustomers: number;
  fromSellers: number;
}

export interface ComplaintsResponse {
  complaints: IComplaint[];
  pagination: { total: number; page: number; pages: number; limit: number };
}

export const getComplaintStats = async (): Promise<ComplaintStats> => {
  const res = await api.get("/admin/complaints/stats");
  return res.data.data;
};

export const getAllComplaints = async (params?: {
  status?: string;
  raisedByType?: string;
  priority?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ComplaintsResponse> => {
  const res = await api.get("/admin/complaints", { params });
  return res.data.data;
};

export const getComplaintById = async (id: string): Promise<IComplaint> => {
  const res = await api.get(`/admin/complaints/${id}`);
  return res.data.data;
};

export const respondToComplaint = async (
  id: string,
  data: { status?: string; response?: string }
): Promise<IComplaint> => {
  const res = await api.patch(`/admin/complaints/${id}/respond`, data);
  return res.data.data;
};
