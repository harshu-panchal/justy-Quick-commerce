import { useState, useEffect } from "react";
import { getProducts, type Product } from "../../../services/api/admin/adminProductService";
import { 
  getAllComboOffers, 
  createComboOffer, 
  updateComboOffer, 
  deleteComboOffer, 
  ComboOffer 
} from "../../../services/api/admin/adminComboService";

export default function AdminComboOffers() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [combos, setCombos] = useState<ComboOffer[]>([]);
  const [loadingCombos, setLoadingCombos] = useState(true);

  // Form state
  const [comboName, setComboName] = useState("");
  const [selectedMainProduct, setSelectedMainProduct] = useState("");
  const [selectedComboProducts, setSelectedComboProducts] = useState<string[]>([]);
  const [comboPrice, setComboPrice] = useState("");
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
    } catch (err) {
      console.error("Failed to fetch combo offers", err);
    } finally {
      setLoadingCombos(false);
    }
  };

  const getProductName = (id: string | any) => {
    // If it's a populated object from backend
    if (typeof id === 'object' && id !== null && id.productName) return id.productName;
    
    // Otherwise it's just an ID string, find it in our local state
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

    // Attempt to calculate original price so that backend validation passes
    const mainPrice = getProductPrice(selectedMainProduct);
    const comboPrices = selectedComboProducts.reduce((sum, id) => sum + getProductPrice(id), 0);
    const originalPrice = mainPrice + comboPrices;

    if (Number(comboPrice) >= originalPrice) {
      setFormError("Combo price must be strictly less than the original price of the combined items.");
      return;
    }

    // Auto-generate name if user didn't provide one
    const generatedName = comboName.trim() || `Combo: ${getProductName(selectedMainProduct)} + ${selectedComboProducts.length} more`;

    const payload: Partial<ComboOffer> = {
      name: generatedName,
      mainProduct: selectedMainProduct,
      comboProducts: selectedComboProducts,
      comboPrice: Number(comboPrice),
      isActive: true,
    };

    try {
      if (editingId) {
        await updateComboOffer(editingId, payload);
      } else {
        await createComboOffer(payload);
      }
      
      resetForm();
      fetchCombos(); // Refresh list from backend
    } catch (err: any) {
       setFormError(err.message || "Failed to save combo offer.");
    }
  };

  const resetForm = () => {
    setComboName("");
    setSelectedMainProduct("");
    setSelectedComboProducts([]);
    setComboPrice("");
    setFormError("");
    setEditingId(null);
    setSearchMain("");
    setSearchCombo("");
  };

  const handleEdit = (combo: ComboOffer) => {
    setEditingId(combo._id || null);
    setComboName(combo.name || "");
    // Extract ID if it's an object from DB population
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

  // Calculate original total for display
  const calculateOriginalTotal = () => {
    const mainPrice = selectedMainProduct ? getProductPrice(selectedMainProduct) : 0;
    const comboPrices = selectedComboProducts.reduce((s: number, id: string) => s + getProductPrice(id), 0);
    return mainPrice + comboPrices;
  };

  const originalTotal = calculateOriginalTotal();
  const savings = comboPrice ? originalTotal - Number(comboPrice) : 0;

  // Filter products for search
  const filteredMainProducts = products.filter((p: Product) =>
    p.productName.toLowerCase().includes(searchMain.toLowerCase())
  );
  const filteredComboProducts = products.filter(
    (p: Product) =>
      p._id !== selectedMainProduct &&
      p.productName.toLowerCase().includes(searchCombo.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 p-6">
        {/* Header */}
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

        {/* Add / Edit Combo Section */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
          <div className="bg-teal-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editingId ? "Edit Combo Offer" : "Add Combo Offer"}
            </h2>
            {editingId && (
              <button
                onClick={resetForm}
                className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {formError}
              </div>
            )}

            {loadingProducts ? (
              <div className="text-center py-8 text-neutral-500">Loading products...</div>
            ) : (
              <>
                {/* Main Product Selection */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Main Product <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Search main product..."
                    value={searchMain}
                    onChange={(e) => setSearchMain(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded">
                    {filteredMainProducts.length === 0 ? (
                      <div className="p-3 text-sm text-neutral-400">No products found</div>
                    ) : (
                      filteredMainProducts.map((p) => (
                        <label
                          key={p._id}
                          className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-teal-50 transition-colors border-b border-neutral-100 last:border-b-0 ${selectedMainProduct === p._id ? "bg-teal-50" : ""
                            }`}
                        >
                          <input
                            type="radio"
                            name="mainProduct"
                            value={p._id}
                            checked={selectedMainProduct === p._id}
                            onChange={() => {
                              setSelectedMainProduct(p._id);
                              // Remove from combo if selected as main
                              setSelectedComboProducts((prev: string[]) =>
                                prev.filter((id: string) => id !== p._id)
                              );
                            }}
                            className="accent-teal-600"
                          />
                          {p.mainImage && (
                            <img
                              src={p.mainImage}
                              alt={p.productName}
                              className="w-8 h-8 rounded object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <span className="text-sm text-neutral-700">{p.productName}</span>
                          <span className="text-xs text-neutral-400 ml-auto">
                            ₹{getProductPrice(p._id)}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  {selectedMainProduct && (
                    <div className="mt-2 text-sm text-teal-700 font-medium">
                      ✓ Selected: {getProductName(selectedMainProduct)}
                    </div>
                  )}
                </div>

                {/* Combo Products Selection */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Combo Products <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Search combo products..."
                    value={searchCombo}
                    onChange={(e) => setSearchCombo(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded">
                    {filteredComboProducts.length === 0 ? (
                      <div className="p-3 text-sm text-neutral-400">
                        {selectedMainProduct
                          ? "No other products found"
                          : "Select a main product first"}
                      </div>
                    ) : (
                      filteredComboProducts.map((p) => (
                        <label
                          key={p._id}
                          className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-teal-50 transition-colors border-b border-neutral-100 last:border-b-0 ${selectedComboProducts.includes(p._id) ? "bg-teal-50" : ""
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedComboProducts.includes(p._id)}
                            onChange={() => handleToggleComboProduct(p._id)}
                            className="accent-teal-600"
                          />
                          {p.mainImage && (
                            <img
                              src={p.mainImage}
                              alt={p.productName}
                              className="w-8 h-8 rounded object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <span className="text-sm text-neutral-700">{p.productName}</span>
                          <span className="text-xs text-neutral-400 ml-auto">
                            ₹{getProductPrice(p._id)}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  {selectedComboProducts.length > 0 && (
                    <div className="mt-2 text-sm text-teal-700">
                      ✓ {selectedComboProducts.length} product(s) selected
                    </div>
                  )}
                </div>

                {/* Combo Price + Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Combo Offer Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={comboPrice}
                      onChange={(e) => setComboPrice(e.target.value)}
                      placeholder="Enter combo price"
                      className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    />
                  </div>
                  {selectedMainProduct && selectedComboProducts.length > 0 && comboPrice && (
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-neutral-700 mb-1">Preview</div>
                      <div className="text-xs text-neutral-600 mb-2">
                        {getProductName(selectedMainProduct)} +{" "}
                        {selectedComboProducts.map(getProductName).join(" + ")}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-teal-700">₹{comboPrice}</span>
                        {originalTotal > 0 && (
                          <span className="text-sm text-neutral-500 line-through">
                            ₹{originalTotal}
                          </span>
                        )}
                        {savings > 0 && (
                          <span className="text-sm font-semibold text-green-600">
                            Save ₹{savings}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 rounded font-medium transition-colors bg-green-600 hover:bg-green-700 text-white"
                >
                  {editingId ? "Update Combo Offer" : "Save Combo Offer"}
                </button>
              </>
            )}
          </form>
        </div>

        {/* Existing Combos List */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-800">
              Existing Combo Offers ({combos.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-xs font-bold text-neutral-800 border-b border-neutral-200">
                  <th className="p-4">Sr No.</th>
                  <th className="p-4">Main Product</th>
                  <th className="p-4">Combo Products</th>
                  <th className="p-4">Combo Price</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {combos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-neutral-400">
                      No combo offers yet. Create one above.
                    </td>
                  </tr>
                ) : (
                  combos.map((combo: ComboOffer, i: number) => (
                    <tr
                      key={combo._id}
                      className={`hover:bg-neutral-50 transition-colors text-sm text-neutral-700 border-b border-neutral-200 ${!combo.isActive ? "opacity-50" : ""}`}
                    >
                      <td className="p-4 align-middle">{i + 1}</td>
                      <td className="p-4 align-middle font-medium">
                        {getProductName(combo.mainProduct)}
                        <br/>
                        <span className="text-xs text-neutral-400">{combo.name}</span>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex flex-wrap gap-1">
                          {combo.comboProducts.map((p: any, idx: number) => (
                            <span
                              key={idx}
                              className="inline-block bg-teal-50 text-teal-700 text-xs px-2 py-0.5 rounded-full"
                            >
                              {getProductName(p)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 align-middle font-semibold text-teal-700">
                        ₹{combo.comboPrice}
                        <div className="text-xs text-neutral-400 line-through">₹{combo.originalPrice}</div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(combo)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            title="Edit"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(combo._id)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            title="Delete"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-sm text-neutral-600 border-t border-neutral-200 bg-white">
        Copyright © 2025. Developed By{" "}
        <a href="#" className="text-blue-600 hover:underline">
          Jasti - 10 Minute App
        </a>
      </footer>
    </div>
  );
}
