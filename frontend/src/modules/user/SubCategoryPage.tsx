import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ProductCard from "./components/ProductCard";
import { getProductsBySubcategory } from "../../services/api/customerProductService";
import { useLocation as useLocationContext } from "../../hooks/useLocation";
import { motion } from "framer-motion";

export default function SubCategoryPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { pincode: userPincode } = useLocationContext();

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [subcategoryName, setSubcategoryName] = useState("");
    const [parentName, setParentName] = useState("");
    const [deliveryMode, setDeliveryMode] = useState<"Quick" | "Scheduled" | "">("");

    useEffect(() => {
        const fetchData = async () => {
            if (!slug) return;
            setLoading(true);
            setError(null);
            try {
                const response = await getProductsBySubcategory(slug, userPincode || undefined);
                if (response.success) {
                    setProducts(response.data);
                    setSubcategoryName(response.subcategoryName || "");
                    setParentName(response.parentName || "");
                    setDeliveryMode(response.deliveryMode || "");
                } else {
                    setError(response.message || "Failed to load products.");
                }
            } catch (err: any) {
                console.error("Error fetching subcategory products:", err);
                setError("Network error. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug, userPincode]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-neutral-100 rounded-full transition-colors transition-transform active:scale-95"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">
                                {subcategoryName || slug?.replace(/-/g, " ")}
                            </h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                {parentName && (
                                    <span className="text-[10px] md:text-xs text-neutral-500 uppercase font-bold tracking-widest bg-neutral-100 px-2 py-0.5 rounded">
                                        {parentName}
                                    </span>
                                )}
                                {deliveryMode && (
                                    <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded ${deliveryMode === "Quick"
                                            ? "bg-amber-50 text-amber-600"
                                            : "bg-blue-50 text-blue-600"
                                        }`}>
                                        {deliveryMode === "Quick" ? "⚡ Quick" : "📅 Scheduled"}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-10 rounded-3xl shadow-sm text-center max-w-lg mx-auto"
                    >
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 mb-2">Failed to Load Products</h3>
                        <p className="text-neutral-500 mb-6">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                        >
                            Try Again
                        </button>
                    </motion.div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5">
                        {products.map((product, idx) => (
                            <motion.div
                                key={product.id || idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <ProductCard product={product} categoryStyle={true} />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-16 rounded-[2.5rem] shadow-sm text-center max-w-2xl mx-auto border border-neutral-100"
                    >
                        <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-5xl">🥡</span>
                        </div>
                        <h3 className="text-2xl font-black text-neutral-900 mb-3 tracking-tight">No products found</h3>
                        <p className="text-neutral-500 max-w-sm mx-auto leading-relaxed mb-8">
                            {deliveryMode === "Quick"
                                ? `Unfortunately, no sellers are currently providing quick delivery for "${subcategoryName || slug?.replace(/-/g, " ")}" in your area (${userPincode || "unknown"}).`
                                : `We currenty don't have any products listed under "${subcategoryName || slug?.replace(/-/g, " ")}". Please check back later!`}
                        </p>
                        <button
                            onClick={() => navigate("/categories")}
                            className="px-10 py-4 bg-neutral-900 text-white rounded-2xl font-black hover:bg-neutral-800 transition-all uppercase tracking-widest text-xs"
                        >
                            Browse other categories
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
