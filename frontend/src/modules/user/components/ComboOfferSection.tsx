import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductById } from '../../../services/api/productService';
import { useCart } from '../../../context/CartContext';

interface ComboOfferData {
    id: string;
    productId: string;
    productName: string;
    comboProducts: string[];
    comboProductNames: string[];
    comboPrice: number;
}

interface ResolvedProduct {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
}

interface ComboOfferSectionProps {
    categoryId?: string;
    categoryName?: string;
    currentProductId?: string;
}

export default function ComboOfferSection({ currentProductId }: ComboOfferSectionProps) {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [expanded, setExpanded] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [resolvedProducts, setResolvedProducts] = useState<ResolvedProduct[]>([]);
    const [loading, setLoading] = useState(false);

    // Find matching combo from localStorage
    const matchedCombo = useMemo<ComboOfferData | null>(() => {
        try {
            const combos: ComboOfferData[] = JSON.parse(
                localStorage.getItem('comboOffers') || '[]'
            );
            if (!currentProductId) return null;
            return (
                combos.find(
                    (c) => c.productId === currentProductId
                ) || null
            );
        } catch {
            return null;
        }
    }, [currentProductId]);

    // Resolve combo product details
    useEffect(() => {
        if (!matchedCombo) {
            setResolvedProducts([]);
            return;
        }

        let cancelled = false;
        (async () => {
            setLoading(true);
            const resolved: ResolvedProduct[] = [];

            for (const pid of matchedCombo.comboProducts) {
                try {
                    const res = await getProductById(pid);
                    if (!cancelled && res.success && res.data) {
                        const p = res.data;
                        const price =
                            p.variations && p.variations.length > 0
                                ? p.variations[0].discPrice || p.variations[0].price
                                : 0;
                        resolved.push({
                            id: p._id,
                            name: p.productName,
                            price,
                            imageUrl: p.mainImageUrl || p.mainImage || '',
                        });
                    }
                } catch {
                    // skip failed lookups
                }
            }

            if (!cancelled) {
                setResolvedProducts(resolved);
                setSelectedIds(new Set(resolved.map((r) => r.id)));
                setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [matchedCombo]);

    if (!matchedCombo || loading) return null;
    if (resolvedProducts.length === 0) return null;

    const mainProductPrice = (() => {
        // We don't have the main product object here, but we can compute the original total
        // as sum of all combo products + approximate main. However, the combo includes main + combo products.
        // The savings should be: (sum of all individual prices) - comboPrice.
        // Since we don't fetch the main product price here, we'll calculate savings from combo products only
        // and show the combo price as the bundle price.
        return 0;
    })();

    const comboProductsTotal = resolvedProducts.reduce((s, p) => s + p.price, 0);
    const comboPrice = matchedCombo.comboPrice;
    const savings = comboProductsTotal > comboPrice ? comboProductsTotal - comboPrice : 0;

    const toggleProduct = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleAddSelectedToCart = () => {
        const selectedProducts = resolvedProducts.filter((p) => selectedIds.has(p.id));
        for (const p of selectedProducts) {
            addToCart({
                id: p.id,
                _id: p.id,
                name: p.name,
                productName: p.name,
                price: p.price,
                imageUrl: p.imageUrl,
                pack: '1',
                categoryId: '',
            });
        }
    };

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3 px-1">
                🔥 Combo Offer
            </h3>

            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4">
                {/* Collapsed view */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full text-left"
                >
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                        {resolvedProducts.map((p, i) => (
                            <div key={p.id} className="flex items-center gap-1">
                                {i > 0 && (
                                    <span className="text-orange-400 font-bold text-lg">+</span>
                                )}
                                <div
                                    className="w-12 h-12 rounded-lg bg-white border border-orange-200 overflow-hidden flex-shrink-0 cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/product/${p.id}`, { state: { fromStore: true } });
                                    }}
                                >
                                    {p.imageUrl ? (
                                        <img
                                            src={p.imageUrl}
                                            alt={p.name}
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-orange-300 text-lg font-bold">
                                            {p.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-lg font-bold text-neutral-900">
                            Buy all: ₹{comboPrice}
                        </span>
                        {savings > 0 && (
                            <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                Save ₹{savings}
                            </span>
                        )}
                        {comboProductsTotal > comboPrice && (
                            <span className="text-sm text-neutral-500 line-through">
                                ₹{comboProductsTotal}
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
                            className={`ml-auto transition-transform text-neutral-500 ${expanded ? 'rotate-180' : ''}`}
                        >
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </div>
                </button>

                {/* Expanded view */}
                {expanded && (
                    <div className="mt-4 pt-4 border-t border-orange-200">
                        <div className="space-y-3">
                            {resolvedProducts.map((p) => (
                                <label
                                    key={p.id}
                                    className="flex items-center gap-3 bg-white rounded-lg p-3 border border-neutral-200 cursor-pointer hover:border-orange-300 transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(p.id)}
                                        onChange={() => toggleProduct(p.id)}
                                        className="accent-orange-500 w-4 h-4 flex-shrink-0"
                                    />
                                    <div
                                        className="w-14 h-14 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0 cursor-pointer"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            navigate(`/product/${p.id}`, { state: { fromStore: true } });
                                        }}
                                    >
                                        {p.imageUrl ? (
                                            <img
                                                src={p.imageUrl}
                                                alt={p.name}
                                                className="w-full h-full object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xl font-bold">
                                                {p.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-neutral-900 truncate">
                                            {p.name}
                                        </div>
                                        <div className="text-sm text-neutral-600">₹{p.price}</div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {selectedIds.size > 0 && (
                            <button
                                onClick={handleAddSelectedToCart}
                                className="w-full mt-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-sm"
                            >
                                Add {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} to cart
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
