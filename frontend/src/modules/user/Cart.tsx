import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import Button from '../../components/ui/button';
import { appConfig } from '../../services/configService';
import { calculateProductPrice } from '../../utils/priceUtils';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../../components/EmptyState';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const deliveryFee = cart.total >= (appConfig.freeDeliveryThreshold || 0) ? 0 : (appConfig.deliveryFee || 0);
  const platformFee = appConfig.platformFee || 0;
  const totalAmount = cart.total + deliveryFee + platformFee;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (cart.items.length === 0) {
    return (
      <div className="flex items-start justify-center min-h-[60vh] bg-white pt-8">
        <EmptyState 
            title="Your cart is empty"
            description="Add some items to get started! We have amazing deals waiting for you."
            buttonText="Start Shopping"
            onButtonClick={() => navigate("/")}
        />
      </div>
    );
  }

  return (
    <div className="pb-4 md:pb-8 max-w-7xl mx-auto">
      {/* Header - Desktop/Tablet layout adjustments */}
      <div className="px-4 md:px-6 lg:px-8 py-4 md:py-8 bg-white border-b md:border-none border-neutral-200 mb-4 md:mb-2 sticky md:static top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-3xl font-extrabold text-neutral-900">Your Basket</h1>
            <p className="hidden md:block text-sm text-neutral-500 mt-1">Review your selections before proceeding</p>
          </div>
          {cart.items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm md:text-base text-neutral-600 font-medium hover:text-red-600 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="md:hidden mt-2">
           <p className="text-xs text-neutral-600">Delivered in {appConfig.estimatedDeliveryTime}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 px-4 md:px-6 lg:px-8">
        {/* Left Column: Cart Content */}
        <div className="flex-1 space-y-6 md:space-y-8">
          {['quick', 'scheduled'].map((dtype) => {
            const sectionItems = cart.items.filter(i => i.deliveryType === dtype);
            if (sectionItems.length === 0) return null;

            const isQuick = dtype === 'quick';
            const title = isQuick ? 'QUICK DELIVERY' : 'SCHEDULED DELIVERY';
            const subtitle = isQuick ? `Estimated ${appConfig.estimatedDeliveryTime}` : '15-30 mins';
            const icon = isQuick ? '⚡' : '📅';
            const iconColor = isQuick ? 'text-blue-600' : 'text-blue-500';

            return (
              <div key={dtype} className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <span className={`${iconColor} text-lg`}>{icon}</span>
                  <div className="flex flex-col md:flex-row md:items-baseline gap-0.5 md:gap-2">
                    <h2 className="font-bold text-neutral-800 text-xs md:text-sm tracking-wider">{title}</h2>
                    <span className="text-neutral-500 text-[10px] md:text-xs font-bold uppercase tracking-wide">
                      {subtitle}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {sectionItems.map((item) => {
                    const isCombo = !!item.comboOffer;
                    const name = isCombo ? item.comboOffer.name : item.product?.name;
                    const image = isCombo ? item.comboOffer.image : item.product?.imageUrl;
                    const pack = isCombo ? 'Combo Bundle' : item.product?.pack;

                    let displayPrice = 0;
                    let mrp = 0;
                    let hasDiscount = false;

                    if (isCombo) {
                      displayPrice = item.comboOffer.comboPrice;
                      mrp = item.comboOffer.originalPrice;
                      hasDiscount = mrp > displayPrice;
                    } else if (item.product) {
                      const priceData = calculateProductPrice(item.product, item.variant);
                      displayPrice = priceData.displayPrice;
                      mrp = priceData.mrp;
                      hasDiscount = priceData.hasDiscount;
                    }

                    const itemId = (item as any)._id || item.id || (isCombo ? item.comboOffer._id : (item.product?.id || (item.product as any)?._id));

                    return (
                      <div key={itemId} className="bg-white rounded-2xl md:rounded-3xl border border-neutral-100 shadow-sm hover:shadow-md transition-all p-4 md:p-6 flex gap-4 md:gap-6 group relative">
                        {/* Product Image */}
                        <div className="w-20 h-20 md:w-28 md:h-28 bg-neutral-50 rounded-xl md:rounded-2xl overflow-hidden flex-shrink-0 border border-neutral-100">
                          {image ? (
                            <img src={image} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl text-neutral-300 font-bold">
                              {name?.charAt(0)}
                            </div>
                          )}
                          {isCombo && (
                            <div className="absolute top-2 left-2 md:top-4 md:left-4">
                               <span className="bg-neutral-900 text-white text-[8px] md:text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Combo</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 flex flex-col min-w-0 py-1">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <h3 className="text-sm md:text-xl font-bold text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-1">{name}</h3>
                              <p className="text-[10px] md:text-sm text-neutral-500 font-medium">{pack || 'Standard Size'}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm md:text-xl font-bold text-neutral-900">₹{displayPrice.toLocaleString('en-IN')}</span>
                              {hasDiscount && (
                                <p className="text-[10px] md:text-xs text-neutral-400 line-through">₹{mrp.toLocaleString('en-IN')}</p>
                              )}
                            </div>
                          </div>

                          {isCombo && item.comboOffer.comboProducts && (
                            <div className="mt-2 mb-3 p-2 bg-neutral-50 rounded-xl border border-neutral-100/50">
                              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                                {item.comboOffer.comboProducts.map((cp: any, idx: number) => (
                                  <li key={idx} className="text-[10px] md:text-xs text-neutral-500 flex items-center gap-1.5">
                                    <span className="w-1 h-1 bg-neutral-300 rounded-full"></span>
                                    <span className="truncate">{cp.product?.productName || cp.product?.name}</span>
                                    <span className="text-neutral-400 font-bold shrink-0">x{cp.quantity || 1}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex items-end justify-between mt-auto">
                            <div className="flex gap-2">
                               {/* Buttons removed as requested */}
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Remove button - subtle */}
                              <button
                                onClick={() => removeFromCart(itemId)}
                                className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                                title="Remove item"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                              </button>

                              {/* Quantity Controls */}
                              <div className="flex items-center gap-1 bg-neutral-100/80 rounded-xl p-1 border border-neutral-200">
                                <button
                                  onClick={() => updateQuantity(itemId, item.quantity - 1, item.variant)}
                                  className="w-8 h-8 flex items-center justify-center text-neutral-600 font-bold hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                >
                                  −
                                </button>
                                <span className="text-sm md:text-base font-bold text-neutral-900 min-w-[2rem] text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(itemId, item.quantity + 1, item.variant)}
                                  className="w-8 h-8 flex items-center justify-center text-neutral-600 font-bold hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Order Summary (Sticky) */}
        <div className="lg:w-[380px] shrink-0">
          <div className="sticky top-8 space-y-6">
            <div className="bg-white rounded-[32px] border border-neutral-200 p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="text-xl md:text-2xl font-bold text-neutral-900 mb-8">Order Summary</h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-neutral-500 font-medium">
                  <span>Subtotal</span>
                  <span className="text-neutral-900">₹{cart.total.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-neutral-500 font-medium">
                  <span>Platform Fee</span>
                  <span className="text-neutral-900">₹{platformFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-neutral-500 font-medium items-center">
                  <div className="flex items-center gap-1">
                    <span>Delivery Charge</span>
                    <button className="text-neutral-300">ⓘ</button>
                  </div>
                  <span className={`${deliveryFee === 0 ? 'text-green-600' : 'text-neutral-900'}`}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toLocaleString('en-IN')}`}
                  </span>
                </div>
                {cart.total < (appConfig.freeDeliveryThreshold || 0) && (
                  <div className="text-[10px] md:text-xs text-green-600 bg-green-50 px-3 py-2 rounded-xl font-bold">
                    Add ₹{((appConfig.freeDeliveryThreshold || 0) - cart.total).toLocaleString('en-IN')} more for free delivery
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-100 pt-6 mb-8">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-xl font-bold text-neutral-900">Total</span>
                  <span className="text-2xl md:text-3xl font-extrabold text-neutral-900">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 font-bold tracking-wider uppercase">Inclusive of all taxes</p>
              </div>

              {/* Promo Code - Visual only as requested */}
              <div className="mb-8 p-1 bg-neutral-100 rounded-2xl flex items-center gap-2">
                 <input 
                  type="text" 
                  placeholder="Promo Code" 
                  className="bg-transparent flex-1 px-4 py-3 text-sm font-medium outline-none text-neutral-600 placeholder:text-neutral-400"
                 />
                 <button className="px-4 py-2 text-xs font-bold text-neutral-800 hover:text-neutral-900 uppercase">Apply</button>
              </div>

              <Button
                variant="default"
                size="lg"
                onClick={handleCheckout}
                className="w-full py-4 md:py-5 text-base md:text-lg font-bold rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg shadow-neutral-200 transition-all flex items-center justify-center gap-2"
              >
                Proceed to Checkout <span className="text-xl">→</span>
              </Button>

              <div className="mt-8 space-y-4">
                 <div className="flex items-center gap-3 text-neutral-400">
                    <span className="text-lg">🔒</span>
                    <span className="text-xs font-bold">Secure End-to-End Encryption</span>
                 </div>
                 <div className="flex items-center gap-3 text-neutral-400">
                    <span className="text-lg">🚢</span>
                    <span className="text-xs font-bold">Carbon Neutral Shipping</span>
                 </div>
              </div>
            </div>

            <div className="text-center">
              <Link to="/" className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors flex items-center justify-center gap-2">
                 <span>←</span> Back to Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
