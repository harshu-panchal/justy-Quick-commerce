import React, { useState, useEffect } from "react";
import api from "../../../services/api/config";

interface PincodeDemand {
  _id: string;
  pincode: string;
  requestCount: number;
  lastRequested: string;
}

export default function AdminDemandTracking() {
  const [demands, setDemands] = useState<PincodeDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDemands();
  }, []);

  const fetchDemands = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/pincode-demands");
      if (response.data?.success) {
        setDemands(response.data.data);
      } else {
        setError(response.data?.message || "Failed to fetch demands");
      }
    } catch (err: any) {
      console.error("Error fetching pincode demands:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch demands");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Pincode Demand Tracking</h1>
        <button
          onClick={fetchDemands}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Refresh Data
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-5 border-b border-neutral-200">
          <p className="text-neutral-600 text-sm">
            This table tracks the demand for quick delivery in unserviceable pincodes. 
            When a user tries to order a quick delivery product but their pincode has no eligible sellers, 
            it is recorded here. Use this data to strategize expansion.
          </p>
        </div>

        {loading ? (
          <div className="p-10 flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="p-10 text-center text-red-500 font-medium">
            {error}
          </div>
        ) : demands.length === 0 ? (
          <div className="p-10 text-center text-neutral-500">
            No demand data available yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-fulltext-left border-collapse w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-800 tracking-wide uppercase">Pincode</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-800 tracking-wide uppercase">Total Requests</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-800 tracking-wide uppercase">Last Requested At</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-800 tracking-wide uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {demands.map((demand) => (
                  <tr key={demand._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-neutral-900 text-base">{demand.pincode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
                        {demand.requestCount} requests
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 font-medium">
                      {new Date(demand.lastRequested).toLocaleString("en-IN", {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: 'numeric', minute: 'numeric', hour12: true
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
                        Unserviceable
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
