import { useState, useEffect } from "react";
import {
  getProductSlotConfig,
  updateProductSlotConfig,
  getSlotEarnings,
  ProductSlotConfig,
  SlotEarning,
} from "../../../services/api/admin/adminProductSlotService";
import { useToast } from "../../../context/ToastContext";
import IconLoader from "../../../components/loaders/IconLoader";

export default function AdminProductSlots() {
  const [config, setConfig] = useState<ProductSlotConfig>({
    isEnabled: false,
    maxFreeProducts: 5,
    chargePerSlot: 99,
  });
  const [earnings, setEarnings] = useState<SlotEarning[]>([]);
  const [summary, setSummary] = useState({ total: 0, slots: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configRes, earningsRes] = await Promise.all([
        getProductSlotConfig(),
        getSlotEarnings(),
      ]);

      if (configRes.success) setConfig(configRes.data);
      if (earningsRes.success) {
        setEarnings(earningsRes.data);
        setSummary(earningsRes.summary);
      }
    } catch (error) {
      console.error("Error fetching slot data:", error);
      showToast("Failed to fetch product slot data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProductSlotConfig(config);
      if (res.success) {
        showToast("Configuration updated successfully", "success");
      }
    } catch (error) {
      showToast("Failed to update configuration", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <IconLoader forceShow />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Product Slots & Limits</h1>
          <p className="text-neutral-500">Manage seller product limits and extra slot charges</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-200 bg-neutral-50">
              <h2 className="font-semibold text-neutral-900">Module Settings</h2>
            </div>
            <form onSubmit={handleUpdateConfig} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-neutral-700">Enable Limits</label>
                  <p className="text-xs text-neutral-500">Restrict products for all sellers</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={config.isEnabled}
                    onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Max Free Products</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                  value={config.maxFreeProducts}
                  onChange={(e) => setConfig({ ...config, maxFreeProducts: parseInt(e.target.value) })}
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Charge Per Extra Slot (₹)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                  value={config.chargePerSlot}
                  onChange={(e) => setConfig({ ...config, chargePerSlot: parseInt(e.target.value) })}
                  min="0"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Configuration"}
              </button>
            </form>
          </div>

          <div className="mt-6 bg-teal-50 rounded-xl p-6 border border-teal-100">
            <h3 className="text-teal-900 font-semibold mb-2">Earnings Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-teal-600 uppercase font-bold">Total Earnings</p>
                <p className="text-2xl font-bold text-teal-900">₹{summary.total.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-teal-600 uppercase font-bold">Slots Sold</p>
                <p className="text-2xl font-bold text-teal-900">{summary.slots}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Table Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <h2 className="font-semibold text-neutral-900">Recent Slot Purchases</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3">Seller / Store</th>
                    <th className="px-6 py-3">Slots</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-sm">
                  {earnings.length > 0 ? (
                    earnings.map((earning) => (
                      <tr key={earning._id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-neutral-900">{earning.sellerId.storeName}</div>
                          <div className="text-xs text-neutral-500">{earning.sellerId.sellerName}</div>
                        </td>
                        <td className="px-6 py-4">{earning.slotsPurchased}</td>
                        <td className="px-6 py-4 font-semibold text-neutral-900">₹{earning.amountPaid}</td>
                        <td className="px-6 py-4 text-neutral-500">
                          {new Date(earning.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            earning.status === "paid" 
                              ? "bg-green-100 text-green-800"
                              : earning.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {earning.status.charAt(0).toUpperCase() + earning.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-neutral-500">
                        No purchase history found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
