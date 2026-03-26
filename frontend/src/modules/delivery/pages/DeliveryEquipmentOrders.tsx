import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getDeliveryEquipmentOrders,
  completeEquipmentDelivery,
} from "../../../services/api/delivery/deliveryEquipmentService";
import { useAuth } from "../../../context/AuthContext";

export default function DeliveryEquipmentOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getDeliveryEquipmentOrders();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch equipment deliveries", error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (orderId: string) => {
    if (!window.confirm("Confirm delivery completion?")) return;
    try {
      setCompleting(orderId);
      const response = await completeEquipmentDelivery(orderId);
      if (response.success) {
        alert("Delivery completed!");
        fetchOrders();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Operation failed");
    } finally {
      setCompleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <div className="bg-blue-600 text-white p-6 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold">Equipment Deliveries</h1>
        <p className="text-blue-100 text-xs">Packaging materials for Sellers</p>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="py-20 text-center text-neutral-400">Loading deliveries...</div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center text-3xl">📦</div>
            <p className="text-neutral-500 font-medium">No assigned equipment deliveries.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
                <div className="p-4 border-b border-neutral-50 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Equipment Order</span>
                    <h3 className="font-bold text-neutral-800">{order.orderNumber}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center flex-shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400 font-bold uppercase">Seller</div>
                      <div className="text-sm font-bold text-neutral-800">{order.seller?.sellerName || order.sellerName}</div>
                      <div className="text-xs text-neutral-500">{order.seller?.mobile || order.sellerPhone}</div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-teal-50 text-teal-600 rounded flex items-center justify-center flex-shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400 font-bold uppercase">Delivery Address</div>
                      <div className="text-sm text-neutral-700">{order.sellerAddress}</div>
                    </div>
                  </div>

                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                    <div className="text-[10px] text-neutral-400 font-bold uppercase mb-2">Items to Deliver</div>
                    <ul className="space-y-1">
                      {order.items.map((item: any, idx: number) => (
                        <li key={idx} className="text-xs text-neutral-700 flex items-center gap-2 py-1">
                          <div className="w-8 h-8 bg-white rounded border border-neutral-200 overflow-hidden flex-shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px]">📦</div>
                            )}
                          </div>
                          <div className="flex-1 flex justify-between">
                            <span>{item.name}</span>
                            <span className="font-bold text-neutral-800 text-sm">x {item.quantity}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {order.status !== 'delivered' && (
                  <div className="p-4 bg-blue-50/50 border-t border-blue-100 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">Payment Mode</span>
                        <span className={`text-[11px] font-black ${order.paymentMethod === 'COD' ? 'text-orange-600' : 'text-blue-600'}`}>
                          {order.paymentMethod === 'COD' ? '💸 CASH ON DELIVERY' : '💳 PAID ONLINE'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">Collect Amount</span>
                        <div className="text-lg font-black text-neutral-800">
                          {order.paymentMethod === 'COD' ? `₹${order.total}` : '₹0 (Paid)'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {order.status === 'assigned' ? (
                        <div className="flex flex-col w-full gap-3">
                           {order.estimatedCommission > 0 && (
                             <div className="flex items-center justify-between bg-teal-50 px-4 py-2 rounded-lg border border-teal-100">
                               <span className="text-[10px] font-black text-teal-600 uppercase">Expected Payout</span>
                               <span className="text-sm font-black text-teal-800">₹{order.estimatedCommission}</span>
                             </div>
                           )}
                           <Link
                             to="/delivery/scan"
                             state={{ 
                               expectedOrderId: order._id, 
                               mode: 'pickup', 
                               orderType: 'EQUIPMENT' 
                             }}
                             className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black shadow-lg shadow-blue-600/20 text-center transition-all active:scale-95"
                           >
                             START PICKUP
                           </Link>
                        </div>
                      ) : (
                        <div className="flex flex-col w-full gap-3">
                           {order.status === 'picked_up' && order.estimatedCommission > 0 && (
                             <div className="flex items-center justify-between bg-teal-50 px-4 py-2 rounded-lg border border-teal-100">
                               <span className="text-[10px] font-black text-teal-600 uppercase">Payout on Delivery</span>
                               <span className="text-sm font-black text-teal-800">₹{order.estimatedCommission}</span>
                             </div>
                           )}
                           {order.status === 'delivered' && order.earnedCommission > 0 && (
                             <div className="flex items-center justify-between bg-green-50 px-4 py-2 rounded-lg border border-green-100">
                               <span className="text-[10px] font-black text-green-600 uppercase">Earned Commission</span>
                               <span className="text-sm font-black text-green-800">₹{order.earnedCommission}</span>
                             </div>
                           )}
                           {order.status !== 'delivered' && (
                             <button
                               onClick={() => handleComplete(order._id)}
                               disabled={completing === order._id}
                               className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:bg-neutral-300"
                             >
                               {completing === order._id ? "PROCESSING..." : order.paymentMethod === 'COD' ? "COLLECT CASH & DELIVER" : "CONFIRM DELIVERY"}
                             </button>
                           )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
