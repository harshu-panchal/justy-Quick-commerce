import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getAdminEquipmentItems,
  createEquipmentItem,
  updateEquipmentItem,
  deleteEquipmentItem,
  toggleEquipmentItemStatus,
  uploadEquipmentImage,
  type EquipmentItem,
} from "../../../services/api/admin/adminEquipmentService";
import { useAuth } from "../../../context/AuthContext";

export default function AdminEquipmentItems() {
  const { isAuthenticated, token } = useAuth();
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    minQuantity: 1,
    deliveryCharge: 0,
    platformFee: 0,
    imageUrl: "",
    pickupAddress: "", // Admin/warehouse address — only delivery boy will see this
  });

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchData();
    }
  }, [isAuthenticated, token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getAdminEquipmentItems();
      if (response.success) {
        setItems(response.data);
      }
    } catch (err: any) {
      setError("Failed to fetch equipment items");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["price", "stock", "minQuantity", "deliveryCharge", "platformFee"].includes(name) ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price < 0 || formData.stock < 0 || formData.minQuantity < 1) {
      alert("Please fill in valid details (Min Quantity should be at least 1)");
      return;
    }

    try {
      setSubmitting(true);
      let response;
      if (editingItem) {
        response = await updateEquipmentItem(editingItem._id, formData);
      } else {
        response = await createEquipmentItem(formData);
      }

      if (response.success) {
        alert(`Item ${editingItem ? "updated" : "added"} successfully!`);
        setEditingItem(null);
        setFormData({ name: "", description: "", price: 0, stock: 0, minQuantity: 1, deliveryCharge: 0, platformFee: 0, imageUrl: "", pickupAddress: "" });
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: EquipmentItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price,
      stock: item.stock,
      minQuantity: item.minQuantity || 1,
      deliveryCharge: item.deliveryCharge || 0,
      platformFee: item.platformFee || 0,
      imageUrl: item.imageUrl || "",
      pickupAddress: (item as any).pickupAddress || "",
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const response = await deleteEquipmentItem(id);
      if (response.success) {
        alert(response.message || "Deleted successfully");
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleEquipmentItemStatus(id);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Toggle failed");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const response = await uploadEquipmentImage(file);
      if (response.success) {
        setFormData(prev => ({ ...prev, imageUrl: response.data.secureUrl }));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-neutral-50 p-4 md:p-6 overflow-y-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-neutral-800">Equipment Inventory</h1>
          <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest font-bold">Seller Marketplace Management</p>
        </div>
        <div className="flex items-center gap-3">
           <Link to="/admin" className="text-blue-600 font-bold text-xs hover:underline hidden md:block">Dashboard</Link>
           <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex-1 md:flex-none px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-lg shadow-lg shadow-teal-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
           >
            {showAddForm ? "✕ CLOSE FORM" : "+ ADD NEW ITEM"}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Panel */}
        <div className={`lg:col-span-1 ${showAddForm ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
              <div className="bg-teal-600 text-white px-6 py-4">
                <h2 className="text-lg font-semibold">{editingItem ? "Edit Item" : "Add New Equipment"}</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Item Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="e.g. Packing Box (Large)"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                    placeholder="Details about dimensions, material etc."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-teal-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Stock Qty *</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-teal-500 outline-none"
                      required
                    />
                  </div>
                </div>

                 <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Minimum Buy Quantity (MOQ) *</label>
                  <input
                    type="number"
                    name="minQuantity"
                    value={formData.minQuantity}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                    required
                  />
                  <p className="text-[10px] text-neutral-400 mt-1 italic">The minimum items a seller must purchase in one order.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    🏭 Pickup Address <span className="text-[10px] text-teal-600 font-semibold">(Admin only — delivery boy pickup location)</span>
                  </label>
                  <input
                    type="text"
                    name="pickupAddress"
                    value={formData.pickupAddress}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                    placeholder="e.g. Admin Warehouse, 123 MG Road, Indore"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1 italic">This address is shown to the delivery boy only — sellers cannot see it.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Upload Image (Local Machine)</label>
                  <div className="flex gap-4 items-center mb-2">
                    <div className="w-16 h-16 bg-neutral-100 rounded border border-neutral-200 flex-shrink-0 overflow-hidden">
                      {formData.imageUrl ? (
                        <img src={formData.imageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">No Img</div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                    />
                  </div>
                  {uploading && <div className="text-[10px] text-teal-600 font-bold mb-2 animate-pulse">UPLOADING...</div>}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-px bg-neutral-200"></div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase">OR USE URL</span>
                    <div className="flex-1 h-px bg-neutral-200"></div>
                  </div>
                  <input
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-teal-500 outline-none text-xs"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded font-medium disabled:bg-neutral-400 transition-colors"
                  >
                    {submitting ? "Saving..." : editingItem ? "Update Item" : "Add Item"}
                  </button>
                  {editingItem && (
                    <button
                      type="button"
                      onClick={() => {
                          setEditingItem(null);
                          setFormData({ name: "", description: "", price: 0, stock: 0, minQuantity: 1, deliveryCharge: 0, platformFee: 0, imageUrl: "", pickupAddress: "" });
                      }}
                      className="px-4 py-2 border border-neutral-300 rounded text-neutral-600 hover:bg-neutral-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

        {/* List Panel */}
        <div className={`${showAddForm ? 'lg:col-span-2' : 'lg:col-span-3'} col-span-1`}>
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <div className="bg-teal-700 text-white px-6 py-4 flex flex-col md:flex-row justify-between md:items-center gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Active Inventory</h2>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2 py-1 rounded">
                  {items.length} Products
                </span>
              </div>
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border border-white/20 rounded px-3 py-1 text-sm text-white placeholder:text-white/60 focus:bg-white/20 outline-none w-full md:w-48"
              />
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center text-neutral-500">Loading inventory...</div>
              ) : filteredItems.length === 0 ? (
                <div className="p-12 text-center text-neutral-500">No equipment items found.</div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-neutral-50 text-xs font-bold text-neutral-600 uppercase">
                      <th className="p-4 border-b border-neutral-200">Item</th>
                      <th className="p-4 border-b border-neutral-200 text-center">Price</th>
                      <th className="p-4 border-b border-neutral-200 text-center">Fees</th>
                      <th className="p-4 border-b border-neutral-200 text-center">Stock</th>
                      <th className="p-4 border-b border-neutral-200 text-center">Min Qty</th>
                      <th className="p-4 border-b border-neutral-200 text-center">Status</th>
                      <th className="p-4 border-b border-neutral-200 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredItems.map((item) => (
                      <tr key={item._id} className="hover:bg-neutral-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-neutral-100 rounded overflow-hidden flex-shrink-0 border border-neutral-200">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-400">📦</div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-neutral-800">{item.name}</div>
                              <div className="text-xs text-neutral-500 truncate max-w-[200px]">{item.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center font-medium">₹{item.price}</td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col text-[10px] text-neutral-500">
                             <span>Del: ₹{item.deliveryCharge || 0}</span>
                             <span>Plat: ₹{item.platformFee || 0}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${item.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {item.stock}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-1 rounded text-xs font-bold bg-orange-50 text-orange-700">
                            {item.minQuantity || 1}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(item._id)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                              item.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {item.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
                {loading ? (
                     <div className="p-12 text-center text-neutral-500">Loading...</div>
                ) : filteredItems.length === 0 ? (
                    <div className="p-12 text-center text-neutral-500">Empty Inventory</div>
                ) : (
                    <div className="divide-y divide-neutral-100">
                        {filteredItems.map((item) => (
                            <div key={item._id} className="p-4 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded object-cover border border-neutral-100" />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-neutral-800 text-sm line-clamp-1">{item.name}</h4>
                                        <div className="flex gap-2 items-center mt-1">
                                            <span className="text-xs font-black text-teal-700">₹{item.price}</span>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${item.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                Stock: {item.stock}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 items-end">
                                        <button
                                            onClick={() => handleToggleStatus(item._id)}
                                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-colors ${item.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                        >
                                            {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-neutral-500 bg-neutral-50 p-2 rounded">
                                    <div className="flex gap-3">
                                        <span>Del: <span className="font-bold text-neutral-700">₹{item.deliveryCharge || 0}</span></span>
                                        <span>Plat: <span className="font-bold text-neutral-700">₹{item.platformFee || 0}</span></span>
                                    </div>
                                    <span>Min: <span className="font-bold text-neutral-700">{item.minQuantity}</span></span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-black rounded"
                                    >
                                        EDIT
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        className="px-4 py-2 bg-red-50 text-red-600 text-xs font-black rounded hover:bg-red-100"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
