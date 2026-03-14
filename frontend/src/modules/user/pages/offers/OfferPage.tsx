import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Banner } from "../../../../components/banners/banner.types";
import ProductCard from "../../components/ProductCard";
import { getProducts } from "../../../../services/api/customerProductService";
import { useLocation as useLocationContext } from "../../../../hooks/useLocation";
import { useDeliveryMode } from "../../../../hooks/useDeliveryMode";
import { motion } from "framer-motion";

export default function OfferPage() {
    const { type, id } = useParams<{ type: string; id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { location: userLocation } = useLocationContext();
    const { deliveryMode } = useDeliveryMode();

    const [banner, setBanner] = useState<Banner | null>(location.state?.banner || null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch products based on offer type and ID
    useEffect(() => {
        const fetchOfferProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const params: any = {};

                // Location for radius filtering
                if (userLocation?.latitude && userLocation?.longitude) {
                    params.latitude = userLocation.latitude;
                    params.longitude = userLocation.longitude;
                }

                let finalProducts: any[] = [];

                if (type === "category") {
                    params.category = id;
                    const response = await getProducts(params);
                    if (response.success) {
                        finalProducts = response.data;
                    }
                } else if (type === "product") {
                    const response = await getProducts({ search: id });
                    if (response.success) {
                        finalProducts = response.data.filter(p => p._id === id || (p as any).id === id);
                    }
                } else if (type === "combo") {
                    // Look up combo members in localStorage
                    const combos = JSON.parse(localStorage.getItem('comboOffers') || '[]');
                    const foundCombo = combos.find((c: any) => c.id === id || c.productId === id);

                    if (foundCombo) {
                        const productIds = [foundCombo.productId, ...(foundCombo.comboProducts || [])];
                        const results = await Promise.all(
                            productIds.map(pid => getProducts({ search: pid }).then(res =>
                                res.data.find(p => p._id === pid || (p as any).id === pid)
                            ))
                        );
                        finalProducts = results.filter(Boolean);
                    }
                }

                // Strictly filter by delivery mode (Quick/Scheduled)
                const bannerMode = banner?.type || deliveryMode;
                const filteredByMode = finalProducts.filter(p => {
                    const name = (p.productName || p.name || '').toLowerCase();
                    const catName = (p.category?.name || '').toLowerCase();
                    const scheduledKeywords = ['fashion', 'electronics', 'beauty', 'makeup', 'cosmetic', 'sports', 'lux', 'home-decor', 'furniture'];
                    const isScheduledProduct = scheduledKeywords.some(word =>
                        name.includes(word) || catName.includes(word)
                    );

                    const productDeliveryType = isScheduledProduct ? 'scheduled' : 'quick';
                    return productDeliveryType === bannerMode;
                });

                if (finalProducts.length > 0) {
                    setProducts(filteredByMode);
                } else {
                    setError("No products found strictly related to this offer.");
                }
            } catch (err) {
                console.error("Error fetching offer products:", err);
                setError("Something went wrong while loading products.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchOfferProducts();
        }
    }, [type, id, userLocation, banner?.type, deliveryMode]);

    // If banner is missing (e.g., refresh), we could fetch it, 
    // but for now let's just use defaults or placeholders if state is empty.
    const displayBanner = useMemo(() => {
        if (banner) return banner;
        // In a real app, you'd fetch banner by ID here if missing from state
        return null;
    }, [banner]);

    return (
        <div className="min-h-screen bg-neutral-50 pb-20 md:pb-10">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-200">
                <div className="px-4 md:px-6 lg:px-8 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
                    >
                        <svg className="w-6 h-6 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-neutral-900 truncate max-w-[250px] md:max-w-md">
                            {displayBanner?.title || "Special Offer"}
                        </h1>
                        {products.length > 0 && (
                            <p className="text-xs text-neutral-500 font-medium">
                                {products.length} Products Found
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Banner Section */}
            {displayBanner && (
                <div className="px-4 md:px-6 lg:px-8 mt-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative w-full h-[180px] md:h-[300px] overflow-hidden rounded-2xl md:rounded-3xl shadow-xl"
                    >
                        <img
                            src={displayBanner.imageUrl}
                            alt={displayBanner.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6 md:p-10">
                            <h2 className="text-2xl md:text-4xl font-black text-white drop-shadow-lg tracking-tight">
                                {displayBanner.title}
                            </h2>
                            <p className="text-white/90 text-sm md:text-lg font-medium drop-shadow-md">
                                Exclusive Deals Just for You
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Product Grid */}
            <div className="px-4 md:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="aspect-[3/4] bg-neutral-200 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 mb-2">Oops! Couldn't load products</h3>
                        <p className="text-neutral-500 mb-6">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {products.map((p) => (
                            <ProductCard
                                key={p.id || p._id}
                                product={p}
                                categoryStyle={true}
                                showBadge={true}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-4 text-neutral-400">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 mb-2">No products available</h3>
                        <p className="text-neutral-500">We couldn't find any products matching this offer right now. Check back soon!</p>
                        <button
                            onClick={() => navigate('/')}
                            className="mt-6 px-6 py-2 border-2 border-green-600 text-green-600 rounded-full font-bold hover:bg-green-50 transition-colors"
                        >
                            Browse Other Deals
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
