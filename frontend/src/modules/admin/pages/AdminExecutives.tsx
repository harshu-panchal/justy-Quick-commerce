import { useState, useEffect } from "react";
import {
  getExecutives,
  createExecutive,
  updateExecutive,
  deleteExecutive,
  Executive,
} from "../../../services/api/admin/executiveService";

export default function AdminExecutives() {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    isActive: true,
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
    totalPages: 1,
    totalRecords: 0,
  });

  useEffect(() => {
    fetchExecutives();
  }, [pagination.currentPage]);

  const fetchExecutives = async () => {
    setLoading(true);
    try {
      const response = await getExecutives({
        page: pagination.currentPage,
        limit: pagination.limit,
      });
      if (response.success && response.data) {
        setExecutives(response.data);
        if (response.pagination) {
          setPagination((prev) => ({
            ...prev,
            totalPages: response.pagination!.pages,
            totalRecords: response.pagination!.total,
          }));
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error fetching executives");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as any;
    const finalValue = type === "checkbox" ? (e.target as any).checked : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      mobile: "",
      isActive: true,
    });
    setEditingId(null);
  };

  const handleSubmit = async () => {
    setError("");
    setSuccessMessage("");

    if (!formData.name.trim()) {
      setError("Please enter executive name");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        const response = await updateExecutive(editingId, formData);
        if (response.success) {
          setSuccessMessage("Executive updated successfully!");
          resetForm();
          fetchExecutives();
        }
      } else {
        const response = await createExecutive(formData);
        if (response.success) {
          setSuccessMessage("Executive created successfully!");
          resetForm();
          fetchExecutives();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error saving executive");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (exec: Executive) => {
    setFormData({
      name: exec.name,
      mobile: exec.mobile || "",
      isActive: exec.isActive,
    });
    setEditingId(exec._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this executive?")) return;

    setLoading(true);
    try {
      const response = await deleteExecutive(id);
      if (response.success) {
        setSuccessMessage("Executive deleted successfully!");
        fetchExecutives();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error deleting executive");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-6 pb-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-neutral-800">
            Executive Management
          </h1>
          <div className="text-sm text-blue-500">
            <span className="text-blue-500 hover:underline cursor-pointer">
              Home
            </span>{" "}
            <span className="text-neutral-400">/</span> Management
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Create/Edit Executive Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 flex flex-col h-fit">
            <div className="bg-teal-600 text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Executive" : "Create New Executive"}
              </h2>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center justify-between">
                <p className="text-sm">{error}</p>
                <button
                  onClick={() => setError("")}
                  className="text-red-700 hover:text-red-900 ml-4 text-lg font-bold">
                  ×
                </button>
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-center justify-between">
                <p className="text-sm">{successMessage}</p>
                <button
                  onClick={() => setSuccessMessage("")}
                  className="text-green-700 hover:text-green-900 ml-4 text-lg font-bold">
                  ×
                </button>
              </div>
            )}

            <div className="p-6 flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Executive Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter executive name"
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="Enter mobile number"
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm text-neutral-700 cursor-pointer select-none">
                    Active Status
                  </label>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded text-sm font-medium transition-colors">
                  {loading
                    ? "Saving..."
                    : editingId
                    ? "Update Executive"
                    : "Create Executive"}
                </button>
                {editingId && (
                  <button
                    onClick={resetForm}
                    disabled={loading}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-neutral-700 py-2.5 rounded text-sm font-medium transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Executives List Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 flex flex-col">
            <div className="bg-teal-600 text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-lg font-semibold">Existing Executives</h2>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              {loading && executives.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                          Mobile
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                          Total Sellers
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider w-[100px]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {executives.map((exec) => (
                        <tr key={exec._id} className="hover:bg-neutral-50 border-b border-neutral-100">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-neutral-900">
                              {exec.name}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-neutral-600">
                              {exec.mobile || "N/A"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                                exec.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}>
                              {exec.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                                {exec.sellerCount || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(exec)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(exec._id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
