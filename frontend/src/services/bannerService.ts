import { Banner, CreateBannerInput, UpdateBannerInput } from "../components/banners/banner.types";

const STORAGE_KEY = "justy_banners";

const defaultBanners: Banner[] = [
    {
        id: "1",
        title: "Fresh Bakery Offers",
        image: "https://img.freepik.com/premium-photo/bakery-shop-with-bread-pastries-shelves-freshly-baked-items_1020697-72061.jpg",
        mode: "quick",
        categoryId: "bakery",
        redirectType: "category",
        redirectId: "bakery",
        priority: 1,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "2",
        title: "Weekend Mega Sale - Fashion",
        image: "https://img.freepik.com/free-photo/fashion-clothes-display_23-2148892601.jpg",
        mode: "scheduled",
        categoryId: "fashion",
        redirectType: "category",
        redirectId: "fashion",
        priority: 1,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "3",
        title: "Electronics Dhamaka",
        image: "https://img.freepik.com/free-photo/view-electronic-devices-collection_23-2148908126.jpg",
        mode: "scheduled",
        categoryId: "electronics",
        redirectType: "category",
        redirectId: "electronics",
        priority: 2,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "4",
        title: "Organic Vegetables",
        image: "https://img.freepik.com/free-photo/selection-healthy-food_23-2148281137.jpg",
        mode: "quick",
        categoryId: "vegetables",
        redirectType: "category",
        redirectId: "vegetables",
        priority: 2,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];

const getStoredBanners = (): Banner[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultBanners));
        return defaultBanners;
    }
    return JSON.parse(stored);
};

const saveBanners = (banners: Banner[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(banners));
};

export const bannerService = {
    getBanners: async (): Promise<Banner[]> => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        return getStoredBanners();
    },

    getBannersByMode: async (mode: "quick" | "scheduled"): Promise<Banner[]> => {
        const banners = await bannerService.getBanners();
        return banners
            .filter((b) => b.mode === mode && b.active)
            .sort((a, b) => a.priority - b.priority);
    },

    createBanner: async (input: CreateBannerInput): Promise<Banner> => {
        const banners = getStoredBanners();
        const newBanner: Banner = {
            ...input,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        saveBanners([...banners, newBanner]);
        return newBanner;
    },

    updateBanner: async (input: UpdateBannerInput): Promise<Banner> => {
        const banners = getStoredBanners();
        const index = banners.findIndex((b) => b.id === input.id);
        if (index === -1) throw new Error("Banner not found");

        const updatedBanner = {
            ...banners[index],
            ...input,
            updatedAt: new Date().toISOString(),
        } as Banner;

        banners[index] = updatedBanner;
        saveBanners([...banners]);
        return updatedBanner;
    },

    deleteBanner: async (id: string): Promise<void> => {
        const banners = getStoredBanners();
        const filtered = banners.filter((b) => b.id !== id);
        saveBanners(filtered);
    },

    toggleBannerStatus: async (id: string): Promise<Banner> => {
        const banners = getStoredBanners();
        const index = banners.findIndex((b) => b.id === id);
        if (index === -1) throw new Error("Banner not found");

        banners[index].active = !banners[index].active;
        banners[index].updatedAt = new Date().toISOString();
        saveBanners([...banners]);
        return banners[index];
    },
};
