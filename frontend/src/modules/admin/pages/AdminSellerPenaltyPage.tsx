import { useState, useEffect } from "react";
import {
  getAdminSellers,
  applySellerPenalty,
} from "../../../services/api/admin/adminWalletService";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";

interface Seller {
  _id: string;
  sellerName: string;
  storeName: string;
  email: string;
  balance: number;
  securityDeposit: number;
}

const PENALTY_REASONS = [
  "Order Refused",
  "Policy Violation",
  "Fake Product",
  "Late Delivery",
  "Late Order Handling",
  "Manual Penalty",
  "Other",
];

export default function AdminSellerPenaltyPage() {
  const { isAuthenticated, token } = useAuth();
  const { showToast } = useToast();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [orderId, setOrderId] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const fetchSellers = async () => {
      try {
        setLoading(true);
        const response = await getAdminSellers();
        if (response.success && response.data) {
          setSellers(response.data);
        }
      } catch (err) {
        console.error("Error fetching sellers:", err);
        showToast("Failed to load sellers");
      } finally {
        setLoading(false);
      }
    };

    fetchSellers();
  }, [isAuthenticated, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSellerId || !amount || !reason) {
      showToast("Please fill in all required fields");
      return;
    }

    const penaltyAmount = Number(amount);
    if (isNaN(penaltyAmount) || penaltyAmount <= 0) {
      showToast("Please enter a valid positive amount");
      return;
    }

    const selectedSeller = sellers.find(s => s._id === selectedSellerId);
    const sellerBalance = selectedSeller?.securityDeposit || 0;
    if (selectedSeller && sellerBalance < penaltyAmount) {
      showToast(`Insufficient balance. Seller has only ₹${sellerBalance.toFixed(2)} in security deposit wallet`);
      return;
    }

    try {
      setSubmitting(true);
      const response = await applySellerPenalty({
        sellerId: selectedSellerId,
        amount: penaltyAmount,
        reason,
        orderId,
        note,
      });

      if (response.success) {
        showToast("Penalty applied successfully");
        // Reset form
        setSelectedSellerId("");
        setAmount("");
        setReason("");
        setOrderId("");
        setNote("");
        
        // Refresh seller list to get updated balance
        const updatedSellersRes = await getAdminSellers();
        if (updatedSellersRes.success) {
          setSellers(updatedSellersRes.data);
        }
      } else {
        showToast(response.message || "Failed to apply penalty", "error");
      }
    } catch (err: any) {
      console.error("Error applying penalty:", err);
      showToast(err.response?.data?.message || "An error occurred", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="bg-teal-600 px-6 py-4 rounded-t-lg">
        <h1 className="text-white text-2xl font-semibold">
          Apply Seller Penalty
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Penalty Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Select Seller *
                  </label>
                  <select
                    value={selectedSellerId}
                    onChange={(e) => setSelectedSellerId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">Choose a seller</option>
                    {sellers.map((seller) => (
                      <option key={seller._id} value={seller._id}>
                        {seller.storeName} ({seller.email}) - Dep: ₹{(seller.securityDeposit || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Penalty Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="1"
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Reason *
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">Select reason</option>
                    {PENALTY_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Order ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="Reference Order ID"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Note (Optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Additional details about the penalty..."
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="bg-teal-600 text-white px-6 py-2 rounded-md font-medium hover:bg-teal-700 transition-colors disabled:bg-neutral-400"
                >
                  {submitting ? "Processing..." : "Deduct Penalty"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Info Card */}
        <div>
          <div className="bg-teal-50 rounded-lg border border-teal-200 p-6 space-y-4">
            <h3 className="text-teal-800 font-semibold flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              Quick Guidelines
            </h3>
            <ul className="text-sm text-teal-700 space-y-2 list-disc pl-4">
              <li>Penalties are directly deducted from the seller's <strong>Security Deposit Wallet</strong> (initial ₹1000).</li>
              <li>This is separate from the Sales Wallet used for product revenue.</li>
              <li>Insufficient deposit balance will prevent the penalty from being applied.</li>
              <li>Make sure to select the correct reason for auditing purposes.</li>
              <li>Sellers can view these deductions in their wallet history.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
