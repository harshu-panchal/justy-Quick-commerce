import api from "./config";

export type VendorForCall = {
  _id: string;
  sellerName?: string;
  storeName?: string;
  mobile?: string;
};

export async function getVendorsForCall(): Promise<{ success: boolean; data: VendorForCall[] }> {
  const response = await api.get("/seller/calls/vendors");
  return response.data;
}

export async function getAgoraToken(channel: string): Promise<{
  success: boolean;
  data?: { token: string; channel: string; uid: string; expiresAt: number };
  message?: string;
}> {
  const response = await api.post("/seller/calls/agora-token", { channel });
  return response.data;
}

