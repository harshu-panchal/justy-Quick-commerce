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

  const deliveryFee = cart.total >= appConfig.freeDeliveryThreshold ? 0 : appConfig.deliveryFee;
  const platformFee = appConfig.platformFee;
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
        {/* Quick Delivery Section */}
        {cart.items.filter(i => i.deliveryType !== 'scheduled').length > 0 && (
          <div className="bg-white rounded-[28px] border border-neutral-100 shadow-sm overflow-hidden">
            <div className="bg-yellow-50/50 px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <div>
                  <h2 className="font-bold text-neutral-900 text-sm md:text-base">Quick Delivery</h2>
                  <p className="text-[10px] md:text-xs text-neutral-500 font-medium">Delivery in 15-20 mins</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-neutral-900">
                  ₹{cart.items
                    .filter(i => i.deliveryType !== 'scheduled')
                    .reduce((acc, i) => acc + calculateProductPrice(i.product, i.variant).displayPrice * i.quantity, 0)
                    .toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div className="divide-y divide-neutral-50">
              {cart.items
                .filter(i => i.deliveryType !== 'scheduled')
                .map((item) => {
                  const { displayPrice, mrp, hasDiscount } = calculateProductPrice(item.product, item.variant);
                  return (
                    <div key={item.product.id} className="p-4 md:p-5 flex gap-4 hover:bg-neutral-50/30 transition-colors">
                      <div className="w-16 h-16 bg-neutral-100 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-neutral-900 line-clamp-1">{item.product.name}</h3>
                        <p className="text-[10px] text-neutral-500 mb-2">{item.product.pack}</p>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-neutral-900">₹{displayPrice}</span>
                            {hasDiscount && <span className="text-[10px] text-neutral-400 line-through">₹{mrp}</span>}
                          </div>
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 bg-green-50 rounded-lg p-0.5 border border-green-100">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant)}
                              className="w-6 h-6 flex items-center justify-center text-green-700 font-bold hover:bg-white rounded-md transition-colors"
                            >
                              −
                            </button>
                            <span className="text-xs font-bold text-green-900 min-w-[1.25rem] text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant)}
                              className="w-6 h-6 flex items-center justify-center text-green-700 font-bold hover:bg-white rounded-md transition-colors"
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
        )}

        {/* Scheduled Delivery Section */}
        {cart.items.filter(i => i.deliveryType === 'scheduled').length > 0 && (
          <div className="bg-white rounded-[28px] border border-neutral-100 shadow-sm overflow-hidden">
            <div className="bg-blue-50/50 px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <div>
                  <h2 className="font-bold text-neutral-900 text-sm md:text-base">Scheduled Delivery</h2>
                  <p className="text-[10px] md:text-xs text-neutral-500 font-medium">Delivery in 1-2 days</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-neutral-900">
                  ₹{cart.items
                    .filter(i => i.deliveryType === 'scheduled')
                    .reduce((acc, i) => acc + calculateProductPrice(i.product, i.variant).displayPrice * i.quantity, 0)
                    .toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div className="divide-y divide-neutral-50">
              {cart.items
                .filter(i => i.deliveryType === 'scheduled')
                .map((item) => {
                  const { displayPrice, mrp, hasDiscount } = calculateProductPrice(item.product, item.variant);
                  return (
                    <div key={item.product.id} className="p-4 md:p-5 flex gap-4 hover:bg-neutral-50/30 transition-colors">
                      <div className="w-16 h-16 bg-neutral-100 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-neutral-900 line-clamp-1">{item.product.name}</h3>
                        <p className="text-[10px] text-neutral-500 mb-2">{item.product.pack}</p>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-neutral-900">₹{displayPrice}</span>
                            {hasDiscount && <span className="text-[10px] text-neutral-400 line-through">₹{mrp}</span>}
                          </div>
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 bg-green-50 rounded-lg p-0.5 border border-green-100">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant)}
                              className="w-6 h-6 flex items-center justify-center text-green-700 font-bold hover:bg-white rounded-md transition-colors"
                            >
                              −
                            </button>
                            <span className="text-xs font-bold text-green-900 min-w-[1.25rem] text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant)}
                              className="w-6 h-6 flex items-center justify-center text-green-700 font-bold hover:bg-white rounded-md transition-colors"
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
        )}
      </div>

      {/* Order Summary */}
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
            {cart.total < appConfig.freeDeliveryThreshold && (
              <div className="text-xs md:text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                Add ₹{(appConfig.freeDeliveryThreshold - cart.total).toLocaleString('en-IN')} more for free delivery
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
