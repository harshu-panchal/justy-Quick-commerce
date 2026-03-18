import { useState, useEffect } from "react";
import { getProducts, type Product } from "../../../services/api/admin/adminProductService";
import { 
  getAllComboOffers, 
  createComboOffer, 
  updateComboOffer, 
  deleteComboOffer, 
  getPendingSellerCombos,
  approveSellerCombo,
  rejectSellerCombo,
  ComboOffer 
} from "../../../services/api/admin/adminComboService";

export default function AdminComboOffers() {
  const [activeTab, setActiveTab] = useState<"admin" | "seller">("admin");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [combos, setCombos] = useState<ComboOffer[]>([]);
  const [pendingCombos, setPendingCombos] = useState<ComboOffer[]>([]);
  const [loadingCombos, setLoadingCombos] = useState(true);

  // Form state
  const [comboName, setComboName] = useState("");
  const [selectedMainProduct, setSelectedMainProduct] = useState("");
  const [selectedComboProducts, setSelectedComboProducts] = useState<string[]>([]);
  const [comboPrice, setComboPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchMain, setSearchMain] = useState("");
  const [searchCombo, setSearchCombo] = useState("");

  // Fetch products and combos
  useEffect(() => {
    (async () => {
      try {
        setLoadingProducts(true);
        const res = await getProducts({ limit: 500 });
        if (res.success && res.data) {
          setProducts(res.data);
        }
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoadingProducts(false);
      }
      
      fetchCombos();
    })();
  }, []);

  const fetchCombos = async () => {
    try {
      setLoadingCombos(true);
      const res = await getAllComboOffers();
      if (res.success && res.data) {
        setCombos(res.data);
      }
      
      const pendingRes = await getPendingSellerCombos();
      if (pendingRes.success && pendingRes.data) {
        setPendingCombos(pendingRes.data);
      }
    } catch (err) {
      console.error("Failed to fetch combo offers", err);
    } finally {
      setLoadingCombos(false);
    }
  };

  const getProductName = (id: string | any) => {
    if (typeof id === 'object' && id !== null && id.productName) return id.productName;
    const p = products.find((pr: Product) => pr._id === id);
    return p?.productName || id;
  };

  const getProductPrice = (id: string | any) => {
    if (typeof id === 'object' && id !== null && id.price !== undefined) {
       return id.price;
    }
    const p = products.find((pr: Product) => pr._id === id);
    if (!p) return 0;
    if (p.variations && p.variations.length > 0) {
      return p.variations[0].price || 0;
    }
    return p.price || 0;
  };

  const handleToggleComboProduct = (id: string) => {
    setSelectedComboProducts((prev: string[]) =>
      prev.includes(id) ? prev.filter((x: string) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedMainProduct) {
      setFormError("Please select a main product.");
      return;
    }
    if (selectedComboProducts.length === 0) {
      setFormError("Please select at least one combo product.");
      return;
    }
    if (!comboPrice || Number(comboPrice) <= 0) {
      setFormError("Please enter a valid combo price.");
      return;
    }

    const mainPrice = getProductPrice(selectedMainProduct);
    const comboPrices = selectedComboProducts.reduce((sum, id) => sum + getProductPrice(id), 0);
    const originalPrice = mainPrice + comboPrices;

    if (Number(comboPrice) >= originalPrice) {
      setFormError("Combo price must be strictly less than the original price of the combined items.");
      return;
    }

    const generatedName = comboName.trim() || `Combo: ${getProductName(selectedMainProduct)} + ${selectedComboProducts.length} more`;

    const payload: Partial<ComboOffer> = {
      name: generatedName,
      description,
      mainProduct: selectedMainProduct,
      comboProducts: selectedComboProducts,
      comboPrice: Number(comboPrice),
      image,
      isActive: true,
    };

    try {
      if (editingId) {
        await updateComboOffer(editingId, payload);
      } else {
        await createComboOffer(payload);
      }
      resetForm();
      fetchCombos();
    } catch (err: any) {
       setFormError(err.message || "Failed to save combo offer.");
    }
  };

  const resetForm = () => {
    setComboName("");
    setSelectedMainProduct("");
    setSelectedComboProducts([]);
    setComboPrice("");
    setDescription("");
    setImage("");
    setFormError("");
    setEditingId(null);
    setSearchMain("");
    setSearchCombo("");
  };

  const handleEdit = (combo: any) => {
    setEditingId(combo._id || null);
    setComboName(combo.name || "");
    setDescription(combo.description || "");
    setImage(combo.image || "");
    setSelectedMainProduct(typeof combo.mainProduct === 'object' ? combo.mainProduct._id : combo.mainProduct);
    setSelectedComboProducts(combo.comboProducts.map((p: any) => typeof p === 'object' ? p._id : p));
    setComboPrice(combo.comboPrice.toString());
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (confirm("Are you sure you want to delete this combo offer?")) {
      try {
        await deleteComboOffer(id);
        if (editingId === id) resetForm();
        fetchCombos();
      } catch (err) {
        alert("Failed to delete combo offer.");
      }
    }
  };

  const handleApprove = async (id: string) => {
    if (confirm("Are you sure you want to approve this combo?")) {
      try {
        await approveSellerCombo(id);
        fetchCombos();
        alert("Combo approved successfully!");
      } catch (err) {
        alert("Failed to approve combo.");
      }
    }
  };

  const handleReject = async (id: string) => {
    if (confirm("Are you sure you want to reject this combo?")) {
      try {
        await rejectSellerCombo(id);
        fetchCombos();
        alert("Combo rejected and removed.");
      } catch (err) {
        alert("Failed to reject combo.");
      }
    }
  };

  const calculateOriginalTotal = () => {
    const mainPrice = selectedMainProduct ? getProductPrice(selectedMainProduct) : 0;
    const comboPrices = selectedComboProducts.reduce((s: number, id: string) => s + getProductPrice(id), 0);
    return mainPrice + comboPrices;
  };

  const originalTotal = calculateOriginalTotal();
  const savings = comboPrice ? originalTotal - Number(comboPrice) : 0;

  const filteredMainProducts = products.filter((p: Product) =>
    p.productName.toLowerCase().includes(searchMain.toLowerCase())
  );
  const filteredComboProducts = products.filter(
    (p: Product) =>
      p._id !== selectedMainProduct &&
      p.productName.toLowerCase().includes(searchCombo.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-neutral-800">
            Combo Offer Management
          </h1>
          <div className="text-sm">
            <span className="text-blue-600 hover:underline cursor-pointer">Home</span>
            <span className="text-neutral-400 mx-1">/</span>
            <span className="text-neutral-600">Combo Offers</span>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("admin")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "admin" ? "bg-teal-600 text-white shadow-sm" : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"}`}
          >
            Admin Combos
          </button>
          <button
            onClick={() => setActiveTab("seller")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "seller" ? "bg-teal-600 text-white shadow-sm" : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"}`}
          >
            Seller Requests ({pendingCombos.length})
          </button>
        </div>

        {activeTab === "admin" ? (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
              <div className="bg-teal-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {editingId ? "Edit Combo Offer" : "Add Combo Offer"}
                </h2>
                {editingId && (
                  <button onClick={resetForm} className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors">
                    Cancel Edit
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{formError}</div>}
                
                {loadingProducts ? <div className="text-center py-8 text-neutral-500">Loading products...</div> : (
                  <>
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Main Product <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="Search main product..." value={searchMain} onChange={(e) => setSearchMain(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-teal-500 outline-none mb-2" />
                      <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded">
                        {filteredMainProducts.map((p) => (
                          <label key={p._id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-teal-50 border-b last:border-0 ${selectedMainProduct === p._id ? "bg-teal-50" : ""}`}>
                            <input type="radio" checked={selectedMainProduct === p._id} onChange={() => setSelectedMainProduct(p._id)} className="accent-teal-600" />
                            {p.mainImage && <img src={p.mainImage} alt="" className="w-8 h-8 rounded object-cover" />}
                            <span className="text-sm text-neutral-700">{p.productName}</span>
                            <span className="text-xs text-neutral-400 ml-auto">₹{getProductPrice(p._id)}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="mb-5">
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Combo Products <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="Search combo products..." value={searchCombo} onChange={(e) => setSearchCombo(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-teal-500 outline-none mb-2" />
                      <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded">
                        {filteredComboProducts.map((p) => (
                          <label key={p._id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-teal-50 border-b last:border-0 ${selectedComboProducts.includes(p._id) ? "bg-teal-50" : ""}`}>
                            <input type="checkbox" checked={selectedComboProducts.includes(p._id)} onChange={() => handleToggleComboProduct(p._id)} className="accent-teal-600" />
                            {p.mainImage && <img src={p.mainImage} alt="" className="w-8 h-8 rounded object-cover" />}
                            <span className="text-sm text-neutral-700">{p.productName}</span>
                            <span className="text-xs text-neutral-400 ml-auto">₹{getProductPrice(p._id)}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                      <input type="number" value={comboPrice} onChange={(e) => setComboPrice(e.target.value)} placeholder="Combo Price (₹)"
                        className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" />
                      <input type="text" value={comboName} onChange={(e) => setComboName(e.target.value)} placeholder="Combo Name (Optional)"
                        className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-teal-500 outline-none" />
                    </div>

                    {selectedMainProduct && selectedComboProducts.length > 0 && comboPrice && (
                      <div className="mb-5 bg-teal-50 border border-teal-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-teal-700">₹{comboPrice}</span>
                          <span className="text-sm text-neutral-500 line-through">₹{originalTotal}</span>
                          <span className="text-sm font-semibold text-green-600">Save ₹{savings}</span>
                        </div>
                      </div>
                    )}
                    <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded transition-colors">
                      {editingId ? "Update Combo Offer" : "Save Combo Offer"}
                    </button>
                  </>
                )}
              </form>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
              <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
                <h2 className="text-lg font-semibold text-neutral-800">Existing Combo Offers ({combos.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-neutral-50 text-xs font-bold uppercase text-neutral-500 border-b">
                    <tr><th className="p-4">Sr.</th><th className="p-4">Products</th><th className="p-4">Price</th><th className="p-4">Action</th></tr>
                  </thead>
                  <tbody>
                    {combos.map((combo, i) => (
                      <tr key={combo._id} className="text-sm border-b last:border-0 hover:bg-neutral-50">
                        <td className="p-4">{i + 1}</td>
                        <td className="p-4 capitalize">
                          <div className="font-bold">{combo.name}</div>
                          <div className="text-xs text-neutral-400">
                            {getProductName(combo.mainProduct)} + {combo.comboProducts.map(getProductName).join(", ")}
                          </div>
                          <span className="text-[10px] text-teal-600 font-semibold">{combo.creatorType === "seller" ? `Seller: ${combo.sellerId?.storeName || combo.sellerId?.sellerName || 'Unknown'}` : 'Admin'}</span>
                        </td>
                        <td className="p-4 font-bold text-teal-700">₹{combo.comboPrice}</td>
                        <td className="p-4 flex gap-2">
                           <button onClick={() => handleEdit(combo)} className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Edit</button>
                           <button onClick={() => handleDelete(combo._id)} className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <h2 className="text-lg font-semibold text-neutral-800">Pending Seller Requests ({pendingCombos.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-neutral-50 text-xs font-bold uppercase text-neutral-500 border-b">
                  <tr><th className="p-4">Seller</th><th className="p-4">Combo</th><th className="p-4">Price</th><th className="p-4 text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y">
                  {pendingCombos.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-neutral-400">No pending requests.</td></tr> : (
                    pendingCombos.map((combo) => (
                      <tr key={combo._id} className="text-sm hover:bg-neutral-50">
                        <td className="p-4 font-medium">{combo.sellerId?.storeName || combo.sellerId?.sellerName || "Unknown"}</td>
                        <td className="p-4">
                          <div className="font-bold">{combo.name}</div>
                          <div className="text-xs text-neutral-500">{getProductName(combo.mainProduct)} + {combo.comboProducts.length} items</div>
                        </td>
                        <td className="p-4 font-bold text-teal-700">₹{combo.comboPrice}</td>
                        <td className="p-4 text-right space-x-2">
                          <button onClick={() => handleApprove(combo._id!)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
                          <button onClick={() => handleReject(combo._id!)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Reject</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-sm text-neutral-500 border-t bg-white">
        Copyright © 2025. Developed By <a href="#" className="text-blue-600 font-medium">Jasti - 10 Minute App</a>
      </footer>
    </div>
  );
}
