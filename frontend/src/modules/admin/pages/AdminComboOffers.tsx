import { useState, useEffect } from "react";
import { getProducts, type Product } from "../../../services/api/admin/adminProductService";

interface ComboOffer {
  id: string;
  productId: string;
  productName: string;
  comboProducts: string[];
  comboProductNames: string[];
  comboPrice: number;
}

const STORAGE_KEY = "comboOffers";

function loadCombos(): ComboOffer[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCombos(combos: ComboOffer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(combos));
}

export default function AdminComboOffers() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [combos, setCombos] = useState<ComboOffer[]>(loadCombos);

  // Form state
  const [selectedMainProduct, setSelectedMainProduct] = useState("");
  const [selectedComboProducts, setSelectedComboProducts] = useState<string[]>([]);
  const [comboPrice, setComboPrice] = useState("");
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchMain, setSearchMain] = useState("");
  const [searchCombo, setSearchCombo] = useState("");

  // Fetch products
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
    })();
  }, []);

  const getProductName = (id: string) => {
    const p = products.find((pr: Product) => pr._id === id);
    return p?.productName || id;
  };

  const getProductPrice = (id: string) => {
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

  const handleSubmit = (e: React.FormEvent) => {
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

    const newCombo: ComboOffer = {
      id: editingId || Date.now().toString(),
      productId: selectedMainProduct,
      productName: getProductName(selectedMainProduct),
      comboProducts: selectedComboProducts,
      comboProductNames: selectedComboProducts.map(getProductName),
      comboPrice: Number(comboPrice),
    };

    let updated: ComboOffer[];
    if (editingId) {
      updated = combos.map((c: ComboOffer) => (c.id === editingId ? newCombo : c));
    } else {
      updated = [...combos, newCombo];
    }

    saveCombos(updated);
    setCombos(updated);
    resetForm();
  };

  const resetForm = () => {
    setSelectedMainProduct("");
    setSelectedComboProducts([]);
    setComboPrice("");
    setFormError("");
    setEditingId(null);
    setSearchMain("");
    setSearchCombo("");
  };

  const handleEdit = (combo: ComboOffer) => {
    setEditingId(combo.id);
    setSelectedMainProduct(combo.productId);
    setSelectedComboProducts(combo.comboProducts);
    setComboPrice(combo.comboPrice.toString());
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: string) => {
    const updated = combos.filter((c: ComboOffer) => c.id !== id);
    saveCombos(updated);
    setCombos(updated);
    if (editingId === id) resetForm();
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
                      key={combo.id}
                      className="hover:bg-neutral-50 transition-colors text-sm text-neutral-700 border-b border-neutral-200"
                    >
                      <td className="p-4 align-middle">{i + 1}</td>
                      <td className="p-4 align-middle font-medium">
                        {combo.productName}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex flex-wrap gap-1">
                          {combo.comboProductNames.map((name: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-block bg-teal-50 text-teal-700 text-xs px-2 py-0.5 rounded-full"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 align-middle font-semibold text-teal-700">
                        ₹{combo.comboPrice}
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
                            onClick={() => handleDelete(combo.id)}
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
