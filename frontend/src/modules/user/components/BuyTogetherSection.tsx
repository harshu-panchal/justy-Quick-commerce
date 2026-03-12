import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import { calculateProductPrice } from '../../../utils/priceUtils';

interface BuyTogetherProduct {
    id?: string;
    _id?: string;
    name?: string;
    productName?: string;
    imageUrl?: string;
    mainImage?: string;
    price?: number;
    mrp?: number;
    pack?: string;
    category?: { id?: string; _id?: string; name?: string; slug?: string };
    categoryId?: string;
    [key: string]: any;
}

interface BuyTogetherSectionProps {
    currentProduct: BuyTogetherProduct;
    products: BuyTogetherProduct[];
}

export default function BuyTogetherSection({ currentProduct, products }: BuyTogetherSectionProps) {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [expanded, setExpanded] = useState(false);

    // Filter to same-category products, exclude current, take top 2
    const recommendedProducts = useMemo(() => {
        if (!products || products.length === 0) return [];

        const currentId = String(currentProduct.id || currentProduct._id);
        const currentCategoryName = currentProduct.category?.name?.toLowerCase();

        return products
            .filter((p) => {
                const pId = String(p.id || p._id);
                if (pId === currentId) return false;
                const pCategoryName = p.category?.name?.toLowerCase();
                return pCategoryName === currentCategoryName || !currentCategoryName;
            })
            .slice(0, 2);
    }, [products, currentProduct]);

    // All items: current product + recommended
    const allItems = useMemo(() => {
        return [currentProduct, ...recommendedProducts];
    }, [currentProduct, recommendedProducts]);

    // Track selected items by index
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
        new Set(allItems.map((_, i) => i))
    );

    // Reset selection when product changes
    useMemo(() => {
        setSelectedIndices(new Set(allItems.map((_, i) => i)));
    }, [allItems.length]);

    if (recommendedProducts.length === 0) return null;

    const toggleSelection = (index: number) => {
        setSelectedIndices((prev) => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    const getPrice = (product: BuyTogetherProduct) => {
        const { displayPrice } = calculateProductPrice(product);
        return displayPrice;
    };

    const totalPrice = allItems
        .filter((_, i) => selectedIndices.has(i))
        .reduce((sum, p) => sum + getPrice(p), 0);

    const selectedCount = selectedIndices.size;

    const getProductImage = (p: BuyTogetherProduct) => p.imageUrl || p.mainImage || '';
    const getProductName = (p: BuyTogetherProduct) => p.name || p.productName || 'Product';
    const getProductId = (p: BuyTogetherProduct) => String(p.id || p._id);

    const handleNavigate = (p: BuyTogetherProduct) => {
        navigate(`/product/${getProductId(p)}`);
    };

    const handleAddToCart = async () => {
        const selectedProducts = allItems.filter((_, i) => selectedIndices.has(i));
        for (const p of selectedProducts) {
            await addToCart(p as any);
        }
    };

    return (
        <div className="border rounded-xl p-4 mt-6 bg-white shadow-sm">
            {/* Section Title */}
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                Customers also bought
            </h3>

            {/* Collapsed View */}
            <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                {/* Product Thumbnails with + icons */}
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                    {allItems.map((item, index) => (
                        <div key={getProductId(item)} className="flex items-center gap-2 flex-shrink-0">
                            {index > 0 && (
                                <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-neutral-500 text-xs font-bold">+</span>
                                </div>
                            )}
                            <div
                                className="w-14 h-14 rounded-lg border border-neutral-200 overflow-hidden bg-neutral-50 flex-shrink-0 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigate(item);
                                }}
                            >
                                {getProductImage(item) ? (
                                    <img
                                        src={getProductImage(item)}
                                        alt={getProductName(item)}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-lg font-semibold">
                                        {getProductName(item).charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Price + Expand Arrow */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                        <p className="text-xs text-neutral-500">Buy all</p>
                        <p className="text-sm font-bold text-neutral-900">
                            ₹{totalPrice.toLocaleString('en-IN')}
                        </p>
                    </div>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={`text-neutral-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                    >
                        <path
                            d="M6 9l6 6 6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </div>

            {/* Expanded View */}
            {expanded && (
                <div className="mt-4 border-t border-neutral-100 pt-4">
                    <div className="grid grid-cols-3 gap-3">
                        {allItems.map((item, index) => {
                            const isSelected = selectedIndices.has(index);
                            const price = getPrice(item);
                            const { mrp, hasDiscount, discount } = calculateProductPrice(item);

                            return (
                                <div
                                    key={getProductId(item)}
                                    className={`rounded-lg border p-2 transition-all ${isSelected
                                            ? 'border-green-500 bg-green-50/50'
                                            : 'border-neutral-200 bg-white opacity-60'
                                        }`}
                                >
                                    {/* Checkbox */}
                                    <div className="flex justify-end mb-1">
                                        <button
                                            onClick={() => toggleSelection(index)}
                                            className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                                            style={{
                                                borderColor: isSelected ? '#16a34a' : '#d4d4d4',
                                                backgroundColor: isSelected ? '#16a34a' : 'transparent',
                                            }}
                                        >
                                            {isSelected && (
                                                <svg
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M5 13l4 4L19 7"
                                                        stroke="white"
                                                        strokeWidth="3"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            )}
                                        </button>
                                    </div>

                                    {/* Product Image */}
                                    <div
                                        className="w-full aspect-square rounded-md overflow-hidden bg-neutral-100 mb-2 cursor-pointer"
                                        onClick={() => handleNavigate(item)}
                                    >
                                        {getProductImage(item) ? (
                                            <img
                                                src={getProductImage(item)}
                                                alt={getProductName(item)}
                                                className="w-full h-full object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-neutral-400 text-2xl font-semibold">
                                                {getProductName(item).charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Title */}
                                    <p
                                        className="text-[11px] font-medium text-neutral-800 line-clamp-2 leading-tight mb-1 cursor-pointer hover:text-green-700 transition-colors"
                                        onClick={() => handleNavigate(item)}
                                    >
                                        {getProductName(item)}
                                    </p>

                                    {/* Price */}
                                    <div className="flex items-baseline gap-1 flex-wrap">
                                        <span className="text-xs font-bold text-neutral-900">
                                            ₹{price.toLocaleString('en-IN')}
                                        </span>
                                        {hasDiscount && (
                                            <span className="text-[10px] text-neutral-500 line-through">
                                                ₹{mrp.toLocaleString('en-IN')}
                                            </span>
                                        )}
                                    </div>
                                    {hasDiscount && discount > 0 && (
                                        <span className="text-[10px] font-semibold text-green-600">
                                            {discount}% OFF
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Total + Add to Cart */}
                    <div className="mt-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-neutral-500">
                                {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
                            </p>
                            <p className="text-base font-bold text-neutral-900">
                                Total: ₹{totalPrice.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <button
                            onClick={handleAddToCart}
                            disabled={selectedCount === 0}
                            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${selectedCount > 0
                                    ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                }`}
                        >
                            Add selected to cart
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
