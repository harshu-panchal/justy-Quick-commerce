import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useEquipmentCart } from '../../../context/EquipmentCartContext';
import { 
  getSellerEquipmentItems, 
  getSellerEquipmentOrders,
  cancelEquipmentOrder,
  EquipmentItem,
  EquipmentOrder
} from '../../../services/api/seller/sellerEquipmentService';

export default function SellerEquipmentShop() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { cart, cartTotal, addToCart, removeFromCart, cartItems } = useEquipmentCart();
  
  const [activeTab, setActiveTab] = useState<'shop' | 'orders'>('shop');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [orders, setOrders] = useState<EquipmentOrder[]>([]);

  // Cancellation State
  const [cancelModal, setCancelModal] = useState<EquipmentOrder | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [refundMethod, setRefundMethod] = useState<"Wallet" | "Bank">("Wallet");
  const [processing, setProcessing] = useState(false);

  const [refundModal, setRefundModal] = useState<EquipmentOrder | null>(null);
  const [refundMode, setRefundMode] = useState<'bank' | 'upi'>('bank');
  const [useSaved, setUseSaved] = useState(true);
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: user?.accountName || user?.sellerName || "",
    accountNumber: user?.accountNumber || "",
    ifscCode: user?.ifsc || "",
    upiId: user?.upiId || ""
  });

  // Reset bank details when modal opens or user profile changes
  useEffect(() => {
    if (refundModal) {
        const hasBank = !!user?.accountNumber;
        const hasUPI = !!user?.upiId;
        
        // If nothing is saved, force "New Details" mode (useSaved = false)
        if (!hasBank && !hasUPI) {
            setUseSaved(false);
        } else {
            setUseSaved(true);
        }

        setBankDetails({
            accountHolderName: user?.accountName || user?.sellerName || "",
            accountNumber: user?.accountNumber || "",
            ifscCode: user?.ifsc || "",
            upiId: user?.upiId || ""
        });
        
        // Default to UPI if bank is missing but UPI exists
        if (!hasBank && hasUPI) {
            setRefundMode('upi');
        } else {
            setRefundMode('bank');
        }
    }
  }, [refundModal, user]);

  // Effect to handle navigation state if we come from Checkout
  useEffect(() => {
    if (location.state && (location.state as any).activeTab) {
      setActiveTab((location.state as any).activeTab);
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, ordersRes] = await Promise.all([
        getSellerEquipmentItems(),
        getSellerEquipmentOrders()
      ]);
      
      if (itemsRes.success) setItems(itemsRes.data);
      if (ordersRes.success) setOrders(ordersRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Pre-fill bank details from user profile when refund modal opens
  useEffect(() => {
    if (refundModal && user) {
        setBankDetails({
            accountHolderName: (user as any).accountName || "",
            accountNumber: (user as any).accountNumber || "",
            ifscCode: (user as any).ifsc || "",
            upiId: (user as any).upiId || ""
        });
    }
  }, [refundModal, user]);

  const handleCancelOrder = async () => {
    if (!cancelModal || !cancelReason) return;
    try {
      setProcessing(true);
      const res = await cancelEquipmentOrder(cancelModal._id, cancelReason);
      if (res.success) {
        alert(res.message);
        setCancelModal(null);
        setCancelReason("");
        fetchData();
        
        // If it was a paid order, immediately prompt for refund details
        if (cancelModal.paymentStatus === 'Paid') {
            setRefundModal(cancelModal);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Cancellation failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestRefund = async () => {
      if (!refundModal) return;
      
      const details: any = {
          accountHolderName: bankDetails.accountHolderName
      };
      
      if (refundMode === 'bank') {
          if (!bankDetails.accountNumber || !bankDetails.ifscCode) {
              alert("Please fill in all required bank details");
              return;
          }
          details.accountNumber = bankDetails.accountNumber;
          details.ifscCode = bankDetails.ifscCode;
      } else {
          if (!bankDetails.upiId) {
              alert("Please fill in your UPI ID");
              return;
          }
          details.upiId = bankDetails.upiId;
          // Note: Backend now supports optional bank fields, 
          // but we'll send empty strings or placeholders if needed by older clients
          details.accountNumber = "UPI_DESTINATION";
          details.ifscCode = "UPI0000000";
      }

      try {
          setProcessing(true);
          const { requestEquipmentRefund } = await import('../../../services/api/seller/sellerEquipmentService');
          const res = await requestEquipmentRefund(refundModal._id, details);
          if (res.success) {
              alert("Refund request submitted successfully! You can track the status in your purchase history.");
              setRefundModal(null);
              fetchData();
          }
      } catch (err: any) {
          alert(err.response?.data?.message || "Refund request failed");
      } finally {
          setProcessing(false);
      }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-600',
      'approved': 'bg-green-100 text-green-600',
      'rejected': 'bg-red-100 text-red-600',
      'cancelled': 'bg-neutral-100 text-neutral-500',
      'assigned': 'bg-blue-100 text-blue-600',
      'delivered': 'bg-teal-100 text-teal-600',
      'refunded': 'bg-orange-100 text-orange-600'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${colors[status] || 'bg-neutral-100'}`}>
        {status === 'approved' ? 'ACCEPTED' : status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header Info */}
      <div className="bg-teal-700 text-white p-6 -mx-3 -mt-3 sm:-mx-4 sm:-mt-4 md:-mx-6 md:-mt-6 shadow-md">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-black tracking-tight">EQUIPMENT MARKETPLACE</h1>
          <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold border border-white/20">
            Seller Portal
          </div>
        </div>
        <p className="text-teal-100 text-xs">Purchase packaging materials for your business.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-neutral-200 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex-1 py-4 text-sm font-black transition-all ${activeTab === 'shop' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/30' : 'text-neutral-400'}`}
        >
          🛒 MARKETPLACE
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-4 text-sm font-black transition-all ${activeTab === 'orders' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/30' : 'text-neutral-400'}`}
        >
          📋 MY PURCHASES
        </button>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
             <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-neutral-400 font-bold text-sm">Loading inventory...</p>
          </div>
        ) : activeTab === 'shop' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
        {items.map((item: any) => (
          <div key={item._id} className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="w-full h-32 bg-neutral-50 flex items-center justify-center overflow-hidden border-b border-neutral-100 relative">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                    )}
                    {item.stock === 0 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-widest">Out of Stock</div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-bold text-neutral-800 leading-tight">{item.name}</h3>
                      <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                       <div className="flex flex-col">
                         <div className="flex items-center justify-between mb-2">
                            <div className="text-teal-600 font-bold block">₹{item.price}</div>
                            {item.minQuantity > 1 && (
                              <div className="text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border border-orange-100">
                                 Min Qty: {item.minQuantity}
                              </div>
                            )}
                         </div>
                         <span className={`text-[9px] font-bold ${item.stock < 10 ? 'text-red-500' : 'text-neutral-400'}`}>
                           {item.stock} left
                         </span>
                          {(item.deliveryCharge > 0 || item.platformFee > 0) && (
                            <div className="text-[8px] text-neutral-400 mt-0.5">
                              {item.deliveryCharge > 0 && <span>+₹{item.deliveryCharge} Delivery </span>}
                              {item.platformFee > 0 && <span>+₹{item.platformFee} Platform Fee</span>}
                            </div>
                          )}
                        </div>
                       <div className="flex items-center gap-2">
                         {cart[item._id] ? (
                           <div className="flex items-center bg-teal-50 rounded-lg p-0.5 border border-teal-100">
                             <button 
                               onClick={() => removeFromCart(item._id)} 
                               className="w-8 h-8 flex items-center justify-center text-teal-600 font-bold hover:bg-white rounded-md transition-colors"
                             >-</button>
                             <span className="w-8 text-center text-sm font-bold text-teal-700">{cart[item._id]}</span>
                             <button 
                               onClick={() => addToCart(item)} 
                               disabled={cart[item._id] >= item.stock}
                               className="w-8 h-8 flex items-center justify-center text-teal-600 font-bold hover:bg-white rounded-md transition-colors disabled:opacity-30"
                             >+</button>
                           </div>
                         ) : (
                           <button 
                            onClick={() => addToCart(item)}
                            disabled={item.stock === 0}
                            className="px-6 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-600/20 active:scale-95 transition-all disabled:bg-neutral-200 disabled:shadow-none"
                           >
                             ADD
                           </button>
                         )}
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Float Cart Button */}
            {cartItems.length > 0 && (activeTab === 'shop') && (
              <div className="fixed bottom-24 left-4 right-4 animate-in slide-in-from-bottom-6 duration-500">
                <button
                  onClick={() => navigate('/seller/marketplace/cart')}
                  className="w-full bg-teal-700 text-white p-5 rounded-2xl shadow-2xl flex justify-between items-center font-bold ring-4 ring-white/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-lg relative">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 1 2-1.61L23 6H6"/></svg>
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center shadow-sm">{cartItems.length}</span>
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] opacity-70 uppercase tracking-tighter">View Your Cart</div>
                      <div className="text-lg">₹{cartTotal}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl group">
                    CHECKOUT
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="py-20 text-center">
                 <div className="text-4xl mb-3">📄</div>
                 <p className="text-neutral-400 font-bold">No purchase history found.</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order._id} className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex flex-col gap-4 relative overflow-hidden group">
                  {/* Status Strip */}
                  <div className="absolute top-0 right-0 h-1 w-24 bg-teal-600 hidden group-hover:block transition-all" />
                  
                  <div className="flex justify-between items-start border-b border-neutral-50 pb-4">
                    <div>
                      <div className="text-[10px] text-neutral-400 uppercase font-black tracking-widest flex items-center gap-2">
                        {order.orderNumber}
                        {order.paymentStatus === 'Refunded' && <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded text-[8px]">REFUNDED</span>}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-1 font-medium">{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(order.status)}
                      <div className="flex gap-1.5 items-center">
                        <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black tracking-tighter ${order.paymentMethod === 'COD' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                          {order.paymentMethod ? order.paymentMethod.toUpperCase() : 'ONLINE'}
                        </span>
                        <span className={`text-[10px] font-black ${order.paymentStatus === 'Paid' ? 'text-teal-600' : order.paymentStatus === 'Refunded' ? 'text-orange-500' : 'text-neutral-400'}`}>
                          {order.paymentStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rejection/Cancellation/Refund Box */}
                  {(order.status === 'rejected' || order.status === 'cancelled') && (
                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex flex-col gap-3">
                       <div className="flex gap-3 items-start">
                         <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">⚠️</div>
                         <div className="flex-1">
                           <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">{order.status === 'rejected' ? 'REJECTION REASON' : 'CANCELLATION REASON'}</p>
                           <p className="text-xs text-neutral-800 font-bold italic mt-0.5">"{order.rejectionReason || order.cancellationReason || 'No reason provided'}"</p>
                         </div>
                       </div>
                       
                       {order.paymentStatus === 'Paid' && order.refundStatus === 'NONE' && (
                          <div className="mt-2 p-3 bg-teal-50 rounded-xl border border-teal-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                             <div>
                                <div className="text-[10px] text-teal-600 font-black uppercase tracking-widest">Action Required</div>
                                <div className="text-[11px] text-teal-800 font-bold">This order is eligible for a refund.</div>
                             </div>
                             <button 
                              onClick={() => setRefundModal(order)}
                              className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 text-white text-[10px] font-black rounded-xl shadow-lg shadow-teal-600/20 active:scale-95 transition-all hover:bg-teal-700 uppercase tracking-widest"
                             >
                                 Request Bank Refund
                             </button>
                          </div>
                       )}

                       {(order.refundStatus === 'PENDING' || order.refundStatus === 'APPROVED') && (
                          <div className="mt-2 p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-center gap-3">
                             <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
                             <div>
                                <div className="text-[10px] text-orange-600 font-black uppercase tracking-widest">Refund Status: Initiated</div>
                                <div className="text-[11px] text-orange-800 font-bold">Your refund is being processed. It will reflect in your account soon.</div>
                             </div>
                          </div>
                       )}
                       
                       {order.paymentStatus === 'Refunded' || order.refundStatus === 'REFUNDED' ? (
                          <div className="mt-2 p-3 bg-green-50 rounded-xl border border-green-100 flex items-center gap-3">
                             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                             <div>
                                <div className="text-[10px] text-green-600 font-black uppercase tracking-widest">Refund Status: Completed</div>
                                <div className="text-[11px] text-green-800 font-bold">Refund has been credited to your account.</div>
                             </div>
                          </div>
                       ) : null}
                    </div>
                  )}

                  <div className="space-y-3">
                    {order.items.map((it: any, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-50 rounded-lg border border-neutral-100 flex-shrink-0 flex items-center justify-center p-1">
                          {it.imageUrl ? (
                            <img src={it.imageUrl} alt={it.name} className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-lg">📦</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-neutral-700 font-bold">{it.name} <span className="text-neutral-400">x{it.quantity}</span></span>
                            <span className="text-neutral-800 font-black tracking-tighter">₹{it.subtotal}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 pt-4 border-t border-dashed border-neutral-100 flex justify-between items-end">
                    <div>
                        {order.deliveryBoy ? (
                           <div className="flex items-center gap-2">
                             <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center text-xs text-teal-600">🚚</div>
                             <div>
                               <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Partner Assigned</div>
                               <div className="text-[11px] text-teal-700 font-bold">{order.deliveryBoy.name}</div>
                             </div>
                           </div>
                        ) : (order.status === 'pending' || order.status === 'approved' || order.status === 'paid') && (
                           <button 
                            onClick={() => setCancelModal(order)}
                            className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors flex items-center gap-1.5"
                           >
                             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                             Cancel Order
                           </button>
                        )}
                    </div>
                    <div className="text-right">
                       <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Order Amount</div>
                       <div className="text-lg font-black text-teal-800">₹{order.total}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Cancel Order Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
           <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in duration-300">
              <div className="p-8">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </div>
                <h3 className="text-xl font-black text-neutral-800 mb-2">Cancel Order?</h3>
                <p className="text-sm text-neutral-500 mb-6">Are you sure you want to cancel <span className="font-bold text-neutral-800">{cancelModal.orderNumber}</span>? This action cannot be undone.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-black text-neutral-500 uppercase mb-2">Reason for Cancellation</label>
                    <select 
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-neutral-100 rounded-xl focus:border-red-500 outline-none text-sm bg-neutral-50 font-bold"
                    >
                      <option value="">-- Select a reason --</option>
                      <option value="Ordered by mistake">Ordered by mistake</option>
                      <option value="Found better price elsewhere">Found better price elsewhere</option>
                      <option value="Long delivery time">Long delivery time</option>
                      <option value="Want to change payment method">Want to change payment method</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-8">
                  <button
                    onClick={handleCancelOrder}
                    disabled={!cancelReason || processing}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black shadow-lg shadow-red-600/20 disabled:bg-neutral-200 disabled:shadow-none transition-all active:scale-95"
                  >
                    {processing ? "PROCESSING..." : "YES, CANCEL ORDER"}
                  </button>
                  <button
                    onClick={() => setCancelModal(null)}
                    className="w-full py-4 text-neutral-400 font-bold hover:text-neutral-600 transition-colors"
                  >
                    CLOSE
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Refund Request Modal */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
           <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in duration-300 border-t-8 border-teal-600">
              <div className="p-8">
                 <h3 className="text-xl font-black text-neutral-800 mb-1">Refund Destination</h3>
                 <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mb-6">Order: {refundModal.orderNumber} • Amount: ₹{refundModal.total}</p>

                 {/* Selection Tabs */}
                 <div className="flex gap-2 mb-6 p-1 bg-neutral-100 rounded-2xl">
                    <button 
                        onClick={() => setRefundMode('bank')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${refundMode === 'bank' ? 'bg-white text-teal-600 shadow-sm' : 'text-neutral-400'}`}
                    >
                        Bank Account
                    </button>
                    <button 
                        onClick={() => setRefundMode('upi')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${refundMode === 'upi' ? 'bg-white text-teal-600 shadow-sm' : 'text-neutral-400'}`}
                    >
                        UPI ID
                    </button>
                 </div>

                 {/* Use Saved Toggle */}
                 {(refundMode === 'bank' ? user?.accountNumber : user?.upiId) && (
                    <div className="flex items-center justify-between mb-6 px-2 bg-teal-50/50 py-3 rounded-xl border border-teal-100/50">
                        <span className="text-[11px] font-bold text-teal-800">Use Saved Details from Profile?</span>
                        <button 
                            onClick={() => setUseSaved(!useSaved)}
                            className={`w-10 h-6 rounded-full transition-colors relative ${useSaved ? 'bg-teal-600' : 'bg-neutral-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${useSaved ? 'right-1' : 'left-1'}`} />
                        </button>
                    </div>
                 )}

                 <div className="space-y-4">
                    <div>
                       <label className="block text-[10px] font-black text-neutral-500 uppercase mb-1">Account Holder Name *</label>
                       <input 
                        type="text"
                        value={bankDetails.accountHolderName}
                        onChange={(e) => !useSaved && setBankDetails({...bankDetails, accountHolderName: e.target.value})}
                        readOnly={useSaved}
                        placeholder="Name on account"
                        className={`w-full px-4 py-3 border-2 border-neutral-100 rounded-xl focus:border-teal-600 outline-none text-sm font-bold ${useSaved ? 'bg-neutral-100 text-neutral-500' : 'bg-neutral-50'}`}
                       />
                    </div>

                    {refundMode === 'bank' ? (
                       <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-[10px] font-black text-neutral-500 uppercase mb-1">Account Number *</label>
                                <input 
                                  type="text"
                                  value={bankDetails.accountNumber}
                                  onChange={(e) => !useSaved && setBankDetails({...bankDetails, accountNumber: e.target.value})}
                                  readOnly={useSaved}
                                  placeholder="A/C Number"
                                  className={`w-full px-4 py-3 border-2 border-neutral-100 rounded-xl focus:border-teal-600 outline-none text-sm font-bold ${useSaved ? 'bg-neutral-100 text-neutral-500' : 'bg-neutral-50'}`}
                                />
                             </div>
                             <div>
                                <label className="block text-[10px] font-black text-neutral-500 uppercase mb-1">IFSC Code *</label>
                                <input 
                                  type="text"
                                  value={bankDetails.ifscCode}
                                  onChange={(e) => !useSaved && setBankDetails({...bankDetails, ifscCode: e.target.value.toUpperCase()})}
                                  readOnly={useSaved}
                                  placeholder="IFSC"
                                  className={`w-full px-4 py-3 border-2 border-neutral-100 rounded-xl focus:border-teal-600 outline-none text-sm font-bold ${useSaved ? 'bg-neutral-100 text-neutral-500' : 'bg-neutral-50'}`}
                                />
                             </div>
                          </div>
                       </div>
                    ) : (
                       <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-[10px] font-black text-neutral-500 uppercase mb-1">UPI ID *</label>
                          <input 
                            type="text"
                            value={bankDetails.upiId}
                            onChange={(e) => !useSaved && setBankDetails({...bankDetails, upiId: e.target.value})}
                            readOnly={useSaved}
                            placeholder="e.g. name@upi"
                            className={`w-full px-4 py-3 border-2 border-neutral-100 rounded-xl focus:border-teal-600 outline-none text-sm font-bold ${useSaved ? 'bg-neutral-100 text-neutral-500' : 'bg-neutral-50'}`}
                          />
                       </div>
                    )}

                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 mt-4">
                       <p className="text-[10px] text-orange-700 font-bold leading-relaxed italic">
                        Note: Manual bank transfer may take up to 3-5 business days. 
                        {useSaved ? " Details pulled from your profile." : " These details will be saved for this request only."}
                       </p>
                    </div>
                 </div>

                 <div className="flex flex-col gap-3 mt-8">
                    <button
                      onClick={handleRequestRefund}
                      disabled={processing || (refundMode === 'bank' && (!bankDetails.accountNumber || !bankDetails.ifscCode)) || (refundMode === 'upi' && !bankDetails.upiId)}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-xl font-black shadow-lg shadow-teal-600/20 disabled:bg-neutral-200 transition-all active:scale-95"
                    >
                      {processing ? "SUBMITTING..." : "CONFIRM & REQUEST REFUND"}
                    </button>
                    <button
                      onClick={() => setRefundModal(null)}
                      className="w-full py-2 text-neutral-400 font-bold hover:text-neutral-600 text-sm transition-colors"
                    >
                      DO IT LATER
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
