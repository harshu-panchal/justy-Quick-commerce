import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import Button from '../../components/ui/button';
import { appConfig } from '../../services/configService';
import { calculateProductPrice } from '../../utils/priceUtils';
import { useAuth } from '../../context/AuthContext';

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
      <div className="px-4 py-8 md:py-16 text-center">
        <div className="text-6xl md:text-8xl mb-4">🛒</div>
        <h2 className="text-xl md:text-2xl font-bold text-neutral-900 mb-2">Your cart is empty</h2>
        <p className="text-neutral-600 mb-6 md:mb-8 md:text-lg">Add some items to get started!</p>
        <Link to="/">
          <Button variant="default" size="lg" className="md:px-8 md:py-3 md:text-lg">
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-4 md:pb-8">
      {/* Header */}
      <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6 bg-white border-b border-neutral-200 mb-4 md:mb-6 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl md:text-2xl font-bold text-neutral-900">Your Basket</h1>
          {cart.items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm md:text-base text-red-600 font-medium hover:text-red-700 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
        <p className="text-xs md:text-sm text-neutral-600">Delivered in {appConfig.estimatedDeliveryTime}</p>
      </div>

      {/* Cart Content */}
      <div className="px-4 md:px-6 lg:px-8 space-y-4 md:space-y-6 mb-4 md:mb-6">
        {/* Helper to render item list for a delivery type */}
        {['quick', 'scheduled'].map((dtype) => {
          const sectionItems = cart.items.filter(i => (i.deliveryType || 'quick') === dtype);
          if (sectionItems.length === 0) return null;

          const isQuick = dtype === 'quick';
          const title = isQuick ? 'Quick Delivery' : 'Scheduled Delivery';
          const subtitle = isQuick ? 'Delivery in 15-20 mins' : 'Delivery in 1-2 days';
          const icon = isQuick ? '⚡' : '📅';
          const bgColor = isQuick ? 'bg-yellow-50/50' : 'bg-blue-50/50';

          const sectionTotal = sectionItems.reduce((acc, item) => {
            if (item.comboOffer) return acc + item.comboOffer.comboPrice * item.quantity;
            if (item.product) {
              const { displayPrice } = calculateProductPrice(item.product, item.variant);
              return acc + (displayPrice * item.quantity);
            }
            return acc;
          }, 0);

          return (
            <div key={dtype} className="bg-white rounded-[28px] border border-neutral-100 shadow-sm overflow-hidden">
              <div className={`${bgColor} px-5 py-3 border-b border-neutral-100 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  <div>
                    <h2 className="font-bold text-neutral-900 text-sm md:text-base">{title}</h2>
                    <p className="text-[10px] md:text-xs text-neutral-500 font-medium">{subtitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-neutral-900">
                    ₹{sectionTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-neutral-50">
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
                    <div key={itemId} className="p-4 md:p-5 flex gap-4 hover:bg-neutral-50/30 transition-colors group relative">
                      {/* Product Image */}
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-neutral-100 rounded-xl overflow-hidden flex-shrink-0">
                        {image ? (
                          <img src={image} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl text-neutral-400 font-bold bg-neutral-50">
                            {name?.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start pr-8">
                          <div>
                            <h3 className="text-sm md:text-base font-semibold text-neutral-900 line-clamp-1">{name}</h3>
                            <p className="text-[10px] md:text-xs text-neutral-500 mb-2">{pack}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(itemId)}
                            className="absolute right-4 top-4 text-neutral-300 hover:text-red-500 transition-colors p-1"
                            title="Remove item"
                          >
                            ✕
                          </button>
                        </div>

                        {isCombo && item.comboOffer.comboProducts && (
                          <div className="mb-3 p-2 bg-neutral-50/50 rounded-lg border border-neutral-100/50">
                            <ul className="space-y-1">
                              {item.comboOffer.comboProducts.slice(0, 3).map((cp: any, idx: number) => (
                                <li key={idx} className="text-[10px] text-neutral-500 flex items-center gap-1.5">
                                  <span className="w-1 h-1 bg-neutral-300 rounded-full"></span>
                                  {cp.product?.productName || cp.product?.name} <span className="text-neutral-400">x{cp.quantity || 1}</span>
                                </li>
                              ))}
                              {item.comboOffer.comboProducts.length > 3 && (
                                <li className="text-[9px] text-neutral-400 italic pl-2.5">+{item.comboOffer.comboProducts.length - 3} more items</li>
                              )}
                            </ul>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-2">
                            <span className="text-sm md:text-base font-bold text-neutral-900">₹{displayPrice}</span>
                            {hasDiscount && <span className="text-[10px] md:text-xs text-neutral-400 line-through">₹{mrp}</span>}
                            {isCombo && <span className="text-[8px] md:text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Bundle</span>}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 bg-green-50 rounded-lg p-0.5 border border-green-100">
                            <button
                              onClick={() => updateQuantity(itemId, item.quantity - 1, item.variant)}
                              className="w-7 h-7 flex items-center justify-center text-green-700 font-bold hover:bg-white rounded-md transition-colors"
                            >
                              −
                            </button>
                            <span className="text-sm font-bold text-green-900 min-w-[1.5rem] text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(itemId, item.quantity + 1, item.variant)}
                              className="w-7 h-7 flex items-center justify-center text-green-700 font-bold hover:bg-white rounded-md transition-colors"
                            >
                              +
                            </button>
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

      {/* Order Summary */ }
                    <div className="px-4 md:px-6 lg:px-8 mb-24 md:mb-8">
                      <div className="bg-white rounded-xl border border-neutral-200 p-4 md:p-6 shadow-sm md:max-w-md md:ml-auto">
                        <h2 className="text-lg md:text-xl font-bold text-neutral-900 mb-4 md:mb-6">Order Summary</h2>
                        <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                          <div className="flex justify-between text-neutral-700 md:text-base">
                            <span>Subtotal</span>
                            <span className="font-medium">₹{cart.total.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-neutral-700 md:text-base">
                            <span>Platform Fee</span>
                            <span className="font-medium">₹{platformFee.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-neutral-700 md:text-base">
                            <span>Delivery Charges</span>
                            <span className={`font-medium ${deliveryFee === 0 ? 'text-green-600' : ''}`}>
                              {deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toLocaleString('en-IN')}`}
                            </span>
                          </div>
                          {cart.total < (appConfig.freeDeliveryThreshold || 0) && (
                            <div className="text-xs md:text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                              Add ₹{((appConfig.freeDeliveryThreshold || 0) - cart.total).toLocaleString('en-IN')} more for free delivery
                            </div>
                          )}
                        </div>
                        <div className="border-t border-neutral-200 pt-4 md:pt-6">
                          <div className="flex justify-between items-center mb-4 md:mb-6">
                            <span className="text-lg md:text-xl font-bold text-neutral-900">Total</span>
                            <span className="text-xl md:text-2xl font-bold text-neutral-900">
                              ₹{totalAmount.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <Button
                            variant="default"
                            size="lg"
                            onClick={handleCheckout}
                            className="w-full md:py-3 md:text-lg"
                          >
                            Proceed to Checkout
                          </Button>
                        </div>
                      </div>
                    </div>
    </div>
                );
}
