import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrders } from '../../hooks/useOrders';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getProducts } from '../../services/api/customerProductService';
import WishlistButton from '../../components/WishlistButton';
import { calculateProductPrice } from '../../utils/priceUtils';
import { useThemeContext } from '../../context/ThemeContext';
import jyastiLogo from '@assets/jyastiLogo.png';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  Delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'On the way': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  Accepted: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  Received: { bg: 'bg-neutral-100', text: 'text-neutral-600', dot: 'bg-neutral-400' },
};
const getStatusStyle = (status: string) => STATUS_STYLES[status] || { bg: 'bg-neutral-100', text: 'text-neutral-600', dot: 'bg-neutral-400' };

export default function OrderAgain() {
  const { orders } = useOrders();
  const { cart, addToCart, addComboToCart, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const { currentTheme } = useThemeContext();
  const navigate = useNavigate();
  const [addedOrders, setAddedOrders] = useState<Set<string>>(new Set());
  const [bestsellerProducts, setBestsellerProducts] = useState<any[]>([]);
  const accentColor = currentTheme.headerBg || '#0d9488';

  const handleOrderAgain = (order: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/login'); return; }
    setAddedOrders(prev => new Set(prev).add(order.id));
    order.items
      .filter((item: any) => item && (item.product || item.comboOffer))
      .forEach((item: any) => {
        const isCombo = !!item.comboOffer;
        const itemId = isCombo ? (item.comboOffer.id || item.comboOffer._id) : (item.product.id || item.product._id);
        if (isCombo) {
          const existing = cart.items.find(c => c?.comboOffer && (c.comboOffer.id === itemId || c.comboOffer._id === itemId));
          existing ? updateQuantity(itemId, existing.quantity + item.quantity) : addComboToCart(itemId, item.quantity);
        } else {
          const existing = cart.items.find(c => c?.product && (c.product.id === itemId || c.product._id === itemId));
          if (existing) {
            updateQuantity(itemId, existing.quantity + item.quantity);
          } else {
            addToCart(item.product);
            if (item.quantity > 1) setTimeout(() => updateQuantity(itemId, item.quantity), 50);
          }
        }
      });
  };

  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        const response = await getProducts({ sort: 'popular', limit: 8 });
        if (response.success && response.data) {
          setBestsellerProducts((response.data as any[]).map(p => ({
            ...p,
            id: p._id || p.id,
            name: (p.productName || p.name || '').replace(/\s*-\s*(Fresh|Quality|Assured|Premium|Best|Top|Hygienic|Carefully|Selected).*$/i, '').trim(),
            imageUrl: p.mainImage || p.imageUrl,
            mrp: p.mrp || p.price,
            pack: p.variations?.[0]?.title || p.smallDescription || '',
          })));
        }
      } catch (err) { console.error('Failed to fetch bestsellers:', err); }
    };
    fetchBestsellers();
  }, []);

  const hasOrders = orders && orders.length > 0;

  return (
    <div className="min-h-screen bg-neutral-50 pb-28 md:pb-10 pt-[env(safe-area-inset-top,12px)]">

      {/* ── Page Header ── */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">Order Again</h1>
          <p className="text-xs text-neutral-400 font-medium mt-0.5">
            {hasOrders ? `${orders!.length} previous order${orders!.length > 1 ? 's' : ''}` : 'Your order history will appear here'}
          </p>
        </div>
        {hasOrders && (
          <button onClick={() => navigate('/orders')} className="text-xs font-bold px-3 py-1.5 rounded-xl border border-neutral-200 bg-white text-neutral-600 active:scale-95 transition-transform">
            All Orders
          </button>
        )}
      </div>

      {/* ── Orders List ── */}
      {hasOrders ? (
        <div className="px-4 space-y-2.5 mb-6">
          {orders!.map((order, idx) => {
            const shortId = order.id.split('-').slice(-1)[0];
            const previewItems = order.items.slice(0, 4);
            const style = getStatusStyle(order.status);
            const isAdded = addedOrders.has(order.id);

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-neutral-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <div>
                      <p className="text-[11px] font-bold text-neutral-900">Order #{shortId}</p>
                      <p className="text-[10px] text-neutral-400">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${style.bg} ${style.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {order.status}
                    </span>
                    <span className="text-sm font-black text-neutral-900">₹{(order.totalAmount || 0).toFixed(0)}</span>
                  </div>
                </div>

                {/* Product Thumbnails */}
                <div className="px-4 py-3 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {previewItems
                      .filter(item => item && (item.product || item.comboOffer))
                      .map((item, i) => {
                        const img = item.product?.imageUrl || item.comboOffer?.image;
                        const nm = item.product?.name || item.comboOffer?.name || '';
                        return (
                          <div key={i} className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-100 overflow-hidden flex items-center justify-center shrink-0">
                            {img ? <img src={img} alt={nm} className="w-full h-full object-contain" /> : <span className="text-sm text-neutral-300">{nm.charAt(0)}</span>}
                          </div>
                        );
                      })}
                    {order.items.length > 4 && (
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-500 shrink-0">
                        +{order.items.length - 4}
                      </div>
                    )}
                    <div className="ml-1 min-w-0">
                      <p className="text-[10px] text-neutral-500">{order.totalItems || order.items.length} items</p>
                    </div>
                  </div>

                  {/* Order Again Button */}
                  <button
                    onClick={e => handleOrderAgain(order, e)}
                    disabled={isAdded}
                    className={`shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1 ${
                      isAdded
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        : 'text-white shadow-sm'
                    }`}
                    style={isAdded ? {} : { background: accentColor }}
                  >
                    {isAdded ? (
                      <>✓ Added</>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.66" /></svg>
                        Repeat
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* ── Premium Empty State ── */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-4 flex flex-col items-center text-center"
        >
          {/* Illustration */}
          <div className="relative w-full max-w-[240px] mx-auto mb-5 mt-6">
            {/* Glow background */}
            <div className="absolute inset-0 rounded-full blur-3xl opacity-20" style={{ background: accentColor }} />

            {/* Bag Shape */}
            <div className="relative flex flex-col items-center">
              {/* Bag Handle */}
              <div className="w-24 h-8 border-[5px] border-t-0 rounded-b-3xl mb-0 relative z-10" style={{ borderColor: accentColor }} />

              {/* Bag Body */}
              <div className="w-48 h-44 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center shadow-2xl" style={{ background: `linear-gradient(145deg, ${accentColor}22 0%, ${accentColor}10 100%)`, border: `2px solid ${accentColor}30` }}>
                {/* Decorative circles */}
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10" style={{ background: accentColor }} />
                <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10" style={{ background: accentColor }} />

                {/* Logo */}
                <img src={jyastiLogo} alt="Jyasti" className="h-16 w-auto object-contain relative z-10 opacity-80" />

                {/* Repeat icon */}
                <div className="mt-2 w-8 h-8 rounded-full flex items-center justify-center relative z-10" style={{ background: accentColor }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.66" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-extrabold text-neutral-900 mb-1.5 tracking-tight">No Orders Yet</h2>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mb-6">
            Once you place an order, it'll appear here so you can easily reorder your favourites.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 rounded-2xl text-white text-sm font-bold shadow-md active:scale-95 transition-transform flex items-center gap-2"
            style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3.5L21 9.5V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V9.5Z" /><path d="M9 21V12H15V21" /></svg>
            Start Shopping
          </button>
        </motion.div>
      )}

      {/* ── Bestsellers Section ── */}
      <div className="mt-2">
        <div className="px-4 mb-2 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-neutral-900">Popular Right Now</h2>
          <button onClick={() => navigate('/categories')} className="text-[11px] font-bold" style={{ color: accentColor }}>See All</button>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-3" style={{ scrollSnapType: 'x mandatory' }}>
          {bestsellerProducts.map((product) => {
            const { displayPrice, mrp, discount, hasDiscount } = calculateProductPrice(product);
            const cartItem = cart.items.find(item => item?.product && item.product.id === product.id);
            const inCartQty = cartItem?.quantity || 0;

            return (
              <div key={product.id} className="flex-shrink-0 w-[140px]" style={{ scrollSnapAlign: 'start' }}>
                <div className="bg-white rounded-2xl overflow-hidden border border-neutral-100 shadow-sm flex flex-col h-full">
                  {/* Image */}
                  <div onClick={() => navigate(`/product/${product.id}`)} className="relative cursor-pointer">
                    <div className="w-full h-28 bg-neutral-50 flex items-center justify-center overflow-hidden relative">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-3xl text-neutral-300">{product.name.charAt(0)}</span>
                      )}

                      {discount > 0 && (
                        <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-lg">
                          {discount}% OFF
                        </div>
                      )}
                      <WishlistButton productId={product.id} size="sm" className="top-1.5 right-1.5 shadow-sm" />

                      {/* Cart control */}
                      <div className="absolute bottom-1.5 right-1.5 z-10">
                        <AnimatePresence mode="wait">
                          {inCartQty === 0 ? (
                            <motion.button
                              key="add"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              onClick={e => { e.preventDefault(); e.stopPropagation(); if (!isAuthenticated) { navigate('/login'); return; } addToCart(product, e.currentTarget); }}
                              className="bg-white/95 backdrop-blur-sm border-2 text-[10px] font-bold px-2 py-1 rounded-xl shadow-md active:scale-95 transition-transform"
                              style={{ color: accentColor, borderColor: accentColor }}
                            >
                              ADD
                            </motion.button>
                          ) : (
                            <motion.div
                              key="stepper"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1 rounded-xl px-1.5 py-1 shadow-md"
                              style={{ background: accentColor }}
                            >
                              <button onClick={e => { e.stopPropagation(); updateQuantity(product.id, inCartQty - 1); }} className="w-4 h-4 flex items-center justify-center text-white font-bold text-sm">−</button>
                              <span className="text-white font-bold text-xs min-w-[0.75rem] text-center">{inCartQty}</span>
                              <button onClick={e => { e.stopPropagation(); updateQuantity(product.id, inCartQty + 1); }} className="w-4 h-4 flex items-center justify-center text-white font-bold text-sm">+</button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-2 flex-1 flex flex-col" onClick={() => navigate(`/product/${product.id}`)} style={{ cursor: 'pointer' }}>
                    <p className="text-[11px] font-bold text-neutral-900 line-clamp-2 leading-tight mb-1">{product.name}</p>
                    {product.pack && <p className="text-[9px] text-neutral-400 mb-1">{product.pack}</p>}

                    <div className="mt-auto">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-black text-neutral-900">₹{displayPrice}</span>
                        {hasDiscount && <span className="text-[10px] text-neutral-400 line-through">₹{mrp}</span>}
                      </div>
                    </div>
                  </div>

                  {/* See more */}
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/category/${product.categoryId || 'all'}`); }}
                    className="w-full text-[9px] font-semibold py-1.5 flex items-center justify-between px-2.5 border-t border-neutral-50 transition-colors"
                    style={{ color: accentColor, background: `${accentColor}0a` }}
                  >
                    <span>See more like this</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
