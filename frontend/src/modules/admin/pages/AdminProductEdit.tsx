import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getProductById,
  updateProduct,
  approveProductRequest,
  getCategories,
  getSubCategories,
  getBrands,
  type Product,
  type Category,
  type SubCategory,
  type Brand,
} from "../../../services/api/admin/adminProductService";
import { getHeaderCategoriesAdmin, type HeaderCategory } from "../../../services/api/headerCategoryService";
import { useToast } from "../../../context/ToastContext";

export default function AdminProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [managedProduct, setManagedProduct] = useState<Partial<Product>>({});
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Master data
  const [headerCategories, setHeaderCategories] = useState<HeaderCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    if (id) {
      fetchProductData(id);
      fetchMasterData();
    }
  }, [id]);

  const fetchProductData = async (productId: string) => {
    try {
      setLoading(true);
      const response = await getProductById(productId);
      if (response.success) {
        setProduct(response.data);
        setManagedProduct(response.data);
      } else {
        showToast("Failed to load product", "error");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      showToast("An error occurred while loading the product", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [hCats, cats, brs] = await Promise.all([
        getHeaderCategoriesAdmin(),
        getCategories(),
        getBrands(),
      ]);
      setHeaderCategories(hCats);
      if (cats.success) setCategories(cats.data);
      if (brs.success) setBrands(brs.data);
    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  };

  useEffect(() => {
    if (managedProduct.category) {
      const categoryId = typeof managedProduct.category === "string" 
        ? managedProduct.category 
        : (managedProduct.category as any)._id;
      
      if (categoryId) {
        getSubCategories({ category: categoryId }).then(res => {
          if (res.success) setSubcategories(res.data);
        });
      }
    }
  }, [managedProduct.category]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setManagedProduct(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as any).checked : value,
    }));
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      setSaving(true);
      const response = await updateProduct(id, managedProduct as any);
      if (response.success) {
        showToast("Product updated successfully", "success");
        fetchProductData(id);
      } else {
        showToast("Failed to update product", "error");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      showToast("An error occurred while saving the product", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      setSaving(true);
      const response = await approveProductRequest(id, "Active");
      if (response.success) {
        showToast("Product approved successfully", "success");
        navigate("/admin/product/list");
      } else {
        showToast("Failed to approve product", "error");
      }
    } catch (error) {
      console.error("Error approving product:", error);
      showToast("An error occurred while approving", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectionReason.trim()) {
      showToast("Please provide a rejection reason", "error");
      return;
    }
    try {
      setSaving(true);
      const response = await approveProductRequest(id, "Rejected", rejectionReason);
      if (response.success) {
        showToast("Product rejected", "success");
        setShowRejectModal(false);
        navigate("/admin/product/list");
      } else {
        showToast("Failed to reject product", "error");
      }
    } catch (error) {
      console.error("Error rejecting product:", error);
      showToast("An error occurred while rejecting", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading product details...</div>;
  }

  if (!product) {
    return <div className="p-8 text-center text-red-600">Product not found</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/admin/product/list")}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-neutral-800">Review Product</h1>
            <p className="text-xs text-neutral-500">Edit and moderate product before approval</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowRejectModal(true)}
            disabled={saving || product.status === "Rejected"}
            className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded font-medium text-sm transition-colors disabled:opacity-50"
          >
            Reject
          </button>
          <button 
            onClick={handleApprove}
            disabled={saving || product.status === "Active"}
            className="px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded font-medium text-sm transition-colors disabled:opacity-50"
          >
            Approve
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>}
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-md font-semibold mb-4 text-neutral-800 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                Product Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Product Name</label>
                  <input 
                    type="text" 
                    name="productName"
                    value={managedProduct.productName || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Description</label>
                  <textarea 
                    name="description"
                    rows={6}
                    value={managedProduct.description || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Brand</label>
                    <select 
                      name="brand"
                      value={typeof managedProduct.brand === "string" ? managedProduct.brand : (managedProduct.brand as any)?._id || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    >
                      <option value="">Select Brand</option>
                      {brands.map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">SKU (External ID)</label>
                    <input 
                      type="text" 
                      name="sku"
                      value={managedProduct.sku || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing and Inventory */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-md font-semibold mb-4 text-neutral-800 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                Pricing & Inventory
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Base Price (₹)</label>
                  <input 
                    type="number" 
                    name="price"
                    value={managedProduct.price || 0}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Discount Price (₹)</label>
                  <input 
                    type="number" 
                    name="compareAtPrice"
                    value={managedProduct.compareAtPrice || 0}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none text-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Tax (%)</label>
                  <input 
                    type="text" 
                    name="tax"
                    value={managedProduct.tax || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>
              <hr className="my-6 border-neutral-100" />
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Current Stock</label>
                  <input 
                    type="number" 
                    name="stock"
                    value={managedProduct.stock || 0}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none font-bold text-teal-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Unit</label>
                  <input 
                    type="text" 
                    placeholder="e.g. pcs, kg, box"
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-md font-semibold mb-4 text-neutral-800 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                Product Images
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {managedProduct.mainImage && (
                  <div className="relative group aspect-square border-2 border-teal-500 rounded overflow-hidden">
                    <img src={managedProduct.mainImage} alt="Main" className="w-full h-full object-cover" />
                    <div className="absolute top-1 left-1 bg-teal-500 text-white text-[8px] px-1 rounded uppercase font-bold">Main</div>
                  </div>
                )}
                {managedProduct.galleryImages?.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square border border-neutral-200 rounded overflow-hidden hover:border-neutral-400 transition-colors">
                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                <button className="aspect-square border-2 border-dashed border-neutral-300 rounded flex flex-col items-center justify-center text-neutral-400 hover:text-neutral-600 hover:border-neutral-400 transition-all">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span className="text-[10px] mt-1 font-bold">ADD IMAGE</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
               <h2 className="text-sm font-bold mb-4 text-neutral-800 uppercase tracking-widest border-b border-neutral-100 pb-2">Status & Moderation</h2>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">Current Status</span>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      product.status === "Active" ? "bg-teal-100 text-teal-700" :
                      product.status === "Rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {product.status || "Pending"}
                    </span>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer pb-2">
                       <input 
                         type="checkbox" 
                         name="publish"
                         checked={managedProduct.publish || false}
                         onChange={handleInputChange}
                         className="w-4 h-4 text-teal-600 rounded border-neutral-300 focus:ring-teal-500" 
                       />
                       <span className="text-sm text-neutral-700">Published (Visible to Customers)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer pb-2">
                       <input 
                         type="checkbox" 
                         name="popular"
                         checked={managedProduct.popular || false}
                         onChange={handleInputChange}
                         className="w-4 h-4 text-teal-600 rounded border-neutral-300 focus:ring-teal-500" 
                       />
                       <span className="text-sm text-neutral-700">Featured Product</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                       <input 
                         type="checkbox" 
                         name="dealOfDay"
                         checked={managedProduct.dealOfDay || false}
                         onChange={handleInputChange}
                         className="w-4 h-4 text-teal-600 rounded border-neutral-300 focus:ring-teal-500" 
                       />
                       <span className="text-sm text-neutral-700">Deal of the Day</span>
                    </label>
                  </div>
               </div>
            </div>

            {/* Category Hierarchy */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-sm font-bold mb-4 text-neutral-800 uppercase tracking-widest border-b border-neutral-100 pb-2">Category Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1 uppercase tracking-widest">Header Category</label>
                  <select 
                    name="headerCategoryId"
                    value={managedProduct.headerCategoryId || ""}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-50 border-none rounded py-2 text-sm focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select Header Category</option>
                    {headerCategories.map(hc => (
                      <option key={hc._id} value={hc._id}>{hc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1 uppercase tracking-widest">Main Category</label>
                  <select 
                    name="category"
                    value={typeof managedProduct.category === "string" ? managedProduct.category : (managedProduct.category as any)?._id || ""}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-50 border-none rounded py-2 text-sm focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1 uppercase tracking-widest">Subcategory</label>
                  <select 
                    name="subcategory"
                    value={typeof managedProduct.subcategory === "string" ? managedProduct.subcategory : (managedProduct.subcategory as any)?._id || ""}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-50 border-none rounded py-2 text-sm focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select Subcategory</option>
                    {subcategories.map(sc => (
                      <option key={sc._id} value={sc._id}>{sc.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-sm font-bold mb-4 text-neutral-800 uppercase tracking-widest border-b border-neutral-100 pb-2">Seller Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Store Name</span>
                  <span className="font-semibold text-neutral-800">{(product.seller as any)?.storeName || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Seller Name</span>
                  <span className="text-neutral-800">{(product.seller as any)?.sellerName || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-dotted border-neutral-200">
                  <span className="text-neutral-500">Seller ID</span>
                  <span className="text-[10px] font-mono text-neutral-400">{typeof product.seller === 'string' ? product.seller : (product.seller as any)?._id}</span>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-neutral-50 rounded-lg p-6 text-[10px] space-y-2 text-neutral-400 font-mono">
               <p>ID: {product._id}</p>
               <p>CREATED: {new Date(product.createdAt || "").toLocaleString()}</p>
               <p>UPDATED: {new Date(product.updatedAt || "").toLocaleString()}</p>
               {product.approvedBy && (
                 <p>APPROVED BY: {typeof product.approvedBy === 'object' ? `${(product.approvedBy as any).firstName} ${(product.approvedBy as any).lastName}` : product.approvedBy}</p>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-neutral-800 mb-2">Reject Product</h3>
            <p className="text-sm text-neutral-500 mb-4">Please specify the reason for rejection. This will be visible to the seller.</p>
            <textarea 
              className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-red-500 focus:outline-none mb-4"
              rows={4}
              placeholder="e.g. Images missing, Incorrect pricing, Prohibited item..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            ></textarea>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 hover:bg-neutral-100 rounded font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                disabled={saving || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded font-medium text-sm transition-colors disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
