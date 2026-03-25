import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getAdminRefundRequests, 
  updateRefundRequestStatus, 
  processRazorpayRefund,
  type RefundRequest 
} from '../../../services/api/admin/adminEquipmentService';

export default function AdminEquipmentRefunds() {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Update Modal State
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [status, setStatus] = useState<'APPROVED' | 'REJECTED' | 'COMPLETED'>('APPROVED');
  const [adminNote, setAdminNote] = useState("");
  const [transactionRef, setTransactionRef] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getAdminRefundRequests();
      if (res.success) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error("Error fetching refund requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return;
    
    if (status === 'COMPLETED' && !transactionRef) {
        alert("Transaction Reference is required to complete a refund");
        return;
    }

    try {
      setProcessing(true);
      const res = await updateRefundRequestStatus(selectedRequest._id, {
        status,
        adminNote,
        transactionRef: status === 'COMPLETED' ? transactionRef : undefined
      });
      
      if (res.success) {
        alert("Refund request updated successfully");
        setSelectedRequest(null);
        setAdminNote("");
        setTransactionRef("");
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Update failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleRazorpayTestRefund = async () => {
    if (!selectedRequest) return;
    if (!window.confirm("Are you sure you want to trigger a Razorpay Test Refund? This will attempt to automate the refund via the gateway.")) return;

    try {
      setProcessing(true);
      const res = await processRazorpayRefund(selectedRequest._id);
      if (res.success) {
        alert("Razorpay Test Refund successful!");
        setSelectedRequest(null);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Razorpay refund failed. Please process manually.");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-700",
      APPROVED: "bg-blue-100 text-blue-700",
      REJECTED: "bg-red-100 text-red-700",
      COMPLETED: "bg-green-100 text-green-700",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-4 md:p-6 overflow-y-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
           <h1 className="text-xl md:text-2xl font-bold text-neutral-800">Bank Refunds</h1>
           <p className="text-xs text-neutral-500 mt-1">Manual bank transfers for secondary marketplace</p>
        </div>
        <div className="text-xs">
          <Link to="/admin/equipment/orders" className="text-blue-600 hover:underline">Equipment Orders</Link>
          <span className="mx-2 text-neutral-400">/</span>
          <span className="text-neutral-500">Refunds</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="bg-orange-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Refund Queue</h2>
          {processing && <div className="text-xs animate-pulse bg-white/20 px-2 py-1 rounded">Processing...</div>}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-neutral-500">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">No bank refund requests found.</div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-50 text-[11px] font-bold text-neutral-500 uppercase">
                  <th className="p-4 border-b">Order Info</th>
                  <th className="p-4 border-b">Seller Details</th>
                  <th className="p-4 border-b">Bank Account Details</th>
                  <th className="p-4 border-b text-center">Amount</th>
                  <th className="p-4 border-b text-center">Status</th>
                  <th className="p-4 border-b text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-black text-neutral-800">{req.orderId.orderNumber}</span>
                        <span className="text-[10px] text-neutral-400 uppercase font-bold">{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-neutral-700">{req.sellerId.sellerName}</div>
                      <div className="text-[10px] text-neutral-400">{req.sellerId.mobile}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-[11px] space-y-0.5">
                         <div className="font-bold text-neutral-800">{req.bankDetails.accountHolderName}</div>
                         {req.bankDetails.accountNumber !== 'UPI_DESTINATION' ? (
                            <>
                                <div className="text-neutral-600 font-mono tracking-tighter">A/C: {req.bankDetails.accountNumber}</div>
                                <div className="text-neutral-500 flex items-center gap-2">
                                  <span>IFSC: {req.bankDetails.ifscCode}</span>
                                  {req.bankDetails.upiId && <span className="bg-blue-50 text-blue-600 px-1 rounded text-[9px] font-bold uppercase">UPI: {req.bankDetails.upiId}</span>}
                                </div>
                            </>
                         ) : (
                            <div className="flex flex-col gap-1 mt-1">
                                <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded w-fit">UPI REFUND</span>
                                <div className="text-sm font-black text-blue-700">{req.bankDetails.upiId}</div>
                            </div>
                         )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                       <div className="font-black text-teal-800 text-lg">₹{req.amount}</div>
                    </td>
                    <td className="p-4 text-center">
                       {getStatusBadge(req.status)}
                       {req.transactionRef && (
                         <div className="text-[9px] text-neutral-400 mt-1 font-mono">TXN: {req.transactionRef}</div>
                       )}
                    </td>
                    <td className="p-4 text-right">
                      {req.status !== 'COMPLETED' && req.status !== 'REJECTED' ? (
                        <button
                          onClick={() => {
                              setSelectedRequest(req);
                              setStatus(req.status === 'PENDING' ? 'APPROVED' : 'COMPLETED');
                          }}
                          className="px-4 py-2 bg-neutral-800 hover:bg-black text-white text-[10px] font-black rounded shadow transition-all active:scale-95"
                        >
                          MANAGE
                        </button>
                      ) : (
                        <span className="text-[10px] text-neutral-400 font-bold uppercase italic">Processed</span>
                      )}
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
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">No requests.</div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {requests.map((req) => (
                <div key={req._id} className="p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-black text-neutral-800 text-base">{req.orderId.orderNumber}</div>
                      <div className="text-[9px] text-neutral-400 font-bold uppercase">{new Date(req.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-teal-800">₹{req.amount}</div>
                      {getStatusBadge(req.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-xs text-neutral-600">
                    <div className="flex justify-between border-b border-neutral-200/50 pb-2">
                      <span className="font-bold text-neutral-400 uppercase text-[9px]">Account Holder</span>
                      <span className="font-bold text-neutral-800">{req.bankDetails.accountHolderName}</span>
                    </div>
                    {req.bankDetails.accountNumber !== 'UPI_DESTINATION' ? (
                       <div className="flex flex-col gap-1">
                          <div className="flex justify-between">
                            <span className="text-neutral-400 uppercase text-[9px]">A/C Number</span>
                            <span className="font-mono text-neutral-700">{req.bankDetails.accountNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-400 uppercase text-[9px]">IFSC Code</span>
                            <span className="text-neutral-700">{req.bankDetails.ifscCode}</span>
                          </div>
                       </div>
                    ) : (
                        <div className="flex justify-between">
                            <span className="text-blue-600 font-black uppercase text-[9px]">UPI ID</span>
                            <span className="font-black text-blue-700">{req.bankDetails.upiId}</span>
                        </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedRequest(req);
                      setStatus(req.status === 'PENDING' ? 'APPROVED' : 'COMPLETED');
                    }}
                    disabled={req.status === 'COMPLETED' || req.status === 'REJECTED'}
                    className="w-full py-3 bg-neutral-800 text-white text-[10px] font-black rounded shadow"
                  >
                    {req.status === 'COMPLETED' || req.status === 'REJECTED' ? 'PROCESSED' : 'MANAGE REFUND'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Management Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-neutral-800 text-white px-6 py-5 flex justify-between items-center text-center">
               <div className="w-full">
                  <h3 className="font-black text-lg uppercase tracking-tight">Process Bank Refund</h3>
                  <p className="text-[10px] opacity-60 uppercase font-bold tracking-[0.2em] mt-0.5">Order {selectedRequest.orderId.orderNumber}</p>
               </div>
               <button onClick={() => setSelectedRequest(null)} className="absolute right-6 text-xl hover:scale-110 transition-transform">✕</button>
            </div>
            
            <div className="p-8">
               <div className="grid grid-cols-2 gap-6 mb-8 border-b border-neutral-100 pb-8">
                  <div>
                     <p className="text-[10px] font-black text-neutral-400 uppercase mb-2">Refund Destination</p>
                     <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                        <p className="text-xs font-black text-neutral-800 mb-1">{selectedRequest.bankDetails.accountHolderName}</p>
                        {selectedRequest.bankDetails.accountNumber !== 'UPI_DESTINATION' ? (
                            <>
                                <p className="text-[11px] text-neutral-600 font-mono tracking-tighter">{selectedRequest.bankDetails.accountNumber}</p>
                                <p className="text-[10px] text-neutral-400 mt-1 font-bold">IFSC: {selectedRequest.bankDetails.ifscCode}</p>
                                {selectedRequest.bankDetails.upiId && <p className="text-[10px] text-blue-600 mt-1 font-bold">UPI: {selectedRequest.bankDetails.upiId}</p>}
                            </>
                        ) : (
                            <div className="mt-1">
                                <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">UPI ID</p>
                                <p className="text-sm font-black text-blue-700">{selectedRequest.bankDetails.upiId}</p>
                            </div>
                        )}
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-neutral-400 uppercase mb-2">Refund Amount</p>
                     <div className="text-4xl font-black text-teal-700">₹{selectedRequest.amount}</div>
                     <p className="text-[10px] text-neutral-400 mt-2 font-bold uppercase italic italic">Direct Bank Transfer</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-black text-neutral-500 uppercase mb-3">Update Status To</label>
                    <div className="grid grid-cols-3 gap-3">
                       {['APPROVED', 'COMPLETED', 'REJECTED'].map((s) => (
                         <button
                           key={s}
                           onClick={() => setStatus(s as any)}
                           className={`py-3 rounded-xl text-[10px] font-black transition-all border-2 ${status === s ? 'bg-neutral-800 text-white border-neutral-800 shadow-lg' : 'bg-white text-neutral-400 border-neutral-100 hover:border-neutral-200'}`}
                         >
                           {s}
                         </button>
                       ))}
                    </div>
                  </div>

                  {status === 'COMPLETED' && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                       <label className="block text-[11px] font-black text-neutral-500 uppercase mb-2">Transaction Reference ID *</label>
                       <input 
                        type="text"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="e.g. UTR Number / IMPS Ref"
                        className="w-full px-4 py-3 border-2 border-orange-100 rounded-xl focus:border-orange-500 outline-none text-sm font-bold bg-orange-50/30"
                       />
                       <p className="text-[9px] text-neutral-400 mt-2 font-medium italic">Make the transfer in your bank portal first, then paste the reference here.</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-black text-neutral-500 uppercase mb-2">Internal Note / Rejection Reason</label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="e.g. Transfer initiated, or reason for rejection..."
                      className="w-full px-4 py-3 border-2 border-neutral-100 rounded-xl focus:border-neutral-800 outline-none text-sm min-h-[80px] bg-neutral-50 font-medium"
                    />
                  </div>
               </div>

                <div className="flex flex-col gap-3 mt-10">
                   {selectedRequest.orderId.paymentStatus === 'Paid' && selectedRequest.orderId.status !== 'refunded' && (
                      <button
                        onClick={handleRazorpayTestRefund}
                        disabled={processing}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black shadow-xl shadow-blue-600/20 disabled:bg-neutral-200 transition-all active:scale-95 uppercase tracking-wider text-[10px]"
                      >
                        {processing ? "PROCESSING..." : "Trigger Razorpay Test Refund"}
                      </button>
                   )}
                   
                   <div className="flex gap-4">
                      <button
                        onClick={handleUpdateStatus}
                        disabled={processing || (status === 'COMPLETED' && !transactionRef)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-black shadow-xl shadow-green-600/20 disabled:bg-neutral-200 transition-all active:scale-95 uppercase tracking-wider text-[10px]"
                      >
                        {processing ? "SAVING..." : `CONFIRM ${status} (Manual)`}
                      </button>
                      <button
                        onClick={() => setSelectedRequest(null)}
                        disabled={processing}
                        className="px-8 py-4 text-neutral-400 font-bold hover:text-neutral-600 transition-colors uppercase text-[10px]"
                      >
                        CANCEL
                      </button>
                   </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
