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

  // Derived state for category-specific UI rendering
  const selectedHeaderCatName = headerCategories.find(hc => hc._id === managedProduct.headerCategoryId)?.name.toLowerCase() || "";
  const isPharmacy = selectedHeaderCatName.includes("pharmacy");
  const isProduce = selectedHeaderCatName.includes("vegetable") || selectedHeaderCatName.includes("fruit");
  const isGrocery = selectedHeaderCatName.includes("grocery");
  const isTeaCorner = selectedHeaderCatName.includes("tea corner") || selectedHeaderCatName.includes("pan corner");
  const isFoodBakery = (selectedHeaderCatName.includes("food") || selectedHeaderCatName.includes("bakery")) && !isTeaCorner && !isGrocery && !isPharmacy && !isProduce;
  const isElectronics = selectedHeaderCatName.includes("electronics");
  const isFashion = selectedHeaderCatName.includes("fashion") || selectedHeaderCatName.includes("apparel");
  const isBeauty = selectedHeaderCatName.includes("beauty") || selectedHeaderCatName.includes("care") || selectedHeaderCatName.includes("makeup");
  const isHomeKitchen = selectedHeaderCatName.includes("home") || selectedHeaderCatName.includes("kitchen");
  const isBabyKids = selectedHeaderCatName.includes("baby") || selectedHeaderCatName.includes("kids");
  const isSportsFitness = selectedHeaderCatName.includes("sports") || selectedHeaderCatName.includes("fitness");
  const isAutomotive = selectedHeaderCatName.includes("automotive");
  const isBooksStationery = selectedHeaderCatName.includes("book") || selectedHeaderCatName.includes("stationery");
  const isHealthWellness = selectedHeaderCatName.includes("health & wellness");
  const isPetSupplies = selectedHeaderCatName.includes("pet supplies");
  const isIndustrial = selectedHeaderCatName.includes("industrial");

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

        // Immediately load subcategories for the product's category
        // This ensures the subcategory dropdown is populated on first load
        const productData = response.data;
        const categoryId =
          typeof productData.category === "string"
            ? productData.category
            : (productData.category as any)?._id;

        if (categoryId) {
          getSubCategories({ category: categoryId }).then((res) => {
            if (res.success) setSubcategories(res.data);
          });
        }
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

  // Reload subcategories whenever admin changes the Main Category dropdown
  useEffect(() => {
    if (managedProduct.category) {
      const categoryId =
        typeof managedProduct.category === "string"
          ? managedProduct.category
          : (managedProduct.category as any)?._id;

      if (categoryId) {
        getSubCategories({ category: categoryId }).then((res) => {
          if (res.success) setSubcategories(res.data);
        });
      }
    }
  }, [managedProduct.category]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const isChecked = type === "checkbox" ? (e.target as any).checked : value;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setManagedProduct(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: isChecked
        }
      }));
    } else {
      setManagedProduct(prev => ({
        ...prev,
        [name]: isChecked,
      }));
      if (name === "brand" && value !== "other") {
        setManagedProduct(prev => ({ ...prev, brandName: "" }));
      }
    }
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
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Short Description</label>
                  <textarea 
                    name="smallDescription"
                    rows={2}
                    value={managedProduct.smallDescription || ""}
                    onChange={handleInputChange}
                    placeholder="Brief product summary..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Detailed Description</label>
                  <textarea 
                    name="description"
                    rows={4}
                    value={managedProduct.description || ""}
                    onChange={handleInputChange}
                    placeholder="Full product details, nutrition info, usage instructions..."
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
                      <option value="other">Other (Custom Brand)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Custom Brand Name</label>
                    <input 
                      type="text" 
                      name="brandName"
                      value={managedProduct.brandName || (typeof managedProduct.brand === 'object' ? (managedProduct.brand as any)?.name : '') || ""}
                      onChange={handleInputChange}
                      placeholder="Brand name as displayed to customers"
                      className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    />
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
                    name="discPrice"
                    value={managedProduct.discPrice ?? (managedProduct as any).variations?.[0]?.discPrice ?? 0}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none text-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Tax Rate</label>
                  <p className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm font-medium text-neutral-700">
                    {typeof managedProduct.tax === 'object' && managedProduct.tax 
                      ? `${(managedProduct.tax as any)?.rate || (managedProduct.tax as any)?.percentage || 0}% GST` 
                      : managedProduct.tax || 'No Tax'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">HSN Code</label>
                  <input 
                    type="text" 
                    name="hsnCode"
                    value={managedProduct.hsnCode || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Weight</label>
                  <input 
                    type="text" 
                    name="weight"
                    value={managedProduct.weight || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Color</label>
                  <input 
                    type="text" 
                    name="color"
                    value={managedProduct.color || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Size</label>
                  <input type="text" name="size" value={managedProduct.size || ""} onChange={handleInputChange} className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none" />
                </div>
              </div>
              <hr className="my-6 border-neutral-100" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Manufacturer</label>
                  <input type="text" name="manufacturer" value={managedProduct.manufacturer || ""} onChange={handleInputChange} className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Made In</label>
                  <input type="text" name="madeIn" value={managedProduct.madeIn || ""} onChange={handleInputChange} className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Allowed Qty / Order</label>
                  <input type="number" name="totalAllowedQuantity" value={managedProduct.totalAllowedQuantity || 0} onChange={handleInputChange} className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Returnable</label>
                  <select name="isReturnable" value={managedProduct.isReturnable ? "Yes" : "No"} onChange={(e) => setManagedProduct(prev => ({ ...prev, isReturnable: e.target.value === "Yes" }))} className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
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
                {(!managedProduct.galleryImages || managedProduct.galleryImages.length < 5) && (
                  <button className="aspect-square border-2 border-dashed border-neutral-300 rounded flex flex-col items-center justify-center text-neutral-400 hover:text-neutral-600 hover:border-neutral-400 transition-all">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <span className="text-[10px] mt-1 font-bold">ADD IMAGE</span>
                  </button>
                )}
              </div>
            </div>

            {/* Marketplace Compliance */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-md font-semibold mb-4 text-neutral-800 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                Compliance & Security
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">FSSAI License No.</label>
                  {managedProduct.fssaiLicNo?.startsWith('http') ? (
                    <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200 shadow-sm transition-all hover:border-teal-300">
                      <div className="flex items-center gap-2">
                        <span className="p-1 px-1.5 bg-emerald-100 text-emerald-700 rounded text-[8px] font-black uppercase">Verified ID</span>
                        <span className="text-[10px] font-mono text-neutral-500 truncate max-w-[120px]">Document Image</span>
                      </div>
                      <a href={managedProduct.fssaiLicNo} target="_blank" rel="noreferrer" className="px-3 py-1 bg-white border border-teal-200 text-teal-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-teal-50 shadow-sm active:scale-95 transition-all">View</a>
                    </div>
                  ) : (
                    <input type="text" name="fssaiLicNo" value={managedProduct.fssaiLicNo || ""} onChange={handleInputChange} placeholder="N/A" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">GST Number</label>
                  {managedProduct.gstNumber?.startsWith('http') ? (
                    <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200 shadow-sm transition-all hover:border-blue-300">
                      <div className="flex items-center gap-2">
                        <span className="p-1 px-1.5 bg-blue-100 text-blue-700 rounded text-[8px] font-black uppercase tracking-tight">Verified GST</span>
                        <span className="text-[10px] font-mono text-neutral-500 truncate max-w-[120px]">Document Image</span>
                      </div>
                      <a href={managedProduct.gstNumber} target="_blank" rel="noreferrer" className="px-3 py-1 bg-white border border-blue-200 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-50 shadow-sm active:scale-95 transition-all">View</a>
                    </div>
                  ) : (
                    <input type="text" name="gstNumber" value={managedProduct.gstNumber || ""} onChange={handleInputChange} placeholder="N/A" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" />
                  )}
                </div>
              </div>
            </div>

            {/* Category Attributes - Dynamic */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-md font-semibold mb-4 text-neutral-800 flex items-center gap-2 uppercase tracking-widest border-b border-neutral-100 pb-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                Technical Specifications
              </h2>
              
              {!isPharmacy && !isProduce && !isGrocery && !isIndustrial && !isElectronics && !isFashion && !isBeauty && !isHomeKitchen && !isBabyKids && !isSportsFitness && !isAutomotive && !isBooksStationery && !isHealthWellness && !isPetSupplies ? (
                <p className="text-sm text-neutral-500 italic">No additional attributes for this category.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* General Features (Jain, Spicy Level, preparation time) */}
                  {(isFoodBakery || isProduce || isGrocery || isPharmacy || isTeaCorner) && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Spicy Level</label>
                        <select name="spicyLevel" value={managedProduct.spicyLevel || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold">
                          <option value="">None</option>
                          <option value="Mild">Mild</option>
                          <option value="Medium">Medium</option>
                          <option value="Hot">Hot</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Jain Friendly</label>
                        <select name="isJain" value={managedProduct.isJain ? "Yes" : "No"} onChange={(e) => setManagedProduct(prev => ({ ...prev, isJain: e.target.value === "Yes" }))} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold">
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Food Type</label>
                        <select name="foodType" value={managedProduct.foodType || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold">
                          <option value="">N/A</option>
                          <option value="Veg">Veg</option>
                          <option value="Non-Veg">Non-Veg</option>
                          <option value="Egg">Egg</option>
                        </select>
                      </div>
                    </>
                  )}
                  {isPharmacy && managedProduct.pharmacy && (
                    <>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Medicine Type</label><input type="text" name="pharmacy.medicineType" value={managedProduct.pharmacy.medicineType || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Composition</label><input type="text" name="pharmacy.composition" value={managedProduct.pharmacy.composition || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Manufacturer</label><input type="text" name="pharmacy.manufacturerName" value={managedProduct.pharmacy.manufacturerName || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                    </>
                  )}
                  {isElectronics && managedProduct.electronics && (
                    <>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Model Number</label><input type="text" name="electronics.modelNumber" value={managedProduct.electronics.modelNumber || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Condition</label><select name="electronics.productCondition" value={managedProduct.electronics.productCondition || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="New">New</option><option value="Refurbished">Refurbished</option><option value="Used">Used</option></select></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Warranty</label><input type="text" name="electronics.warrantyPeriod" value={managedProduct.electronics.warrantyPeriod || ""} onChange={handleInputChange} placeholder="e.g. 1 Year" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                    </>
                  )}
                  {isFashion && managedProduct.fashionApparel && (
                    <>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Gender</label><select name="fashionApparel.gender" value={managedProduct.fashionApparel?.gender || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="Men">Men</option><option value="Women">Women</option><option value="Unisex">Unisex</option><option value="Kids">Kids</option></select></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Fabric</label><input type="text" name="fashionApparel.fabricType" value={managedProduct.fashionApparel?.fabricType || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Fit</label><input type="text" name="fashionApparel.fitType" value={managedProduct.fashionApparel?.fitType || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                    </>
                  )}
                  {isIndustrial && managedProduct.industrialBusiness && (
                    <>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Usage Type</label><input type="text" name="industrialBusiness.usageType" value={managedProduct.industrialBusiness?.usageType || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Power Source</label><input type="text" name="industrialBusiness.powerSource" value={managedProduct.industrialBusiness?.powerSource || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Model No</label><input type="text" name="industrialBusiness.modelNumber" value={managedProduct.industrialBusiness?.modelNumber || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                    </>
                  )}
                  {isPetSupplies && managedProduct.petSupplies && (
                    <>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Pet Type</label><input type="text" name="petSupplies.petType" value={managedProduct.petSupplies?.petType || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Breed Size</label><input type="text" name="petSupplies.breedSize" value={managedProduct.petSupplies?.breedSize || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Life Stage</label><input type="text" name="petSupplies.lifeStage" value={managedProduct.petSupplies?.lifeStage || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                    </>
                  )}
                  {isProduce && managedProduct.freshProduce && (
                    <>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Type</label><input type="text" name="freshProduce.type" value={managedProduct.freshProduce.type || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Shelf Life</label><input type="text" name="freshProduce.shelfLife" value={managedProduct.freshProduce.shelfLife || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Is Organic</label><select name="freshProduce.isOrganic" value={managedProduct.freshProduce.isOrganic ? "Yes" : "No"} onChange={(e) => setManagedProduct(prev => ({ ...prev, freshProduce: { ...prev.freshProduce, isOrganic: e.target.value === "Yes" } }))} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                    </>
                  )}
                  {isGrocery && managedProduct.grocery && (
                    <>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Unit Type</label><input type="text" name="grocery.unitType" value={managedProduct.grocery.unitType || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Min Order Qty</label><input type="number" name="grocery.minOrderQuantity" value={managedProduct.grocery.minOrderQuantity || 1} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Brand</label><input type="text" name="grocery.brand" value={managedProduct.grocery.brand || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                    </>
                  )}
                  {isBeauty && managedProduct.beautyPersonalCare && (
                    <>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Skin Type</label><input type="text" name="beautyPersonalCare.skinType" value={managedProduct.beautyPersonalCare.skinType || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Ingredients</label><input type="text" name="beautyPersonalCare.ingredients" value={managedProduct.beautyPersonalCare.ingredients || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Expiry</label><input type="text" name="beautyPersonalCare.expiryDate" value={managedProduct.beautyPersonalCare.expiryDate || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                    </>
                  )}
                  {isHomeKitchen && managedProduct.homeKitchen && (
                    <>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Material</label><input type="text" name="homeKitchen.material" value={managedProduct.homeKitchen.material || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Usage</label><input type="text" name="homeKitchen.usageType" value={managedProduct.homeKitchen.usageType || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Warranty</label><input type="text" name="homeKitchen.warranty" value={managedProduct.homeKitchen.warranty || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                    </>
                  )}
                  {isBabyKids && managedProduct.babyKids && (
                    <>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Age Group</label><input type="text" name="babyKids.ageGroup" value={managedProduct.babyKids.ageGroup || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Safety Cert</label><input type="text" name="babyKids.safetyCertification" value={managedProduct.babyKids.safetyCertification || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                    </>
                  )}

                  {/* SPORTS & FITNESS SECTION */}
                  {isSportsFitness && managedProduct.sportsFitness && (
                    <>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Sport Type</label><input type="text" name="sportsFitness.sportType" value={managedProduct.sportsFitness.sportType || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Skill Level</label><input type="text" name="sportsFitness.skillLevel" value={managedProduct.sportsFitness.skillLevel || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                    </>
                  )}

                  {/* AUTOMOTIVE SECTION */}
                  {isAutomotive && managedProduct.automotive && (
                    <>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Vehicle Type</label><input type="text" name="automotive.vehicleType" value={managedProduct.automotive.vehicleType || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Compatible Model</label><input type="text" name="automotive.compatibleModel" value={managedProduct.automotive.compatibleModel || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                    </>
                  )}

                  {/* BOOKS & STATIONERY SECTION */}
                  {isBooksStationery && managedProduct.booksStationery && (
                    <>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">ISBN</label><input type="text" name="booksStationery.isbn" value={managedProduct.booksStationery.isbn || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Author</label><input type="text" name="booksStationery.author" value={managedProduct.booksStationery.author || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                    </>
                  )}
                  
                  {/* HEALTH & WELLNESS SECTION */}
                  {isHealthWellness && managedProduct.healthWellness && (
                    <>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Ingredients</label><input type="text" name="healthWellness.ingredients" value={managedProduct.healthWellness.ingredients || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Benefit</label><input type="text" name="healthWellness.healthBenefit" value={managedProduct.healthWellness.healthBenefit || ""} onChange={handleInputChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Variations & Addons Card */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-md font-semibold mb-4 text-neutral-800 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                Variations & Add-ons
              </h2>
              <div className="space-y-6">
                {managedProduct.variations && managedProduct.variations.length > 0 ? (
                  <div>
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Product Variations</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {managedProduct.variations.map((v, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded bg-white flex items-center justify-center font-bold text-[10px] text-teal-600 shadow-sm">{i + 1}</div>
                            <div>
                              <p className="text-sm font-bold text-neutral-800">{v.title || v.name}</p>
                              <p className="text-[10px] text-neutral-400 font-mono">STOCK: {v.stock} | SKU: {v.sku || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-teal-600">₹{v.discPrice || v.price}</p>
                            {v.discPrice > 0 && <p className="text-[10px] text-neutral-400 line-through">₹{v.price}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 italic">No variations found for this product.</p>
                )}

                <hr className="border-neutral-100" />

                {managedProduct.addons && managedProduct.addons.length > 0 ? (
                  <div>
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Customization / Add-ons</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {managedProduct.addons.map((a, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-lg border border-neutral-100">
                          <span className="text-xs font-medium text-neutral-700">{a.name}</span>
                          <span className="text-xs font-black text-teal-600">+₹{a.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 italic">No add-ons available.</p>
                )}
              </div>
            </div>

            {/* SEO Section */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-md font-semibold mb-4 text-neutral-800 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                SEO & Metadata
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">SEO Meta Title</label>
                  <input 
                    type="text" 
                    name="seoTitle"
                    value={managedProduct.seoTitle || ""}
                    onChange={handleInputChange}
                    placeholder="Search engine title..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">SEO Keywords</label>
                  <input 
                    type="text" 
                    name="seoKeywords"
                    value={managedProduct.seoKeywords || ""}
                    onChange={handleInputChange}
                    placeholder="keyword1, keyword2..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">SEO Description</label>
                  <textarea 
                    name="seoDescription"
                    rows={2}
                    value={managedProduct.seoDescription || ""}
                    onChange={handleInputChange}
                    placeholder="Search engine snippet..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-teal-500"
                  ></textarea>
                </div>
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
                    onChange={(e) => {
                      const val = e.target.value;
                      setManagedProduct(prev => ({ ...prev, subcategory: val || undefined }));
                    }}
                    className="w-full bg-neutral-50 border-none rounded py-2 text-sm focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select Subcategory</option>
                    {subcategories.map((sc: any) => (
                      <option key={sc._id} value={sc._id}>
                        {/* Support both old SubCategory (name) and new Category-based subcategory (subcategoryName or name) */}
                        {sc.subcategoryName || sc.name || "Unknown"}
                      </option>
                    ))}
                  </select>
                  {/* Show currently saved subcategory name if list is still loading */}
                  {subcategories.length === 0 && managedProduct.subcategory && (
                    <p className="text-xs text-amber-600 mt-1">
                      Saved: {typeof managedProduct.subcategory === "object" 
                        ? (managedProduct.subcategory as any)?.name 
                        : "(loading subcategory list...)"
                      }
                    </p>
                  )}
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
