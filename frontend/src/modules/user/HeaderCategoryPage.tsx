import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import HomeHero from "./components/HomeHero";
import BannerCarousel from "../../components/banners/BannerCarousel";
import CategoryTileSection from "./components/CategoryTileSection";
import ProductCard from "./components/ProductCard";
import { getHeaderCategorySections } from "../../services/api/customerHomeService";
import { useLocation } from "../../hooks/useLocation";
import PageLoader from "../../components/PageLoader";
import { getStoredPincode } from "../../components/PincodeSelector";
import { useThemeContext } from "../../context/ThemeContext";
import { useDeliveryMode } from "../../hooks/useDeliveryMode";
import EmptyState from "../../components/EmptyState";

export default function HeaderCategoryPage() {
    const { slug } = useParams<{ slug: string }>();
    const { location } = useLocation();
    const { setActiveCategory } = useThemeContext();
    const { deliveryMode } = useDeliveryMode();
    const [loading, setLoading] = useState(true);
    const [sections, setSections] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Sync active category in context when slug changes
    useEffect(() => {
        if (slug) {
            setActiveCategory(slug);
        }
    }, [slug, setActiveCategory]);

    useEffect(() => {
        const fetchData = async () => {
            if (!slug) return;
            try {
                setLoading(true);
                setError(null);
                const pincode = getStoredPincode();
                const response = await getHeaderCategorySections(
                    slug,
                    pincode || undefined,
                    location?.latitude,
                    location?.longitude
                );
                if (response.success) {
                    setSections(response.data);
                } else {
                    setError("Failed to load content");
                }
            } catch (err) {
                console.error("Error fetching header category sections:", err);
                setError("Something went wrong");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug, location?.latitude, location?.longitude]);

    if (loading) return <PageLoader />;

    if (error) {
        return (
            <div className="bg-white min-h-screen pb-20 md:pb-0">
                <HomeHero activeTab={slug || "all"} onTabChange={setActiveCategory} />
                <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors"
                    >
                        Try Refreshing
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen pb-20 md:pb-0">
            <HomeHero activeTab={slug || "all"} onTabChange={setActiveCategory} />
            <div className="w-full relative z-10 mt-2">
                <BannerCarousel mode={deliveryMode} />
            </div>
            <div className="bg-neutral-50 min-h-screen pt-4 pb-12">
                {sections.length > 0 ? (
                    <div className="space-y-6 md:space-y-10">
                        {sections.map((section, idx) => {
                            if (section.type === "products") {
                                const data = section.data || [];
                                if (data.length === 0) return null;

                                return (
                                    <div key={idx} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <h2 className="text-lg md:text-2xl font-bold text-neutral-900 mb-4 md:mb-6 px-4 md:px-6 lg:px-8 tracking-tight">
                                            {section.title}
                                        </h2>
                                        <div className="px-4 md:px-6 lg:px-8">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
                                                {data.map((p: any) => (
                                                    <ProductCard
                                                        key={p.id}
                                                        product={p}
                                                        categoryStyle={true}
                                                        showBadge={true}
                                                        showStockInfo={false}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            if (section.type === "categories") {
                                const data = section.data || [];
                                if (data.length === 0) return null;

                                return (
                                    <div key={idx} className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
                                        <CategoryTileSection
                                            title={section.title}
                                            tiles={data}
                                            columns={4}
                                        />
                                    </div>
                                );
                            }

                            return null;
                        })}
                    </div>
                ) : (
                    <div className="flex items-center justify-center pt-0 pb-8">
                        <EmptyState 
                            title="No Products Available"
                            description="There are currently no products or sellers available for this category in your area."
                            buttonText="Go to Home"
                            onButtonClick={() => window.location.href = "/"}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
