import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getProducts, type Product } from "../../../services/api/productService";
import { 
  getMyComboOffers, 
  createSellerCombo, 
  deleteMyComboOffer, 
  ComboOffer 
} from "../../../services/api/seller/sellerComboService";

export default function SellerComboOffers() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [combos, setCombos] = useState<ComboOffer[]>([]);
  const [loadingCombos, setLoadingCombos] = useState(true);
  const { user } = useAuth();

  // Memoized filtered products to double-ensure only own products are shown
  const myProducts = useMemo(() => {
    if (!user) return [];
    return products.filter((p: any) => {
      const pSellerId = typeof p.seller === 'object' ? p.seller?._id || p.seller?.id : p.seller;
      return pSellerId === user.id || pSellerId === user._id;
    });
  }, [products, user]);

  // Form state
  const [comboName, setComboName] = useState("");
  const [selectedMainProduct, setSelectedMainProduct] = useState("");
  const [selectedComboProducts, setSelectedComboProducts] = useState<string[]>([]);
  const [comboPrice, setComboPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [formError, setFormError] = useState("");
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
      const res = await getMyComboOffers();
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
    if (typeof id === 'object' && id !== null && id.productName) return id.productName;
    const p = myProducts.find((pr: Product) => pr._id === id);
    return p?.productName || id;
  };

  const getProductPrice = (id: string | any) => {
    if (typeof id === 'object' && id !== null && id.price !== undefined) {
       return id.price;
    }
    const p = myProducts.find((pr: Product) => pr._id === id);
    if (!p) return 0;
    if (p.variations && p.variations.length > 0) {
      return p.variations[0].price || 0;
    }
    return (p as any).price || 0;
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
      await createSellerCombo(payload);
      resetForm();
      fetchCombos(); 
      alert("Combo offer submitted for admin approval!");
    } catch (err: any) {
       setFormError(err.message || "Failed to submit combo offer.");
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
    setSearchMain("");
    setSearchCombo("");
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (confirm("Are you sure you want to delete this combo offer?")) {
      try {
        await deleteMyComboOffer(id);
        fetchCombos();
      } catch (err) {
        alert("Failed to delete combo offer.");
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

  const filteredMainProducts = myProducts.filter((p: Product) =>
    p.productName.toLowerCase().includes(searchMain.toLowerCase())
  );
  const filteredComboProducts = myProducts.filter(
    (p: Product) =>
      p._id !== selectedMainProduct &&
      p.productName.toLowerCase().includes(searchCombo.toLowerCase())
  );

  const getStatusBadge = (combo: ComboOffer) => {
    if (combo.isApproved) {
      return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">Approved</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full">Pending Approval</span>;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-neutral-800">
            Create Combo Offer
          </h1>
          <div className="text-sm">
            <span className="text-blue-600 hover:underline cursor-pointer">Dashboard</span>
            <span className="text-neutral-400 mx-1">/</span>
            <span className="text-neutral-600">Combo Offers</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
          <div className="bg-indigo-600 text-white px-6 py-4 rounded-t-lg">
            <h2 className="text-lg font-semibold">New Combo Submission</h2>
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
                <div className="mb-5">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Main Product <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Search your products..."
                    value={searchMain}
                    onChange={(e) => setSearchMain(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded">
                    {filteredMainProducts.map((p) => (
                      <label
                        key={p._id}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-indigo-50 border-b last:border-0 ${selectedMainProduct === p._id ? "bg-indigo-50" : ""}`}
                      >
                        <input
                          type="radio"
                          name="mainProduct"
                          checked={selectedMainProduct === p._id}
                          onChange={() => {
                            setSelectedMainProduct(p._id);
                            setSelectedComboProducts(prev => prev.filter(id => id !== p._id));
                          }}
                          className="accent-indigo-600"
                        />
                        {p.mainImage && <img src={p.mainImage} alt="" className="w-8 h-8 rounded object-cover" />}
                        <div className="flex-1">
                          <div className="text-sm text-neutral-700">{p.productName}</div>
                          <div className="text-xs text-neutral-400">₹{getProductPrice(p._id)}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Add Combo Products <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Search combo items..."
                    value={searchCombo}
                    onChange={(e) => setSearchCombo(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded">
                    {filteredComboProducts.map((p) => (
                      <label
                        key={p._id}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-indigo-50 border-b last:border-0 ${selectedComboProducts.includes(p._id) ? "bg-indigo-50" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedComboProducts.includes(p._id)}
                          onChange={() => handleToggleComboProduct(p._id)}
                          className="accent-indigo-600"
                        />
                        {p.mainImage && <img src={p.mainImage} alt="" className="w-8 h-8 rounded object-cover" />}
                        <div className="flex-1">
                          <div className="text-sm text-neutral-700">{p.productName}</div>
                          <div className="text-xs text-neutral-400">₹{getProductPrice(p._id)}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Combo Offer Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={comboPrice}
                      onChange={(e) => setComboPrice(e.target.value)}
                      placeholder="Enter price after discount"
                      className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Combo Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={comboName}
                      onChange={(e) => setComboName(e.target.value)}
                      placeholder="Custom name"
                      className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {selectedMainProduct && selectedComboProducts.length > 0 && comboPrice && (
                  <div className="mb-5 bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                    <div className="text-sm font-medium text-neutral-700 mb-1">Live Preview</div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-indigo-700">₹{comboPrice}</span>
                      <span className="text-sm text-neutral-500 line-through">₹{originalTotal}</span>
                      <span className="text-sm font-semibold text-green-600">Save ₹{savings}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded transition-colors"
                >
                  Submit for Approval
                </button>
              </>
            )}
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-800">My Combo Offers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50 text-xs font-bold uppercase text-neutral-500 border-b">
                  <th className="p-4">Combo</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {combos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-neutral-400">No combos created yet.</td>
                  </tr>
                ) : (
                  combos.map((combo) => (
                    <tr key={combo._id} className="text-sm hover:bg-neutral-50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-neutral-800">{combo.name}</div>
                        <div className="text-xs text-neutral-400">
                          {getProductName(combo.mainProduct)} + {combo.comboProducts.length} items
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-indigo-600">₹{combo.comboPrice}</div>
                        <div className="text-xs text-neutral-400 line-through">₹{combo.originalPrice}</div>
                      </td>
                      <td className="p-4">{getStatusBadge(combo)}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(combo._id)}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
