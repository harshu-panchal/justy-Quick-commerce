import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useEquipmentCart } from '../../../context/EquipmentCartContext';
import { 
  createEquipmentOrder, 
  createEquipmentRazorpayOrder, 
  captureEquipmentPayment 
} from '../../../services/api/seller/sellerEquipmentService';
import GoogleMapsLocationPicker from '../../../components/GoogleMapsLocationPicker';

export default function SellerEquipmentCart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useEquipmentCart();
  
  const [step, setStep] = useState<1 | 2>(1); // 1: Items & Payment, 2: Address (actually 1: Cart, 2: Address)
  // Let's use 1: Cart Review, 2: Address & Payment
  
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Online' | 'COD'>('Online');
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  // Address State
  const [address, setAddress] = useState({
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
    landmark: '',
    latitude: user?.latitude ? parseFloat(user.latitude) : undefined,
    longitude: user?.longitude ? parseFloat(user.longitude) : undefined
  });
  
  // Load Razorpay Script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Map State
  const [showMap, setShowMap] = useState(false);
  const [tempLocation, setTempLocation] = useState<{lat: number, lng: number, addressObj?: any} | null>(null);

  const onLocationSelect = (lat: number, lng: number, addressObj?: any) => {
    setTempLocation({ lat, lng, addressObj });
  };

  const handleConfirmLocation = () => {
    if (tempLocation) {
        setAddress(prev => ({
            ...prev,
            address: tempLocation.addressObj?.street || prev.address,
            city: tempLocation.addressObj?.city || prev.city,
            state: tempLocation.addressObj?.state || prev.state,
            pincode: tempLocation.addressObj?.pincode || prev.pincode,
            landmark: tempLocation.addressObj?.landmark || prev.landmark,
            latitude: tempLocation.lat,
            longitude: tempLocation.lng
        }));
    }
    setShowMap(false);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (!address.address || !address.city || !address.pincode) {
      alert("Please provide a complete delivery address");
      setStep(2);
      return;
    }
    
    try {
      setProcessing(true);

      const items = cartItems.map(item => ({
        equipmentItem: item._id,
        quantity: item.quantity
      }));

      // 1. Create Order
      const orderRes = await createEquipmentOrder(items, paymentMethod, address);
      if (!orderRes.success) throw new Error(orderRes.message);

      const orderId = orderRes.data._id;
      const orderNum = orderRes.data.orderNumber;

      // 2. Handle COD
      if (paymentMethod === 'COD') {
        setPlacedOrderId(orderId);
        setOrderNumber(orderNum);
        clearCart();
        setShowOrderSuccess(true);
        return;
      }

      // 3. Handle Online Payment
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Failed to load Razorpay SDK. Please check your internet connection.");
        return;
      }

      const payRes = await createEquipmentRazorpayOrder(orderId);
      if (!payRes.success) throw new Error(payRes.message);

      const payData = payRes.data;

      const options = {
        key: payData.razorpayKey,
        amount: payData.amount,
        currency: "INR",
        name: "QuickCommerce Marketplace",
        description: `Order ${orderNum}`,
        order_id: payData.razorpayOrderId,
        handler: async (response: any) => {
          try {
            const captureRes = await captureEquipmentPayment({
              orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            if (captureRes.success) {
              setPlacedOrderId(orderId);
              setOrderNumber(orderNum);
              clearCart();
              setShowOrderSuccess(true);
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          } catch (err) {
            alert("Error verifying payment");
          }
        },
        prefill: {
          name: user?.sellerName || user?.name,
          email: user?.email,
          contact: user?.mobile
        },
        theme: { color: "#0d9488" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      alert(err.message || "Checkout failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleGoToOrders = () => {
    navigate('/seller/marketplace', { state: { activeTab: 'orders' } });
  };


  if (showOrderSuccess) {
    return (
      <div className="fixed inset-0 z-[70] bg-white flex flex-col items-center justify-center h-screen w-screen overflow-hidden">
        {/* Confetti Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-sm"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                backgroundColor: ["#0d9488", "#2dd4bf", "#f59e0b", "#ef4444", "#3b82f6"][Math.floor(Math.random() * 5)],
                animation: `confettiFall ${2 + Math.random() * 2}s linear ${Math.random() * 2}s infinite`,
                transform: `rotate(${Math.random() * 306}deg)`,
              } as any}
            />
          ))}
        </div>

        {/* Success Content */}
        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <div className="relative mb-8" style={{ animation: "scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both" }}>
            <div className="w-32 h-32 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center shadow-2xl">
              <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "checkDraw 0.5s ease-out 0.5s both" }}>
                <path d="M5 12l5 5L19 7" className="check-path" />
              </svg>
            </div>
          </div>

          <h2 className="text-3xl font-black text-teal-900 mb-2" style={{ animation: "slideUp 0.5s ease-out 0.6s both" }}>Order Placed!</h2>
          <p className="text-neutral-500 font-bold mb-1" style={{ animation: "slideUp 0.5s ease-out 0.7s both" }}>Order ID: {orderNumber}</p>
          <p className="text-neutral-400 text-sm mb-12" style={{ animation: "slideUp 0.5s ease-out 0.8s both" }}>Your marketplace order has been placed successfully.</p>

          <div className="flex flex-col gap-3 w-full max-w-xs" style={{ animation: "slideUp 0.5s ease-out 0.9s both" }}>
            <button 
              onClick={handleGoToOrders}
              className="w-full py-4 bg-teal-600 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 hover:bg-teal-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10H3M21 6H3M21 14H3M21 18H3"/></svg>
              TRACK ORDER
            </button>
            <button 
              onClick={() => navigate('/seller/marketplace')}
              className="w-full py-4 bg-white text-neutral-600 font-bold rounded-2xl border-2 border-neutral-100 hover:bg-neutral-50 transition-all"
            >
              BACK TO MARKETPLACE
            </button>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          @keyframes checkDraw { 0% { stroke-dasharray: 100; stroke-dashoffset: 100; } 100% { stroke-dasharray: 100; stroke-dashoffset: 0; } }
          @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes confettiFall { 0% { translateY(-10vh) rotate(0deg); opacity: 1; } 100% { translateY(110vh) rotate(720deg); opacity: 0; } }
          .check-path { stroke-dasharray: 100; stroke-dashoffset: 0; }
        `}</style>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-neutral-800 mb-2">Your cart is empty</h2>
        <p className="text-neutral-500 mb-6 text-center max-w-xs">Looks like you haven't added any packaging materials yet.</p>
        <button 
          onClick={() => navigate('/seller/marketplace')}
          className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-lg"
        >
          Go to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 h-[100%]">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => step === 1 ? navigate(-1) : setStep(1)} className="p-2 hover:bg-neutral-100 rounded-full">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1 className="text-2xl font-bold text-neutral-800">
            {step === 1 ? 'Checkout' : 'Delivery & Payment'}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {step === 1 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
               <div className="p-4 border-b border-neutral-50 bg-neutral-50/50 flex justify-between items-center">
                 <h2 className="font-bold text-neutral-700">Order Items ({cartItems.length})</h2>
                 <button onClick={() => setStep(2)} className="text-teal-600 font-bold text-xs uppercase tracking-widest">Next: Address &rarr;</button>
               </div>
               <div className="divide-y divide-neutral-50">
                 {cartItems.map((item) => (
                   <div key={item._id} className="p-4 flex gap-4">
                     <div className="w-20 h-20 bg-neutral-50 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-100">
                       <img src={item.imageUrl || '/assets/placeholder.png'} alt={item.name} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <h3 className="font-bold text-neutral-800 truncate">{item.name}</h3>
                       <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{item.description}</p>
                       <div className="mt-3 flex items-center justify-between">
                         <div className="flex flex-col">
                           <div className="text-teal-600 font-bold">₹{item.price}</div>
                           {item.minQuantity > 1 && (
                             <span className="text-[9px] text-orange-600 font-black uppercase italic">Min. Requirement: {item.minQuantity}</span>
                           )}
                         </div>
                         <div className="flex items-center bg-neutral-100 rounded-lg h-9 px-1">
                           <button 
                             onClick={() => updateQuantity(item._id, item.quantity - 1)}
                             className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-md transition-colors"
                           >
                             -
                           </button>
                           <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                           <button 
                             onClick={() => updateQuantity(item._id, item.quantity + 1)}
                             className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-md transition-colors text-teal-600"
                           >
                             +
                           </button>
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          ) : (
            <div className="space-y-4">
                {/* Address Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-neutral-800">Delivery Address</h2>
                        <button 
                            onClick={() => setShowMap(true)}
                            className="bg-teal-50 text-teal-600 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 border border-teal-100"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            USE MAP
                        </button>
                    </div>

                    <div className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-neutral-400 uppercase mb-1.5 ml-1">Flat / House / Office No.</label>
                                <input 
                                    type="text" 
                                    value={address.address}
                                    onChange={(e) => setAddress({...address, address: e.target.value})}
                                    className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-teal-500 outline-none transition-all"
                                    placeholder="Enter full address"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-neutral-400 uppercase mb-1.5 ml-1">Landmark (Optional)</label>
                                <input 
                                    type="text" 
                                    value={address.landmark}
                                    onChange={(e) => setAddress({...address, landmark: e.target.value})}
                                    className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-teal-500 outline-none transition-all"
                                    placeholder="Near XYZ school..."
                                />
                            </div>
                         </div>
                         <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 md:gap-8">
                            <div className="lg:col-span-2">
                                <label className="block text-[10px] font-black text-neutral-400 uppercase mb-1.5 ml-1">City</label>
                                <input 
                                    type="text" 
                                    value={address.city}
                                    onChange={(e) => setAddress({...address, city: e.target.value})}
                                    className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-teal-500 outline-none transition-all"
                                    placeholder="City"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-neutral-400 uppercase mb-1.5 ml-1">Pincode</label>
                                <input 
                                    type="text" 
                                    value={address.pincode}
                                    onChange={(e) => setAddress({...address, pincode: e.target.value})}
                                    className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-teal-500 outline-none transition-all"
                                    placeholder="400001"
                                />
                            </div>
                         </div>
                    </div>
                </div>

                {/* Payment Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden p-6">
                    <h2 className="text-lg font-bold text-neutral-800 mb-6">Payment Method</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            onClick={() => setPaymentMethod('Online')}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${paymentMethod === 'Online' ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-neutral-100 text-neutral-500 hover:border-neutral-200'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === 'Online' ? 'bg-teal-600 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                                </div>
                                <div className="text-left leading-tight">
                                    <div className="font-bold text-xs uppercase tracking-tight">Online</div>
                                    <div className="text-[9px] opacity-70">Razorpay</div>
                                </div>
                            </div>
                            {paymentMethod === 'Online' && (
                                <div className="w-4 h-4 bg-teal-600 rounded-full flex items-center justify-center">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                                </div>
                            )}
                        </button>

                        <button
                            onClick={() => setPaymentMethod('COD')}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${paymentMethod === 'COD' ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-neutral-100 text-neutral-500 hover:border-neutral-200'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === 'COD' ? 'bg-teal-600 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                                </div>
                                <div className="text-left leading-tight">
                                    <div className="font-bold text-xs uppercase tracking-tight">COD</div>
                                    <div className="text-[9px] opacity-70">Pay on delivery</div>
                                </div>
                            </div>
                            {paymentMethod === 'COD' && (
                                <div className="w-4 h-4 bg-teal-600 rounded-full flex items-center justify-center">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </div>
          )}
        </div>

        {/* Sidebar: Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 sticky top-24">
            <h2 className="text-lg font-bold text-neutral-800 mb-6">Order Summary</h2>
            
            <div className="space-y-3 pt-6">
              <div className="flex justify-between text-neutral-500 text-sm">
                <span>Items Subtotal</span>
                <span>₹{cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span>
              </div>
              <div className="flex justify-between text-neutral-500 text-sm">
                <span>Total Delivery Charge</span>
                <span>₹{cartItems.reduce((sum, item) => sum + ((item.deliveryCharge || 0) * item.quantity), 0)}</span>
              </div>
              <div className="flex justify-between text-neutral-500 text-sm">
                <span>Total Platform Fee</span>
                <span>₹{cartItems.reduce((sum, item) => sum + ((item.platformFee || 0) * item.quantity), 0)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 mt-2 border-t border-dashed border-neutral-100 font-black text-xl text-neutral-800">
                <span>Total</span>
                <span className="text-teal-700">₹{cartTotal}</span>
              </div>
            </div>

            {step === 1 ? (
                <button
                    onClick={() => setStep(2)}
                    className="w-full mt-8 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black shadow-lg shadow-teal-600/20 transition-all transform active:scale-95"
                >
                    SELECT ADDRESS &rarr;
                </button>
            ) : (
                <button
                    onClick={handleCheckout}
                    disabled={processing}
                    className={`w-full mt-8 py-4 rounded-xl font-black text-white shadow-xl transition-all transform active:scale-95 ${processing ? 'bg-neutral-400 cursor-not-allowed' : 'bg-gradient-to-r from-teal-600 to-teal-800 hover:shadow-2xl'}`}
                >
                    {processing ? 'UPLOADING...' : `CONFIRM ₹${cartTotal}`}
                </button>
            )}

            <p className="text-[10px] text-neutral-400 text-center mt-4 font-medium leading-relaxed uppercase tracking-tighter">
                Secure transaction with end-to-end encryption.
            </p>
          </div>
        </div>
      </div>

      {/* Map Picker Modal */}
      {showMap && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-10">
            <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center bg-neutral-50">
                    <h3 className="font-black text-neutral-800 uppercase tracking-tight">Pick Delivery Location</h3>
                    <button onClick={() => setShowMap(false)} className="p-2 hover:bg-neutral-200 rounded-full transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                </div>
                
                <div className="flex-1 relative min-h-[300px]">
                    <GoogleMapsLocationPicker
                        initialLat={address.latitude || user?.latitude || 20.5937}
                        initialLng={address.longitude || user?.longitude || 78.9629}
                        onLocationSelect={onLocationSelect}
                        height="100%"
                    />
                </div>

                <div className="p-6 bg-white border-t space-y-4">
                    <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
                        <p className="text-[10px] font-black text-teal-600 uppercase mb-1">Current Selection</p>
                        <p className="text-sm font-bold text-neutral-700 line-clamp-2 leading-tight">
                            {tempLocation?.addressObj?.street || "Move the pin to select address..."}
                        </p>
                    </div>
                    <button
                        onClick={handleConfirmLocation}
                        className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black shadow-xl shadow-teal-600/20 transition-all active:scale-95"
                    >
                        CONFIRM THIS LOCATION
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
