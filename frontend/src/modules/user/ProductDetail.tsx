import {
  useParams,
  useNavigate,
  useLocation as useRouterLocation,
} from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
// import { products } from '../../data/products'; // REMOVED
// import { categories } from '../../data/categories'; // REMOVED
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../hooks/useLocation';
import { useLoading } from '../../context/LoadingContext';
import Button from '../../components/ui/button';
import { getProductById, getProducts } from '../../services/api/customerProductService';
import WishlistButton from '../../components/WishlistButton';
import { calculateProductPrice } from '../../utils/priceUtils';
import { getCategoryType, getDeliveryInfo, getScheduledDeliveryText } from '../../config/pincodeService';
import ComboOfferSection from './components/ComboOfferSection';
import BuyTogetherSection from './components/BuyTogetherSection';
import ProductReviews from './components/ProductReviews';
import CategoryDisclaimer from './components/CategoryDisclaimer';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const { cart, addToCart, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const { location } = useLocation();
  const { startLoading, stopLoading } = useLoading();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [isProductDetailsExpanded, setIsProductDetailsExpanded] =
    useState(false);

  const [product, setProduct] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAvailableAtLocation, setIsAvailableAtLocation] =
    useState<boolean>(true);


  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      startLoading();
      try {
        // Check if navigation came from store page
        const fromStore = (routerLocation.state as any)?.fromStore === true;

        // Fetch product details with location
        const response = await getProductById(
          id,
          location?.latitude,
          location?.longitude
        );
        if (response.success && response.data) {
          const productData = response.data as any;

          // Set location availability flag
          setIsAvailableAtLocation(productData.isAvailableAtLocation !== false);

          // Get all images (main + gallery)
          const allImages = [
            productData.mainImage || productData.imageUrl || "",
            ...(productData.galleryImages || productData.galleryImageUrls || []),
          ].filter(Boolean);

          setProduct({
            ...productData,
            // Ensure all critical fields have safe defaults
            id: productData._id || productData.id,
            name: productData.productName || productData.name || "Product",
            imageUrl: productData.mainImage || productData.imageUrl || "",
            allImages: allImages,
            price: productData.price || 0,
            mrp: productData.mrp || productData.price || 0,
            pack:
              productData.variations?.[0]?.title ||
              productData.variations?.[0]?.value ||
              productData.smallDescription ||
              "Standard",
          });

          // Reset selected variant and image when product changes
          setSelectedVariantIndex(0);
          setSelectedImageIndex(0);
          setSimilarProducts(response.data.similarProducts || []);

          // Fallback: If no similar products are returned, fetch some from the same category
          if (!response.data.similarProducts || response.data.similarProducts.length === 0) {
            const categoryId = productData.category?.id || productData.category?._id || productData.categoryId;
            if (categoryId) {
              getProducts({ category: categoryId, limit: 10 }).then(fallbackRes => {
                if (fallbackRes.success && fallbackRes.data) {
                  // Exclude the current product from the fallback list
                  const productId = productData._id || productData.id;
                  const filtered = fallbackRes.data.filter((p: any) => (p._id || p.id) !== productId);
                  setSimilarProducts(filtered);
                }
              }).catch(err => console.error("Fallback fetching failed", err));
            }
          }


        } else {
          setProduct(null);
          setError(response.message || "Product not found");
        }
      } catch (error: any) {
        console.error("Failed to fetch product", error);
        setProduct(null);
        setError(error.message || "Something went wrong while fetching product details");
      } finally {
        setLoading(false);
        stopLoading();
      }
    };



    fetchProduct();
  }, [id, location?.latitude, location?.longitude]);

  // Get selected variant
  const selectedVariant = product?.variations?.[selectedVariantIndex] || null;
  const { displayPrice: variantPrice, mrp: variantMrp, discount, hasDiscount } = calculateProductPrice(product, selectedVariantIndex);

  const variantStock = selectedVariant?.stock !== undefined ? selectedVariant.stock : (product?.stock || 0);
  const variantTitle = selectedVariant?.title || selectedVariant?.value || product?.pack || "Standard";
  const isVariantAvailable = selectedVariant?.status !== "Sold out" && (variantStock > 0);

  // Get all images for gallery
  const allImages = product?.allImages || [product?.imageUrl || ""].filter(Boolean);
  const currentImage = allImages[selectedImageIndex] || product?.imageUrl || "";

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  // Handle touch start
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  // Handle touch move
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  // Handle touch end - perform swipe
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && selectedImageIndex < allImages.length - 1) {
      setIsTransitioning(true);
      setSelectedImageIndex(selectedImageIndex + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }

    if (isRightSwipe && selectedImageIndex > 0) {
      setIsTransitioning(true);
      setSelectedImageIndex(selectedImageIndex - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  // Get quantity in cart - check by product ID and variant if available
  const cartItem = product
    ? cart.items.find(
      (item) => {
        if (!item?.product) return false;
        const itemProductId = String(item.product.id || item.product._id);
        const productId = String(product.id || product._id);

        if (itemProductId !== productId) return false;

        // Normalize titles for comparison (remove whitespace, lowercase)
        const normalize = (s: any) => String(s || "").toLowerCase().trim().replace(/\s+/g, "");
        const currentVariantTitle = normalize(variantTitle);

        // If variant exists in current view, match by variant
        if (selectedVariant) {
          const itemVariantId = (item.product as any).variantId || (item.product as any).selectedVariant?._id;
          const itemVariantTitle = normalize((item.product as any).variantTitle || (item.product as any).pack || item.variant);

          const selectedVariantId = String(selectedVariant._id || "");

          // Match by ID if available
          if (itemVariantId && selectedVariantId && String(itemVariantId) === selectedVariantId) {
            return true;
          }

          // Fallback to Title match
          return itemVariantTitle === currentVariantTitle;
        }

        // If no variant in current view, match items that also have no variant info
        const itemVariantId = (item.product as any).variantId || (item.product as any).selectedVariant?._id;
        const itemVariantTitle = (item.product as any).variantTitle;

        // If the item in cart HAS a variant but we don't have variants here, it's still the same product
        // and we might want to show it as "In Cart" (at least in summary).
        // For ProductDetail, if there's ONLY one type of item for this product, match it.
        return !itemVariantId && !itemVariantTitle;
      }
    )
    : null;
  const inCartQty = cartItem?.quantity || 0;

  // Determine if this is a scheduled product or has specific delivery times
  const isScheduleProduct = product?.headerCategoryId?.deliveryType === 'scheduled' ||
    product?.category?.headerCategoryId?.deliveryType === 'scheduled' ||
    product?.subcategory?.headerCategoryId?.deliveryType === 'scheduled' ||
    !!product?.regionalTime || !!product?.localTime;

  // Get dynamic delivery text for scheduled products or those with specific times
  const scheduledDeliveryText = isScheduleProduct
    ? getScheduledDeliveryText(
        product?.seller?.deliveryTime,
        product?.seller?.city,
        location?.city,
        location?.latitude,
        location?.longitude,
        product?.seller?.location,
        product?.seller?.serviceRadiusKm,
        { regionalTime: product?.regionalTime, localTime: product?.localTime }
      )
    : null;

  if (loading && !product) {
    return null; // Let the global IconLoader handle this
  }

  if (error && !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center bg-white">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
        <p className="text-gray-600 mb-6 max-w-xs">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors"
        >
          Try Refreshing
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4 md:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-lg md:text-xl font-semibold text-neutral-900 mb-4">
            Product not found
          </p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Get category info - safe access
  const category =
    product.category && product.category.name
      ? { name: product.category.name, id: product.category._id }
      : null;

  const handleAddToCart = () => {
    if (!isAvailableAtLocation) {
      // Show alert if trying to add item outside delivery area
      alert("This product is not available for delivery at your location.");
      return;
    }
    if (!isVariantAvailable && variantStock !== 0) {
      alert("This variant is currently out of stock.");
      return;
    }
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // Create product with selected variant info
    const productWithVariant = {
      ...product,
      price: variantPrice,
      mrp: variantMrp,
      pack: variantTitle,
      selectedVariant: selectedVariant,
      variantId: selectedVariant?._id,
      variantTitle: variantTitle,
    };
    addToCart(productWithVariant, addButtonRef.current);
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-32">
      {/* ── Floating Header ── */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="pointer-events-auto w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-full shadow-md active:scale-95 transition-transform"
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div className="pointer-events-auto flex items-center gap-2">
            {product?.id && (
              <WishlistButton productId={product.id} size="md" className="bg-white/90 backdrop-blur-md rounded-full shadow-md" />
            )}
          </div>
        </div>
      </div>

      {/* ── Unavailability Banner ── */}
      {!isAvailableAtLocation && (
        <div className="pt-16 px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3">
            <span className="text-xl shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-bold text-amber-900">Not available at your location</p>
              <p className="text-xs text-amber-700 mt-0.5">You can browse but cannot add to cart.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Gallery ── */}
      <div className={`relative w-full bg-white overflow-hidden ${!isAvailableAtLocation ? 'mt-3' : ''}`}>
        {/* Main Image Swiper */}
        <div
          className="w-full aspect-square md:aspect-[4/3] max-h-[450px] relative overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ touchAction: allImages.length > 1 ? 'pan-x' : 'pan-y pinch-zoom' }}
        >
          {/* Mobile swipe strip */}
          <div
            className="w-full h-full flex transition-transform duration-300 ease-out md:hidden"
            style={{ transform: `translateX(-${selectedImageIndex * 100}%)` }}
          >
            {allImages.map((img: string, i: number) => (
              <div key={i} className="w-full h-full flex-shrink-0 flex items-center justify-center" style={{ minWidth: '100%' }}>
                {img ? (
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" draggable={false} />
                ) : (
                  <span className="text-6xl text-neutral-300">{product.name?.charAt(0)?.toUpperCase()}</span>
                )}
              </div>
            ))}
          </div>

          {/* Desktop single image */}
          <div className="hidden md:flex w-full h-full items-center justify-center">
            {currentImage ? (
              <img src={currentImage} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-6xl text-neutral-300">{product.name?.charAt(0)?.toUpperCase()}</span>
            )}
          </div>

          {/* Discount badge */}
          {discount > 0 && (
            <div className="absolute top-20 left-4 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-lg">
              {discount}% OFF
            </div>
          )}

          {/* Image dots */}
          {allImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {allImages.map((_: string, i: number) => (
                <button
                  key={i}
                  onClick={() => { setIsTransitioning(true); setSelectedImageIndex(i); setTimeout(() => setIsTransitioning(false), 300); }}
                  className={`rounded-full transition-all duration-300 ${i === selectedImageIndex ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {allImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2.5 bg-white border-b border-neutral-100">
            {allImages.map((img: string, i: number) => (
              <button
                key={i}
                onClick={() => { setIsTransitioning(true); setSelectedImageIndex(i); setTimeout(() => setIsTransitioning(false), 300); }}
                className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === selectedImageIndex ? 'border-teal-500 ring-2 ring-teal-200' : 'border-neutral-200'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Product Info Card ── */}
      <div className="bg-white rounded-t-3xl -mt-3 relative z-10 px-4 pt-4 pb-3 shadow-sm">
        {/* Delivery pill */}
        <div className="inline-flex items-center gap-1.5 bg-neutral-50 border border-neutral-100 rounded-full px-3 py-1 mb-3">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-teal-600"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          <span className="text-[11px] font-semibold text-neutral-600">
            {product.regionalTime || product.localTime ? (
              <>
                {product.localTime && <span>Local: {product.localTime}</span>}
                {product.localTime && product.regionalTime && <span> · </span>}
                {product.regionalTime && <span>Regional: {product.regionalTime}</span>}
              </>
            ) : (
              scheduledDeliveryText || getDeliveryInfo(getCategoryType(product.category?.name)).detailText
            )}
          </span>
        </div>

        {/* Name */}
        <h1 className="text-xl font-extrabold text-neutral-900 leading-tight mb-1 tracking-tight">
          {product.name}
        </h1>

        {/* Pack */}
        <p className="text-xs text-neutral-400 font-medium mb-3">{variantTitle}</p>

        {/* Price row */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl font-black text-neutral-900">₹{variantPrice.toLocaleString('en-IN')}</span>
          {hasDiscount && (
            <>
              <span className="text-sm text-neutral-400 line-through">₹{variantMrp.toLocaleString('en-IN')}</span>
              {discount > 0 && (
                <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {discount}% OFF
                </span>
              )}
            </>
          )}
        </div>

        {/* Stock */}
        {variantStock !== undefined && variantStock !== null && variantStock !== 0 && (
          <p className={`text-xs font-semibold mb-3 ${variantStock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {variantStock > 0 ? `✓ ${variantStock} in stock` : '✗ Out of stock'}
          </p>
        )}

        {/* Variant Selector */}
        {product.variations && product.variations.length > 1 && (
          <div className="mb-4">
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Select {product.variationType || 'Size'}</p>
            <div className="flex flex-wrap gap-2">
              {product.variations.map((variant: any, i: number) => {
                const vLabel = variant.title || variant.value || `Variant ${i + 1}`;
                const isOOS = variant.status === 'Sold out' || (variant.stock === 0 && variant.stock !== undefined && variant.stock !== null);
                const isSel = i === selectedVariantIndex;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedVariantIndex(i)}
                    disabled={isOOS}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold border-2 transition-all active:scale-95 ${
                      isSel ? 'border-teal-500 bg-teal-50 text-teal-700' :
                      isOOS ? 'border-neutral-200 bg-neutral-100 text-neutral-300 cursor-not-allowed line-through' :
                      'border-neutral-200 bg-white text-neutral-700 hover:border-teal-400'
                    }`}
                  >
                    {vLabel}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Service Guarantee Strip */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-neutral-100">
          {[
            { label: product.cancelAvailable ? 'Cancellable' : 'Non-Cancel', sub: '', icon: '🚫', ok: product.cancelAvailable },
            { label: product.isReturnable ? `${product.maxReturnDays || 2}D Return` : 'No Return', sub: '', icon: '🔄', ok: product.isReturnable },
            { label: '24/7', sub: 'Support', icon: '💬', ok: true },
            { label: 'Safe', sub: 'Delivery', icon: '🚚', ok: true },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-1 text-center">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${item.ok ? 'bg-emerald-50' : 'bg-red-50'}`}>{item.icon}</div>
              <span className="text-[9px] font-bold text-neutral-800 leading-tight">{item.label}</span>
              {item.sub && <span className="text-[8px] text-neutral-400">{item.sub}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Expandable Sections ── */}
      <div className="mt-2 space-y-1 px-4">
        {/* Product Details */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setIsProductDetailsExpanded(!isProductDetailsExpanded)}
            className="w-full flex items-center justify-between px-4 py-3.5"
          >
            <span className="text-sm font-bold text-neutral-900">Product Details</span>
            <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isProductDetailsExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <AnimatePresence>
            {isProductDetailsExpanded && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-neutral-50">
                {/* Highlights */}
                <div className="px-4 py-3">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Highlights</p>
                  <div className="space-y-2">
                    {product.tags && product.tags.length > 0 && (
                      <div className="flex gap-2">
                        <span className="text-xs font-bold text-neutral-500 w-28 shrink-0">Key Features</span>
                        <span className="text-xs text-neutral-700">{product.tags.join(', ')}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="text-xs font-bold text-neutral-500 w-28 shrink-0">Source</span>
                      <span className="text-xs text-neutral-700">{product.madeIn || 'India'}</span>
                    </div>
                    {category && (
                      <div className="flex gap-2">
                        <span className="text-xs font-bold text-neutral-500 w-28 shrink-0">Category</span>
                        <span className="text-xs text-neutral-700">{category.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-neutral-50 mx-4" />

                {/* Info */}
                <div className="px-4 py-3">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Info</p>
                  <div className="space-y-2">
                    {(product.description || product.smallDescription) && (
                      <div className="flex gap-2">
                        <span className="text-xs font-bold text-neutral-500 w-28 shrink-0">Description</span>
                        <span className="text-xs text-neutral-700 leading-relaxed flex-1">{product.description || product.smallDescription}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="text-xs font-bold text-neutral-500 w-28 shrink-0">Unit</span>
                      <span className="text-xs text-neutral-700">{product.pack}</span>
                    </div>
                    {product.fssaiLicNo && (
                      <div className="flex gap-2">
                        <span className="text-xs font-bold text-neutral-500 w-28 shrink-0">FSSAI License</span>
                        <span className="text-xs text-neutral-700">{product.fssaiLicNo}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="text-xs font-bold text-neutral-500 w-28 shrink-0">Country of Origin</span>
                      <span className="text-xs text-neutral-700">{product.madeIn || 'India'}</span>
                    </div>
                    {product.manufacturer && (
                      <div className="flex gap-2">
                        <span className="text-xs font-bold text-neutral-500 w-28 shrink-0">Manufacturer</span>
                        <span className="text-xs text-neutral-700 flex-1">{product.manufacturer}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="text-xs font-bold text-neutral-500 w-28 shrink-0">Policy</span>
                      <div className="flex-1">
                        <p className="text-xs text-neutral-700">Cancellation: {product.cancelAvailable ? 'Available before shipping.' : 'Non-cancellable.'}</p>
                        <p className="text-xs text-neutral-700 mt-0.5">Returns: {product.isReturnable ? `Within ${product.maxReturnDays || 2} days.` : 'Non-returnable.'}</p>
                      </div>
                    </div>
                    {product.sellerId && (
                      <div className="flex gap-2">
                        <span className="text-xs font-bold text-neutral-500 w-28 shrink-0">Seller</span>
                        <span className="text-xs text-neutral-700">JYASTI Partner ({product.sellerId.slice(-6).toUpperCase()})</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="text-xs font-bold text-neutral-500 w-28 shrink-0">Support</span>
                      <span className="text-xs text-neutral-700">help@justi.com</span>
                    </div>
                  </div>
                </div>

                {/* Disclaimer */}
                {(() => {
                  const disclaimer = product.subSubCategory?.disclaimer || product.subcategory?.disclaimer || product.category?.disclaimer;
                  return <CategoryDisclaimer disclaimer={disclaimer} className="mx-4 mb-3" label="Before You Buy" />;
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Combo & Buy Together ── */}
      <div className="mt-2 px-4">
        <ComboOfferSection
          categoryId={product.category?.slug || product.category?._id || product.categoryId}
          categoryName={product.category?.name}
          currentProductId={product.id || product._id}
        />
      </div>
      {similarProducts.length > 0 && (
        <div className="mt-2 px-4">
          <BuyTogetherSection currentProduct={product} products={similarProducts} />
        </div>
      )}

      {/* ── Reviews ── */}
      <div className="mt-2 mx-4 bg-white rounded-2xl p-4 shadow-sm">
        <ProductReviews productId={product.id || product._id} productName={product.productName} productImage={product.mainImage} />
      </div>

      {/* ── Similar Products ── */}
      {similarProducts.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between px-4 mb-3">
            <h3 className="text-sm font-extrabold text-neutral-900">More Like This</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-3" style={{ scrollSnapType: 'x mandatory' }}>
            {similarProducts.map((sp) => {
              const simCartItem = cart.items.find(item => item?.product && (item.product.id === sp.id || item.product.id === sp._id));
              const simQty = simCartItem?.quantity || 0;
              const { displayPrice: spPrice, mrp: spMrp, discount: spDiscount, hasDiscount: spHasDiscount } = calculateProductPrice(sp);

              return (
                <div key={sp.id || sp._id} className="flex-shrink-0 w-36 bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden" style={{ scrollSnapAlign: 'start' }}>
                  <WishlistButton productId={sp.id || sp._id} size="sm" className="absolute top-2 right-2 shadow-md" />
                  <div onClick={() => navigate(`/product/${sp.id || sp._id}`, { state: { fromStore: true } })} className="w-full h-28 bg-neutral-50 flex items-center justify-center overflow-hidden cursor-pointer relative">
                    {(sp.imageUrl || sp.mainImage) ? (
                      <img src={sp.imageUrl || sp.mainImage} alt={sp.name || sp.productName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-3xl text-neutral-300">{(sp.name || sp.productName || 'P').charAt(0)}</span>
                    )}
                    {spDiscount > 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-lg">{spDiscount}% OFF</span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-[11px] font-bold text-neutral-900 line-clamp-2 mb-1 leading-tight">{sp.name || sp.productName}</p>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-sm font-black text-neutral-900">₹{spPrice}</span>
                      {spHasDiscount && <span className="text-[10px] text-neutral-400 line-through">₹{spMrp}</span>}
                    </div>
                    <AnimatePresence mode="wait">
                      {simQty === 0 ? (
                        <motion.button
                          key="add"
                          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                          onClick={e => { e.stopPropagation(); addToCart(sp); }}
                          className="w-full py-1.5 rounded-xl border-2 border-teal-500 text-teal-600 text-xs font-bold active:scale-95 transition-transform"
                        >ADD</motion.button>
                      ) : (
                        <motion.div
                          key="stepper"
                          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center justify-between bg-teal-500 rounded-xl px-2 py-1.5"
                          onClick={e => e.stopPropagation()}
                        >
                          <button onClick={e => { e.stopPropagation(); updateQuantity(sp.id, simQty - 1); }} className="text-white font-black text-sm w-5 h-5 flex items-center justify-center">−</button>
                          <span className="text-white font-black text-sm">{simQty}</span>
                          <button onClick={e => { e.stopPropagation(); updateQuantity(sp.id, simQty + 1); }} className="text-white font-black text-sm w-5 h-5 flex items-center justify-center">+</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Sticky Footer ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white/95 backdrop-blur-xl border-t border-neutral-100 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center gap-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
          {/* Left: variant + price */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-neutral-400 font-medium truncate">{variantTitle}</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-black text-neutral-900">₹{variantPrice.toLocaleString('en-IN')}</span>
              {hasDiscount && (
                <>
                  <span className="text-xs text-neutral-400 line-through">₹{variantMrp.toLocaleString('en-IN')}</span>
                  {discount > 0 && (
                    <span className="text-[9px] font-black text-emerald-500">{discount}% OFF</span>
                  )}
                </>
              )}
            </div>
            <p className="text-[10px] text-neutral-300 leading-none mt-0.5">Inclusive of all taxes</p>
          </div>

          {/* Right: Add to cart / Stepper */}
          <div className="shrink-0">
            <AnimatePresence mode="wait">
              {inCartQty === 0 ? (
                <motion.button
                  key="add"
                  ref={addButtonRef}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  onClick={handleAddToCart}
                  disabled={!isAvailableAtLocation || !isVariantAvailable}
                  className="px-7 py-3 rounded-2xl text-white text-sm font-black shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}
                >
                  {!isAvailableAtLocation ? 'Unavailable' : !isVariantAvailable ? 'Out of Stock' : 'Add to Cart'}
                </motion.button>
              ) : (
                <motion.div
                  key="stepper"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}
                >
                  <button
                    onClick={() => { updateQuantity(product.id || product._id, inCartQty - 1, selectedVariant?._id, variantTitle); }}
                    className="w-7 h-7 flex items-center justify-center text-white font-black text-lg bg-white/20 rounded-xl active:scale-90 transition-transform"
                  >−</button>
                  <motion.span key={inCartQty} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-white font-black text-base min-w-[1.5rem] text-center">{inCartQty}</motion.span>
                  <button
                    onClick={() => { updateQuantity(product.id || product._id, inCartQty + 1, selectedVariant?._id, variantTitle); }}
                    disabled={inCartQty >= variantStock}
                    className="w-7 h-7 flex items-center justify-center text-white font-black text-lg bg-white/20 rounded-xl active:scale-90 transition-transform disabled:opacity-40"
                  >+</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
