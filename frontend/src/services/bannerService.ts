import { Banner, CreateBannerInput, UpdateBannerInput } from "../components/banners/banner.types";
import api from "./api/config";

export const bannerService = {
    getBanners: async (): Promise<Banner[]> => {
        const response = await api.get("/admin/banners");
        return response.data.data;
    },

    getBannersByMode: async (type: "quick" | "scheduled"): Promise<Banner[]> => {
        const response = await api.get(`/banners/${type}`);
        return response.data.data;
    },

    createBanner: async (input: CreateBannerInput): Promise<Banner> => {
        const response = await api.post("/admin/banners", input);
        return response.data.data;
    },

    // The backend does not support update or toggle as requested by the minimal feature scope.
    // However, if the frontend calls deleteBanner, we can support that.
    deleteBanner: async (id: string): Promise<void> => {
        await api.delete(`/admin/banners/${id}`);
    },
};
