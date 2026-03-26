import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getAdminEquipmentOrders,
  getDeliveryBoys,
  assignDeliveryBoy,
  approveEquipmentOrder,
  rejectEquipmentOrder,
  regenerateEquipmentQR,
  type EquipmentOrder,
} from "../../../services/api/admin/adminEquipmentService";
import { useAuth } from "../../../context/AuthContext";
import InvoiceModal from "../../../components/Invoice/InvoiceModal";
import { OrderDetail } from "../../../services/api/orderService";
import { io } from "socket.io-client";
import { getSocketBaseURL } from "../../../services/api/config";

export default function AdminEquipmentOrders() {
  const { isAuthenticated, token } = useAuth();
  const [orders, setOrders] = useState<EquipmentOrder[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assignment & Action State
  const [selectedOrder, setSelectedOrder] = useState<EquipmentOrder | null>(null);
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState("");
  const [assigning, setAssigning] = useState(false);
  
  const [rejectionModal, setRejectionModal] = useState<EquipmentOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [refundMethod, setRefundMethod] = useState<"Wallet" | "Bank">("Wallet");
  const [processing, setProcessing] = useState(false);
  
  // Invoice & QR States
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<OrderDetail | null>(null);
  const [isRegeneratingQR, setIsRegeneratingQR] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchData();

      // Setup socket listener for real-time updates
      const socketUrl = getSocketBaseURL();
      const socket = io(socketUrl, {
        auth: { token },
        transports: ["websocket", "polling"],
      });

      socket.on("connect", () => {
        socket.emit("join-admin-room");
      });

      socket.on("equipment-order-update", (data) => {
        console.log("Real-time equipment update received:", data);
        fetchData();
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isAuthenticated, token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, boysRes] = await Promise.all([
        getAdminEquipmentOrders(),
        getDeliveryBoys()
      ]);
      
      if (ordersRes.success) setOrders(ordersRes.data);
      if (boysRes.success) setDeliveryBoys(boysRes.data);
    } catch (err: any) {
      setError("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedOrder || !selectedDeliveryBoy) return;
    try {
      setAssigning(true);
      const response = await assignDeliveryBoy(selectedOrder._id, selectedDeliveryBoy);
      if (response.success) {
        alert("Delivery boy assigned!");
        setSelectedOrder(null);
        setSelectedDeliveryBoy("");
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!window.confirm("Approve this order?")) return;
    try {
      setProcessing(true);
      const res = await approveEquipmentOrder(id);
      if (res.success) {
        alert("Order Approved!");
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Approval failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionModal || !rejectionReason) return;
    try {
      setProcessing(true);
      const res = await rejectEquipmentOrder(rejectionModal._id, rejectionReason);
      if (res.success) {
        alert(res.message);
        setRejectionModal(null);
        setRejectionReason("");
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Rejection failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleRegenerateQR = async (id: string) => {
    if (isRegeneratingQR) return;
    try {
      setIsRegeneratingQR(true);
      const res = await regenerateEquipmentQR(id);
      if (res.success) {
        alert("QR Regenerated!");
        fetchData();
      }
    } catch (err: any) {
      alert("Failed to regenerate QR");
    } finally {
      setIsRegeneratingQR(false);
    }
  };

  const openInvoice = (order: EquipmentOrder) => {
    // Transformer EquipmentOrder to OrderDetail for the InvoiceModal
    const orderDetail: OrderDetail = {
      id: order._id,
      invoiceNumber: order.orderNumber || order._id.slice(-6).toUpperCase(),
      orderDate: order.createdAt || new Date().toISOString(),
      deliveryDate: order.createdAt || new Date().toISOString(), // Fallback
      timeSlot: 'Standard',
      status: (order.status as any) || 'Received',
      customerName: order.sellerName || 'N/A',
      customerEmail: order.seller?.email || 'N/A',
      customerPhone: order.sellerPhone || 'N/A',
      deliveryBoyName: order.deliveryBoy?.name || '',
      deliveryBoyPhone: order.deliveryBoy?.mobile || '',
      items: (order.items || []).map((item, idx) => ({
        srNo: (idx + 1).toString(),
        product: item.name || 'Unknown Item',
        soldBy: 'Admin Inventory',
        unit: 'N/A',
        price: item.price || 0,
        tax: 0,
        taxPercent: 0,
        qty: item.quantity || 1,
        subtotal: item.subtotal || 0
      })),
      subtotal: order.total || 0,
      tax: 0,
      grandTotal: order.total || 0,
      paymentMethod: 'Online', 
      paymentStatus: order.paymentStatus || 'Pending',
      deliveryAddress: {
        name: order.sellerName || 'N/A',
        phone: order.sellerPhone || 'N/A',
        address: order.deliveryAddress?.address || order.sellerAddress || 'No Address Provided',
        city: order.deliveryAddress?.city || '',
        state: order.deliveryAddress?.state || '',
        pincode: order.deliveryAddress?.pincode || ''
      },
      qrCodeUrl: order.qrCodeUrl
    };
    setInvoiceOrder(orderDetail);
    setIsInvoiceModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      cancelled: "bg-neutral-100 text-neutral-700",
      assigned: "bg-purple-100 text-purple-700",
      picked_up: "bg-blue-100 text-blue-700",
      delivered: "bg-teal-100 text-teal-700",
      refunded: "bg-orange-100 text-orange-700",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status] || "bg-gray-100 text-gray-700"}`}>
        {status === 'approved' ? 'ACCEPTED' : status}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-4 md:p-6 overflow-y-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-neutral-800">Equipment Orders</h1>
          <p className="text-xs text-neutral-500 mt-1">Live Equipment Marketplace Feed</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link to="/admin/equipment/refunds" className="w-full sm:w-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black rounded-lg shadow-sm text-center">
            MANAGE BANK REFUNDS
          </Link>
          <div className="text-xs hidden md:block">
            <Link to="/admin" className="text-blue-600 hover:underline">Dashboard</Link>
            <span className="mx-2 text-neutral-400">/</span>
            <span className="text-neutral-500">Equipment Orders</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="bg-teal-700 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Live Order Stream</h2>
          {processing && <div className="text-xs animate-pulse bg-white/20 px-2 py-1 rounded">Processing Action...</div>}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-neutral-500">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">No equipment orders found.</div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-50 text-[11px] font-bold text-neutral-500 uppercase">
                  <th className="p-4 border-b">Order Detail</th>
                  <th className="p-4 border-b">Seller Info</th>
                  <th className="p-4 border-b">Inventory Items</th>
                  <th className="p-4 border-b text-center">Total</th>
                  <th className="p-4 border-b text-center">Lifecycle</th>
                  <th className="p-4 border-b text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((order: any) => (
                  <tr key={order._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-neutral-800">{order.orderNumber}</span>
                        <div className="flex gap-1.5 items-center">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter ${order.paymentMethod === 'COD' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                            {order.paymentMethod}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-neutral-700">{order.sellerName}</div>
                      <div className="text-xs text-neutral-500">{order.sellerPhone}</div>
                      <div className="text-[10px] text-neutral-400 mt-1 max-w-[180px] break-words line-clamp-1" title={order.sellerAddress}>
                        {order.sellerAddress}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="space-y-1">
                        {order.items.map((it: any, idx: any) => (
                          <div key={idx} className="flex items-center gap-2 text-[11px]">
                            <span className="text-neutral-400 font-bold w-4">{it.quantity}x</span>
                            <span className="text-neutral-700 truncate max-w-[150px]">{it.name}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 align-top text-center">
                       <div className="font-black text-teal-800">₹{order.total}</div>
                       {order.refundStatus === 'REFUNDED' && <div className="text-[9px] text-green-600 font-bold uppercase mt-1 italic">Refunded</div>}
                       {order.refundStatus === 'PENDING' && <div className="text-[9px] text-orange-500 font-bold uppercase mt-1 animate-pulse">Refund Pending</div>}
                    </td>
                    <td className="p-4 align-top text-center space-y-2">
                       {getStatusBadge(order.status)}
                       <div className={`text-[10px] font-black uppercase ${order.paymentStatus === 'Paid' ? 'text-green-600' : order.paymentStatus === 'Refunded' ? 'text-orange-600' : 'text-neutral-400'}`}>
                         {order.paymentStatus}
                       </div>
                       {(order.rejectionReason || order.cancellationReason) && (
                         <div className="text-[9px] text-red-500 font-medium italic max-w-[100px] mx-auto line-clamp-2">
                           "{order.rejectionReason || order.cancellationReason}"
                         </div>
                       )}
                    </td>
                    <td className="p-4 align-top text-right">
                      <div className="flex flex-col gap-2 items-end">
                        {(order.status === 'pending' || order.status === 'paid') && (
                          <div className="flex gap-2">
                             <button
                              onClick={() => handleApprove(order._id)}
                              disabled={processing}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[10px] font-black rounded shadow"
                            >
                              APPROVE
                            </button>
                            <button
                              onClick={() => setRejectionModal(order)}
                              disabled={processing}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded shadow"
                            >
                              REJECT
                            </button>
                          </div>
                        )}

                        {order.status === 'approved' && !order.deliveryBoy && (
                          (order.paymentStatus === 'Paid' || order.paymentMethod === 'COD') ? (
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black rounded shadow-md transition-all active:scale-95"
                            >
                              ASSIGN DELIVERY
                            </button>
                          ) : (
                            <span className="text-[10px] text-neutral-400 font-bold uppercase italic">Awaiting Payment</span>
                          )
                        )}

                         {order.deliveryBoy && order.status === 'assigned' && (
                          <div className="text-right">
                             <div className="text-[9px] text-neutral-400 font-bold uppercase mb-1">Partner Assigned</div>
                             <div className="text-xs font-bold text-neutral-800">{order.deliveryBoy.name}</div>
                          </div>
                        )}

                        {order.status === 'approved' || order.status === 'assigned' || order.status === 'delivered' ? (
                          <div className="flex flex-col gap-2 mt-2 items-end">
                            {order.qrCodeUrl && (
                              <img src={order.qrCodeUrl} alt="QR" className="w-12 h-12 border rounded p-0.5 bg-gray-50" />
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => openInvoice(order)}
                                className="text-[9px] font-black text-blue-600 hover:underline cursor-pointer uppercase"
                              >
                                VIEW INVOICE
                              </button>
                              <button
                                onClick={() => handleRegenerateQR(order._id)}
                                disabled={isRegeneratingQR}
                                className="text-[9px] font-black text-gray-400 hover:text-gray-600 uppercase"
                              >
                                {isRegeneratingQR ? '...' : 'REFRESH QR'}
                              </button>
                            </div>
                          </div>
                        ) : null}
                        
                        {order.paymentStatus === 'Refunded' && (
                           <span className="text-[10px] text-green-600 font-black uppercase italic">Completed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden">
          {loading ? (
            <div className="p-12 text-center text-neutral-500">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">No orders.</div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {orders.map((order: any) => (
                <div key={order._id} className="p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-black text-neutral-800 text-base">{order.orderNumber}</div>
                      <div className="flex gap-2 items-center mt-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter ${order.paymentMethod === 'COD' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                          {order.paymentMethod}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-teal-800">₹{order.total}</div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[9px] font-black text-neutral-400 uppercase mb-1">Seller</p>
                      <p className="font-bold text-neutral-700">{order.sellerName}</p>
                      <p className="text-neutral-500">{order.sellerPhone}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-neutral-400 uppercase mb-1">Items</p>
                      <div className="space-y-1">
                        {order.items.slice(0, 2).map((it: any, idx: any) => (
                          <div key={idx} className="flex gap-1 text-[10px] truncate">
                            <span className="text-neutral-400">{it.quantity}x</span>
                            <span className="text-neutral-600 truncate">{it.name}</span>
                          </div>
                        ))}
                        {order.items.length > 2 && <p className="text-[9px] text-neutral-400">+{order.items.length - 2} more</p>}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {(order.status === 'pending' || order.status === 'paid') && (
                      <>
                        <button
                          onClick={() => handleApprove(order._id)}
                          disabled={processing}
                          className="flex-1 py-2.5 bg-green-600 text-white text-[10px] font-black rounded shadow"
                        >
                          APPROVE
                        </button>
                        <button
                          onClick={() => setRejectionModal(order)}
                          disabled={processing}
                          className="flex-1 py-2.5 bg-red-600 text-white text-[10px] font-black rounded shadow"
                        >
                          REJECT
                        </button>
                      </>
                    )}

                    {order.status === 'approved' && !order.deliveryBoy && (
                      (order.paymentStatus === 'Paid' || order.paymentMethod === 'COD') ? (
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="w-full py-2.5 bg-blue-600 text-white text-[10px] font-black rounded shadow-md"
                        >
                          ASSIGN DELIVERY
                        </button>
                      ) : (
                        <div className="w-full text-center p-2 bg-neutral-50 border border-neutral-100 rounded text-[9px] text-neutral-400 font-bold uppercase italic">
                          Awaiting Payment
                        </div>
                      )
                    )}

                    {order.deliveryBoy && order.status === 'assigned' && (
                       <div className="w-full text-center p-2 bg-purple-50 rounded border border-purple-100">
                          <span className="text-[9px] text-purple-600 font-black uppercase">Assigned: {order.deliveryBoy.name}</span>
                       </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-blue-600 text-white px-6 py-5 flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg">Assign Delivery Partner</h3>
                <p className="text-[10px] opacity-80 uppercase font-bold tracking-widest">{selectedOrder.orderNumber}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-2xl hover:scale-110 transition-transform">✕</button>
            </div>
            <div className="p-8">
              <div className="mb-6 space-y-4">
                <label className="block text-sm font-black text-neutral-700 uppercase tracking-tighter">Choose Available Partner</label>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {deliveryBoys.map(db => (
                    <button
                      key={db._id}
                      onClick={() => setSelectedDeliveryBoy(db._id)}
                      className={`flex flex-col p-4 rounded-xl border-2 transition-all text-left ${selectedDeliveryBoy === db._id ? 'border-blue-600 bg-blue-50' : 'border-neutral-100 hover:border-neutral-200'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-neutral-800">{db.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${db.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{db.status}</span>
                      </div>
                      <span className="text-xs text-neutral-500">{db.mobile}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleAssign}
                  disabled={!selectedDeliveryBoy || assigning}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black shadow-lg shadow-blue-600/20 disabled:bg-neutral-300 transition-all active:scale-95"
                >
                  {assigning ? "ASSIGNING..." : "CONFIRM ASSIGNMENT"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300 border-t-8 border-red-600">
            <div className="p-8">
              <h3 className="text-xl font-black text-neutral-800 mb-2">Reject Order</h3>
              <p className="text-xs text-neutral-400 mb-6 uppercase tracking-widest font-bold">Order: {rejectionModal.orderNumber}</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black text-neutral-500 uppercase mb-2">Reason for Rejection</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a detailed reason for the seller..."
                    className="w-full px-4 py-3 border-2 border-neutral-100 rounded-xl focus:border-red-600 outline-none text-sm min-h-[100px] bg-neutral-50"
                  />
                </div>

                {rejectionModal.paymentStatus === 'Paid' && (
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-[11px] font-black text-orange-700 uppercase">Information</p>
                    <p className="text-[10px] text-neutral-600 mt-1">
                      This is a PAID order. Once rejected, the seller will be prompted to submit their bank details for a manual refund.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                 <button
                  onClick={handleReject}
                  disabled={!rejectionReason || processing}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black shadow-lg shadow-red-600/20 disabled:bg-neutral-300 transition-all active:scale-95"
                >
                  CONFIRM REJECTION
                </button>
                <button
                  onClick={() => setRejectionModal(null)}
                  className="px-6 py-4 text-neutral-400 font-black hover:text-neutral-600 transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {invoiceOrder && (
        <InvoiceModal 
          isOpen={isInvoiceModalOpen} 
          onClose={() => setIsInvoiceModalOpen(false)} 
          order={invoiceOrder} 
        />
      )}
    </div>
  );
}
