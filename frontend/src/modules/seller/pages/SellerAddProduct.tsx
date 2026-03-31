import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  createProduct, 
  getProductById, 
  updateProduct, 
  getShops, 
  Shop, 
  ProductVariation,
  ProductAddon,
  generateProductDescriptionAI
} from "../../../services/api/productService";
import { getCategories, Category } from "../../../services/api/categoryService";
import { getActiveTaxes, Tax } from "../../../services/api/taxService";
import { getBrands, Brand } from "../../../services/api/brandService";
import { getHeaderCategoriesPublic, HeaderCategory } from "../../../services/api/headerCategoryService";
import api from "../../../services/api/config";
import { uploadImage } from "../../../services/api/uploadService";
import { validateImageFile, createImagePreview } from "../../../utils/imageUpload";
import { useAuth } from "../../../context/AuthContext";

interface ImageSlot {
  file: File | null;
  preview: string;
  url: string;
}

export default function SellerAddProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    productName: "",
    headerCategory: "",
    category: "",
    foodType: "Veg" as "Veg" | "Non-Veg" | "Egg",
    publish: "Yes",
    popular: "No",
    dealOfDay: "No",
    brand: "",
    brandName: "",
    tags: "",
    smallDescription: "",
    tax: "",
    totalAllowedQuantity: "10",
    mainImageUrl: "",
    galleryImageUrls: [] as string[],
    preparationTime: "20",
    timing: [] as string[],
    sku: "",
    availabilityStatus: "Available" as "Available" | "Sold out",
    packagingPrice: "0",
    isJain: "No",
    spicyLevel: "None" as "None" | "Mild" | "Medium" | "Hot",
    hsnCode: "",
    weight: "",
    totalAllowedQuantity: "10",
  });

  const [showProposalField, setShowProposalField] = useState(false);
  const [proposalName, setProposalName] = useState("");
  const [proposalLoading, setProposalLoading] = useState(false);

  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(
    Array(5).fill(null).map(() => ({ file: null, preview: "", url: "" }))
  );

  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [variationForm, setVariationForm] = useState({
    title: "",
    price: "",
    discPrice: "0",
    stock: "999", 
    status: "Available" as "Available" | "Sold out",
  });

  const [addons, setAddons] = useState<ProductAddon[]>([]);
  const [addonForm, setAddonForm] = useState({ name: "", price: "0" });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [headerCategories, setHeaderCategories] = useState<HeaderCategory[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          getCategories(),
          getActiveTaxes(),
          getHeaderCategoriesPublic(),
        ]);
        if (results[0].status === "fulfilled" && results[0].value.success) setCategories(results[0].value.data);
        if (results[1].status === "fulfilled" && results[1].value.success) setTaxes(results[1].value.data);
        if (results[2].status === "fulfilled") {
           const hRes = results[2].value;
           setHeaderCategories(hRes.filter((hc: HeaderCategory) => hc.deliveryType === "quick" && hc.status === "Published"));
        }
      } catch (err) { console.error("Error fetching data:", err); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const response = await getProductById(id);
          if (response.success && response.data) {
            const product = response.data;
            setFormData({
              productName: product.productName,
              headerCategory: (product.headerCategoryId as any)?._id || (product as any).headerCategoryId || "",
              category: (product.category as any)?._id || product.categoryId || "",
              foodType: product.foodType || "Veg",
              publish: product.publish ? "Yes" : "No",
              popular: product.popular ? "Yes" : "No",
              dealOfDay: product.dealOfDay ? "Yes" : "No",
              brand: "",
              brandName: product.brandName || "",
              tags: product.tags?.join(", ") || "",
              smallDescription: product.smallDescription || "",
              tax: (product.tax as any)?._id || (product as any).taxId || "",
              totalAllowedQuantity: product.totalAllowedQuantity?.toString() || "10",
              mainImageUrl: product.mainImageUrl || product.mainImage || "",
              galleryImageUrls: product.galleryImageUrls || [],
              preparationTime: product.preparationTime?.toString() || "20",
              timing: product.timing || [],
              sku: product.sku || "",
              availabilityStatus: product.availabilityStatus || "Available",
              packagingPrice: product.packagingPrice?.toString() || "0",
              isJain: product.isJain ? "Yes" : "No",
              spicyLevel: product.spicyLevel || "None",
              hsnCode: product.hsnCode || "",
              weight: product.weight || "",
              totalAllowedQuantity: product.totalAllowedQuantity?.toString() || "10",
            });
            setVariations(product.variations || []);
            setAddons(product.addons || []);
            const allImages = [product.mainImageUrl || product.mainImage || "", ...(product.galleryImageUrls || [])].filter(Boolean).slice(0, 5);
            setImageSlots(prev => { const newSlots = [...prev]; allImages.forEach((url, i) => { newSlots[i] = { file: null, preview: url as string, url: url as string }; }); return newSlots; });
          }
        } catch (err) { console.error("Error fetching product:", err); }
      };
      fetchProduct();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "headerCategory" && value === "propose_new") setShowProposalField(true);
    else setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProposeCategory = async () => {
    if (!proposalName.trim()) return;
    setProposalLoading(true);
    try {
      await api.post("/header-categories/propose", { name: proposalName, deliveryType: "quick" });
      setSuccessMessage("Requested! 📩");
      setProposalName("");
      setShowProposalField(false);
      setTimeout(() => setSuccessMessage(""), 2000);
    } catch (err: any) { setUploadError("Failed."); } finally { setProposalLoading(false); }
  };

  const handleImageSlotChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) { setUploadError(validation.error || "Invalid file"); return; }
    try {
      const preview = await createImagePreview(file);
      setImageSlots(prev => { const newSlots = [...prev]; newSlots[index] = { file, preview, url: "" }; return newSlots; });
    } catch (error) { setUploadError("Process failed"); }
  };

  const clearImageSlot = (index: number) => {
    setImageSlots(prev => { const newSlots = [...prev]; newSlots[index] = { file: null, preview: "", url: "" }; return newSlots; });
  };

  const addVariation = () => {
    if (!variationForm.title || !variationForm.price) return;
    setVariations([...variations, { title: variationForm.title, price: parseFloat(variationForm.price), discPrice: parseFloat(variationForm.discPrice || "0"), stock: parseInt(variationForm.stock || "999"), status: variationForm.status }]);
    setVariationForm({ title: "", price: "", discPrice: "0", stock: "999", status: "Available" });
  };

  const removeVariation = (index: number) => setVariations(prev => prev.filter((_, i) => i !== index));

  const addAddon = () => {
    if (!addonForm.name) return;
    setAddons([...addons, { name: addonForm.name, price: parseFloat(addonForm.price || "0") }]);
    setAddonForm({ name: "", price: "0" });
  };
  const removeAddon = (index: number) => setAddons(prev => prev.filter((_, i) => i !== index));

  const handleGenerateAI = async () => {
    if (!formData.productName) return;
    setAiLoading(true);
    try {
      const res = await generateProductDescriptionAI({ name: formData.productName, category: formData.category || undefined });
      if (res.success && res.data?.description) setAiSuggestion(res.data.description);
    } catch (err) { setUploadError("AI Busy."); } finally { setAiLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName.trim() || !formData.headerCategory || !formData.category || variations.length === 0) {
      setUploadError("Missing ingredients."); return;
    }
    setUploading(true);
    try {
      const uploadPromises = imageSlots.map(async (slot) => { if (slot.file) { const res = await uploadImage(slot.file, "products"); return res.secureUrl; } return slot.url || ""; });
      const uploadedUrls = (await Promise.all(uploadPromises)).filter(Boolean);
      const productData: any = { 
        ...formData, 
        headerCategoryId: formData.headerCategory, 
        categoryId: formData.category, 
        publish: formData.publish === "Yes", 
        popular: formData.popular === "Yes", 
        dealOfDay: formData.dealOfDay === "Yes", 
        isJain: formData.isJain === "Yes",
        price: variations[0].price, 
        stock: variations[0].stock, 
        preparationTime: parseInt(formData.preparationTime), 
        packagingPrice: parseFloat(formData.packagingPrice), 
        variations: variations.map(v => ({ ...v, name: v.title })), 
        addons: addons, 
        mainImageUrl: uploadedUrls[0] || "", 
        galleryImageUrls: uploadedUrls.slice(1), 
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean), 
        taxId: formData.tax || undefined 
      };
      const response = id ? await updateProduct(id, productData) : await createProduct(productData);
      if (response.success) { setSuccessMessage(id ? "Updated!" : "Dish Live!"); setTimeout(() => navigate("/seller/product/list"), 1500); }
      else setUploadError(response.message || "Failed.");
    } catch (error: any) { setUploadError(error.message); } finally { setUploading(false); }
  };

  return (
    <div className="font-sans antialiased text-neutral-900 pb-20">
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
        
        {/* Header - Zoomed Out */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${formData.availabilityStatus === "Available" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>{formData.availabilityStatus === "Available" ? "• Available" : "• Sold Out"}</span>
                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest opacity-60">Product Management</span>
             </div>
             <h1 className="text-2xl font-black tracking-tight text-neutral-900">{id ? "Update Product" : "Create New Product"}</h1>
          </div>
          <button type="button" onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-white border border-neutral-200 rounded-xl text-neutral-400 hover:bg-neutral-50 transition-all shadow-sm"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Quick Config - Sticky */}
          <div className="bg-white/80 backdrop-blur-xl border border-neutral-200 rounded-2xl p-4 flex items-center justify-between shadow-sm sticky top-4 z-[100]">
             <div className="flex items-center gap-6 pl-2">
                <div className="flex flex-col gap-1.5 border-r border-neutral-100 pr-6">
                   <p className="text-[8px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-0.5">Availability</p>
                   <button type="button" onClick={() => setFormData(p => ({ ...p, availabilityStatus: p.availabilityStatus === "Available" ? "Sold out" : "Available" }))} className={`w-11 h-5.5 rounded-full transition-all flex items-center px-1 shadow-inner ${formData.availabilityStatus === "Available" ? "bg-emerald-500" : "bg-neutral-200"}`}><motion.div animate={{ x: formData.availabilityStatus === "Available" ? 22 : 0 }} className="w-3.5 h-3.5 bg-white rounded-full shadow-md" /></button>
                </div>
                <div className="flex flex-col gap-1.5 border-r border-neutral-100 pr-6">
                   <p className="text-[8px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-0.5">Recommended</p>
                   <button type="button" onClick={() => setFormData(p => ({ ...p, popular: p.popular === "Yes" ? "No" : "Yes" }))} className={`w-11 h-5.5 rounded-full transition-all flex items-center px-1 shadow-inner ${formData.popular === "Yes" ? "bg-amber-500" : "bg-neutral-200"}`}><motion.div animate={{ x: formData.popular === "Yes" ? 22 : 0 }} className="w-3.5 h-3.5 bg-white rounded-full shadow-md" /></button>
                </div>
                <div className="flex flex-col gap-1.5 border-r border-neutral-100 pr-6">
                   <p className="text-[8px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-0.5">Best Seller</p>
                   <button type="button" onClick={() => setFormData(p => ({ ...p, dealOfDay: p.dealOfDay === "Yes" ? "No" : "Yes" }))} className={`w-11 h-5.5 rounded-full transition-all flex items-center px-1 shadow-inner ${formData.dealOfDay === "Yes" ? "bg-orange-500" : "bg-neutral-200"}`}><motion.div animate={{ x: formData.dealOfDay === "Yes" ? 22 : 0 }} className="w-3.5 h-3.5 bg-white rounded-full shadow-md" /></button>
                </div>
                <div className="flex flex-col gap-1.5 border-r border-neutral-100 pr-6">
                   <p className="text-[8px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-0.5">Visibility</p>
                   <button type="button" onClick={() => setFormData(p => ({ ...p, publish: p.publish === "Yes" ? "No" : "Yes" }))} className={`w-11 h-5.5 rounded-full transition-all flex items-center px-1 shadow-inner ${formData.publish === "Yes" ? "bg-teal-500" : "bg-neutral-200"}`}><motion.div animate={{ x: formData.publish === "Yes" ? 22 : 0 }} className="w-3.5 h-3.5 bg-white rounded-full shadow-md" /></button>
                </div>
                <div className="flex flex-col gap-1.5">
                   <p className="text-[8px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-0.5">Jain Friendly</p>
                   <button type="button" onClick={() => setFormData(p => ({ ...p, isJain: p.isJain === "Yes" ? "No" : "Yes" }))} className={`w-11 h-5.5 rounded-full transition-all flex items-center px-1 shadow-inner ${formData.isJain === "Yes" ? "bg-sky-500" : "bg-neutral-200"}`}><motion.div animate={{ x: formData.isJain === "Yes" ? 22 : 0 }} className="w-3.5 h-3.5 bg-white rounded-full shadow-md" /></button>
                </div>
             </div>
             <div className="bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-100 flex items-center gap-4">
                <select name="tax" value={formData.tax} onChange={handleChange} className="bg-white border border-neutral-200 rounded-lg py-1.5 px-3 text-[11px] font-black text-neutral-600 outline-none focus:border-teal-500 transition-all min-w-[90px]">{taxes.map(t => <option key={t._id} value={t._id}>{t.percentage}% GST</option>)}<option value="">No Tax</option></select>
             </div>
          </div>

          {/* Section 1: Basic Information */}
          <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-teal-600 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Product Identity</h2></div>
                <div className="flex bg-neutral-100/50 p-1 rounded-xl border border-neutral-100 gap-1">{["Veg", "Non-Veg", "Egg"].map(type => (<button key={type} type="button" onClick={() => setFormData(p => ({ ...p, foodType: type as any }))} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${formData.foodType === type ? "bg-white text-teal-600 shadow-sm" : "text-neutral-400"}`}>{type}</button>))}</div>
             </div>
             <div className="space-y-4">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Full Product Name *</label><input type="text" name="productName" value={formData.productName} onChange={handleChange} placeholder="e.g. Artisanal Paneer Butter Masala" className="w-full h-12 px-5 bg-neutral-50 border border-neutral-100 rounded-xl text-[16px] font-bold focus:bg-white focus:border-teal-500 transition-all outline-none" /></div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Preparation Time (Mins)</label><input type="number" name="preparationTime" value={formData.preparationTime} onChange={handleChange} className="w-full h-11 px-5 bg-neutral-50 border border-neutral-100 rounded-xl text-[14px] font-black tabular-nums transition-all outline-none focus:border-teal-500" /></div>
                   <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Spicy Level</label><select name="spicyLevel" value={formData.spicyLevel} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-[12px] font-black uppercase outline-none focus:border-teal-500"><option value="None">Not Spicy</option><option value="Mild">Mild 🔥</option><option value="Medium">Medium 🔥🔥</option><option value="Hot">Extra Hot 🔥🔥🔥</option></select></div>
                </div>
                <div className="space-y-1.5"><div className="flex justify-between items-center"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Description</label></div><textarea name="smallDescription" value={formData.smallDescription} onChange={handleChange} rows={3} placeholder="Tell your customers about the taste, texture, and secret ingredients..." className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-medium focus:bg-white transition-all outline-none resize-none"></textarea></div>
             </div>
          </section>

          {/* Section 2: Category & Packaging */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3"><div className="w-1.5 h-6 bg-teal-600 rounded-full"></div><h2 className="text-md font-black text-neutral-800 tracking-tight">Categories</h2></div>
                <div className="space-y-4">
                   <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em]">Parent Category</label><select name="headerCategory" value={formData.headerCategory} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 rounded-xl text-[12px] font-bold border border-neutral-100 focus:bg-white focus:border-teal-500 transition-all outline-none cursor-pointer"><option value="">Selection Required</option>{headerCategories.map(hc => <option key={hc._id} value={hc._id}>{hc.name}</option>)}<option value="propose_new" className="text-teal-600">+ Propose New</option></select></div>
                   {showProposalField && (<div className="p-3 bg-teal-50 rounded-xl flex gap-2"><input type="text" value={proposalName} onChange={e => setProposalName(e.target.value)} className="flex-1 h-9 px-3 text-xs rounded-lg bg-white border-none" /><button type="button" onClick={handleProposeCategory} className="px-3 bg-teal-600 text-white rounded-lg text-[9px] font-black uppercase">Send</button></div>)}
                   <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em]">Sub Category</label><select name="category" value={formData.category} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 rounded-xl text-[12px] font-bold border border-neutral-100 focus:bg-white focus:border-teal-500 transition-all outline-none cursor-pointer disabled:opacity-40">{categories.filter(c => (c as any).headerCategoryId?._id === formData.headerCategory || (c as any).headerCategoryId === formData.headerCategory).map((cat: any) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}</select></div>
                </div>
             </section>
             <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3"><div className="w-1.5 h-6 bg-teal-600 rounded-full"></div><h2 className="text-md font-black text-neutral-800 tracking-tight">Packaging Fees</h2></div>
                   <span className="w-8 h-8 bg-neutral-50 text-teal-600 rounded-lg flex items-center justify-center shadow-sm border border-neutral-100"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 8l-9-4-9 4v8l9 4 9-4V8z"/><path d="M12 12l9-4"/><path d="M12 12v8"/><path d="M12 12L3 8"/></svg></span>
                </div>
                <div className="bg-neutral-50/20 p-6 rounded-2xl border border-neutral-100 relative group">
                   <p className="absolute top-3 left-0 right-0 text-center text-[7px] font-black text-neutral-400 uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 transition-opacity">Fixed per order</p>
                   <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-black text-neutral-300">₹</span>
                      <input type="number" name="packagingPrice" value={formData.packagingPrice} onChange={handleChange} className="bg-transparent border-none text-center text-4xl font-black text-teal-600 outline-none w-24 tabular-nums" />
                   </div>
                </div>
                <p className="text-[8px] font-bold text-neutral-400 text-center uppercase tracking-widest">Added to customer subtotal</p>
             </section>
          </div>

          {/* Section 3: Pricing & Combinations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Sizes & Pricing */}
             <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-teal-600 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Sizes & Pricing</h2></div>
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Regular Price (₹)</label><input type="number" value={variationForm.price} onChange={e => setVariationForm(p => ({ ...p, price: e.target.value }))} className="w-full h-10 px-4 bg-neutral-50 rounded-lg text-xs font-bold border-none" placeholder="0" /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Discounted Price (₹)</label><input type="number" value={variationForm.discPrice} onChange={e => setVariationForm(p => ({ ...p, discPrice: e.target.value }))} className="w-full h-10 px-4 bg-neutral-50 rounded-lg text-xs font-bold border-none" placeholder="0" /></div>
                   </div>
                   <button type="button" onClick={addVariation} className="w-full h-10 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">Add Configuration Node</button>
                   <div className="space-y-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                      {variations.map((v, i) => (<div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl mb-2 group transition-all hover:bg-teal-50/50"><div className="flex items-center gap-3"><div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center font-black text-[9px] text-teal-600 shadow-sm border border-neutral-100">{i+1}</div><div><p className="text-[11px] font-black text-slate-800">{v.title}</p><div className="flex items-center gap-2"><p className="text-[10px] font-bold text-teal-600">₹{v.discPrice || v.price}</p>{v.discPrice > 0 && <p className="text-[9px] font-bold text-neutral-400 line-through">₹{v.price}</p>}</div></div></div><button type="button" onClick={() => removeVariation(i)} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-all">×</button></div>))}
                   </div>
                </div>
             </section>

             {/* Add-ons Management */}
             <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-sky-500 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Add-ons / Sides</h2></div>
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Modifier Name</label><input type="text" value={addonForm.name} onChange={e => setAddonForm(p => ({ ...p, name: e.target.value }))} className="w-full h-10 px-4 bg-neutral-50 rounded-lg text-xs font-bold border-none" placeholder="e.g. Extra Cheese" /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Fee (₹)</label><input type="number" value={addonForm.price} onChange={e => setAddonForm(p => ({ ...p, price: e.target.value }))} className="w-full h-10 px-4 bg-neutral-50 rounded-lg text-xs font-bold border-none" placeholder="0" /></div>
                   </div>
                   <button type="button" onClick={addAddon} className="w-full h-10 bg-slate-900/5 text-slate-900 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">Add Modifier</button>
                   <div className="space-y-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                      {addons.map((a, i) => (<div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl mb-2 group transition-all hover:bg-sky-50/50"><div className="flex items-center gap-3"><p className="text-[11px] font-black text-slate-800">{a.name}</p></div><div className="flex items-center gap-4"><p className="text-[10px] font-bold text-sky-600">₹{a.price}</p><button type="button" onClick={() => removeAddon(i)} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-all">×</button></div></div>))}
                   </div>
                </div>
             </section>
          </div>

          {/* Section 4: Imagery & Logistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Imagery */}
             <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-teal-600 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Product Images</h2></div><span className="text-[8px] font-black text-neutral-400 uppercase bg-neutral-50 px-3 py-1 rounded-full">Max 5 Photos</span></div>
                <div className="grid grid-cols-5 gap-3 h-32 md:h-40">
                   {imageSlots.map((slot, index) => (
                      <div key={index} className={`relative rounded-xl overflow-hidden border-2 border-dashed border-neutral-200 hover:border-teal-500 transition-all ${index === 0 ? 'col-span-2' : ''} bg-neutral-50 group`}>
                         {slot.preview ? (
                            <><img src={slot.preview} className="w-full h-full object-cover group-hover:scale-105 transition-all" alt="" /><div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><button type="button" onClick={() => clearImageSlot(index)} className="bg-white text-rose-500 w-8 h-8 rounded-lg font-black">×</button></div></>
                         ) : (
                            <label className="absolute inset-0 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-neutral-100 transition-all"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><polyline points="21 15 16 10 5 21"/></svg><span className="text-[7px] font-black text-neutral-400 uppercase">{index === 0 ? "Cover" : index+1}</span><input type="file" onChange={e => handleImageSlotChange(index, e)} className="hidden" accept="image/*" /></label>
                         )}
                      </div>
                   ))}
                </div>
             </section>

             {/* Logistics & Compliance */}
             <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-neutral-800 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Compliance & Limits</h2></div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">HSN Code</label><input type="text" name="hsnCode" value={formData.hsnCode} onChange={handleChange} placeholder="8 digits" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none" /></div>
                   <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Weight (e.g. 500g)</label><input type="text" name="weight" value={formData.weight} onChange={handleChange} placeholder="Size/Weight" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none" /></div>
                </div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Max Order Quantity (Per Order)</label><input type="number" name="totalAllowedQuantity" value={formData.totalAllowedQuantity} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none" /></div>
                <p className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest mt-2 leading-relaxed opacity-60">Mandatory for GST compliance and shipping calculations.</p>
             </section>
          </div>

          {/* Action Center */}
          <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/95 backdrop-blur-3xl border-t border-neutral-100 p-5 z-[110] flex justify-center shadow-2xl">
             <div className="max-w-xl w-full flex gap-3">
                <button type="button" onClick={() => navigate(-1)} className="h-12 flex-1 bg-white border border-neutral-200 rounded-xl text-[10px] font-black uppercase text-neutral-400 hover:text-neutral-900 transition-all hover:bg-neutral-50">Discard</button>
                <button type="submit" disabled={uploading} className="h-12 flex-[2] bg-teal-600 text-white rounded-xl text-[13px] font-black tracking-tight shadow-xl shadow-teal-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                   {uploading ? "Processing..." : (id ? "Update Product" : "Add Product")}
                </button>
             </div>
          </div>
        </form>

        <AnimatePresence>{successMessage && (<div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-2xl flex items-center justify-center"><motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl p-12 text-center shadow-2xl"><div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-6 animate-bounce">✓</div><h3 className="text-2xl font-black text-slate-900">{successMessage}</h3></motion.div></div>)}</AnimatePresence>
      </div>
    </div>
  );
}
