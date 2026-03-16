import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import { getActiveComboOffers } from '../../../services/api/customerComboService';
import { ComboOffer } from '../../../services/api/admin/adminComboService';

interface ComboOfferSectionProps {
    categoryId?: string;
    categoryName?: string;
    currentProductId?: string;
}

export default function ComboOfferSection({ currentProductId }: ComboOfferSectionProps) {
    const navigate = useNavigate();
    const { cart, addComboToCart, updateQuantity } = useCart();
    
    // Multiple combos could potentially target the same main product, 
    // although typically there's only one. Let's just handle a list.
    const [combos, setCombos] = useState<ComboOffer[]>([]);
    const [loading, setLoading] = useState(false);
    
    // We maintain expanded state for each combo using its ID
    const [expandedSet, setExpandedSet] = useState<Set<string>>(new Set());

    // Fetch matching combo
    useEffect(() => {
        if (!currentProductId) {
            setCombos([]);
            return;
        }

        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                // Fetch combos for this specific product
                const res = await getActiveComboOffers(currentProductId);
                if (!cancelled && res.success && res.data && res.data.length > 0) {
                    setCombos(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch combo for product", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [currentProductId]);

    if (!combos || combos.length === 0 || loading) return null;

    const toggleExpanded = (comboId: string | undefined) => {
        if (!comboId) return;
        setExpandedSet((prev) => {
            const next = new Set(prev);
            if (next.has(comboId)) next.delete(comboId);
            else next.add(comboId);
            return next;
        });
    };

    const handleAddComboToCart = async (e: React.MouseEvent, comboId: string | undefined) => {
        e.stopPropagation();
        if (comboId) {
            await addComboToCart(comboId, 1);
            navigate('/checkout');
        }
    };

    const getImageUrl = (product: any) => {
        return product?.mainImage || product?.imageUrl || '';
    };

    const getProductName = (product: any) => {
        return product?.productName || product?.name || 'Product';
    };

    const getProductPrice = (product: any) => {
        if (product?.variations && product?.variations.length > 0) {
            return product.variations[0].discPrice || product.variations[0].price || 0;
        }
        return product?.price || 0;
    };

    const getComboInCartQty = (comboId: string | undefined) => {
        if (!comboId) return 0;
        const item = (cart.items || []).find(i => i.comboOffer?._id === comboId || i.comboOffer?.id === comboId);
        return item?.quantity || 0;
    };

    return (
        <div className="mt-6 mb-4 px-4 md:px-6 lg:px-8">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3 px-1">
                🔥 Hot Combos
            </h3>

            <div className="space-y-4">
                {combos.map((combo) => {
                    // Populate list of all products in this combo
                    const comboItems = [combo.mainProduct, ...combo.comboProducts].filter(Boolean);
                    const originalTotal = combo.originalPrice || comboItems.reduce((acc, p) => acc + getProductPrice(p), 0);
                    const comboPrice = combo.comboPrice;
                    const savings = originalTotal > comboPrice ? originalTotal - comboPrice : 0;
                    const isExpanded = combo._id && expandedSet.has(combo._id);
                    const inCartQty = getComboInCartQty(combo._id);

                    return (
                        <div key={combo._id} className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4">
                            {/* Collapsed/Header view */}
                            <button
                                onClick={() => toggleExpanded(combo._id)}
                                className="w-full text-left focus:outline-none"
                            >
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                    {comboItems.map((p, i) => (
                                        <div key={p._id || i} className="flex items-center gap-1">
                                            {i > 0 && (
                                                <span className="text-orange-400 font-bold text-lg">+</span>
                                            )}
                                            <div
                                                className="w-12 h-12 rounded-lg bg-white border border-orange-200 overflow-hidden flex-shrink-0 cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/product/${p._id}`, { state: { fromStore: true } });
                                                }}
                                                title={getProductName(p)}
                                            >
                                                {getImageUrl(p) ? (
                                                    <img
                                                        src={getImageUrl(p)}
                                                        alt={getProductName(p)}
                                                        className="w-full h-full object-cover"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-orange-300 text-lg font-bold">
                                                        {getProductName(p).charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mb-2 text-sm font-semibold text-neutral-800">
                                    {combo.name || "Special Deal"}
                                </div>

                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="text-lg font-bold text-neutral-900">
                                        Bundle Price: ₹{comboPrice}
                                    </span>
                                    {savings > 0 && (
                                        <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                            Save ₹{savings}
                                        </span>
                                    )}
                                    {originalTotal > comboPrice && (
                                        <span className="text-sm text-neutral-500 line-through">
                                            ₹{originalTotal}
                                        </span>
                                    )}
                                    <div className="ml-auto flex items-center gap-2">
                                        {inCartQty > 0 && (
                                            <span className="text-xs font-bold text-green-600 bg-white border border-green-600 px-2 py-0.5 rounded-full">
                                                {inCartQty} In Cart
                                            </span>
                                        )}
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className={`transition-transform text-neutral-500 ${isExpanded ? 'rotate-180' : ''}`}
                                        >
                                            <path d="M6 9l6 6 6-6" />
                                        </svg>
                                    </div>
                                </div>
                            </button>

                            {/* Expanded view */}
                            {isExpanded && (
                                <div className="mt-4 pt-4 border-t border-orange-200">
                                    <div className="space-y-3">
                                        {comboItems.map((p, i) => (
                                            <div
                                                key={p._id || i}
                                                className="flex items-center gap-3 bg-white/60 rounded-lg p-3 border border-orange-100 hover:border-orange-300 transition-colors"
                                            >
                                                <div
                                                    className="w-14 h-14 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0 cursor-pointer border border-neutral-100"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        navigate(`/product/${p._id}`, { state: { fromStore: true } });
                                                    }}
                                                >
                                                    {getImageUrl(p) ? (
                                                        <img
                                                            src={getImageUrl(p)}
                                                            alt={getProductName(p)}
                                                            className="w-full h-full object-cover"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xl font-bold">
                                                            {getProductName(p).charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-neutral-900 line-clamp-2">
                                                        {getProductName(p)}
                                                        {p._id === combo.mainProduct?._id && <span className="ml-2 text-xs text-orange-600 font-semibold">(Main Item)</span>}
                                                    </div>
                                                    <div className="text-sm text-neutral-600">₹{getProductPrice(p)}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4">
                                        {inCartQty === 0 ? (
                                            <button
                                                onClick={(e) => handleAddComboToCart(e, combo._id)}
                                                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-sm shadow-sm"
                                            >
                                                Add Bundle to Cart - ₹{comboPrice}
                                            </button>
                                        ) : (
                                            <div className="flex items-center justify-between gap-4 bg-white border-2 border-green-600 rounded-lg p-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateQuantity(combo._id!, inCartQty - 1);
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center text-green-600 font-bold hover:bg-green-50 rounded-full transition-colors border border-green-600"
                                                >
                                                    −
                                                </button>
                                                <span className="text-sm font-bold text-green-600">
                                                    {inCartQty} Bundle{inCartQty > 1 ? 's' : ''} in Cart
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateQuantity(combo._id!, inCartQty + 1);
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center text-green-600 font-bold hover:bg-green-50 rounded-full transition-colors border border-green-600"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
