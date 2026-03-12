import { useState, useEffect } from "react";
import { Banner, BannerMode } from "./banner.types";
import { bannerService } from "../../services/bannerService";

export const useBanners = (mode: BannerMode) => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const data = await bannerService.getBannersByMode(mode);
            setBanners(data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch banners:", err);
            setError("Failed to load banners");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();

        // Listen for storage changes to sync across tabs/admin
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "justy_banners") {
                fetchBanners();
            }
        };

        window.addEventListener("storage", handleStorageChange);

        // Add a custom event listener for same-window updates
        window.addEventListener("bannersUpdated", fetchBanners);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("bannersUpdated", fetchBanners);
        };
    }, [mode]);

    return { banners, loading, error, refetch: fetchBanners };
};
