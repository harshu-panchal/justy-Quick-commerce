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
import { getCategories, getSubcategories, Category, SubCategory } from "../../../services/api/categoryService";
import { getActiveTaxes, Tax } from "../../../services/api/taxService";
import { getBrands, Brand } from "../../../services/api/brandService";
import { getHeaderCategoriesPublic, HeaderCategory } from "../../../services/api/headerCategoryService";
import api from "../../../services/api/config";
import { uploadImage } from "../../../services/api/uploadService";
import { validateImageFile, createImagePreview } from "../../../utils/imageUpload";
import { useAuth } from "../../../context/AuthContext";
import toast from 'react-hot-toast';

interface ImageSlot {
  file: File | null;
  preview: string;
  url: string;
}

export default function SellerAddProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userCat = (user?.category || (user?.categories && user.categories[0]) || "").toLowerCase();
  const isPharmacy = userCat.includes("pharmacy");
  const isProduce = userCat.includes("vegetable") || userCat.includes("fruit");
  const isGrocery = userCat.includes("grocery");
  const isTeaCorner = userCat.includes("tea corner") || userCat.includes("pan corner");
  const isFoodBakery = (userCat.includes("food") || userCat.includes("bakery")) && !isTeaCorner && !isGrocery && !isPharmacy && !isProduce;
  
  const [formData, setFormData] = useState({
    productName: "",
    headerCategory: "",
    category: "",
    subcategory: "",
    foodType: "Veg" as "Veg" | "Non-Veg" | "Egg",
    publish: "Yes",
    popular: "No",
    dealOfDay: "No",
    brand: "",
    brandName: "",
    tags: "",
    smallDescription: "",
    description: "",
    tax: "",
    totalAllowedQuantity: "10",
    mainImageUrl: "",
    galleryImageUrls: [] as string[],
    preparationTime: "20",
    timing: [] as string[],
    sku: "",
    barcode: "",
    availabilityStatus: "Available" as "Available" | "Sold out",
    packagingPrice: "0",
    isJain: "No",
    spicyLevel: "None" as "None" | "Mild" | "Medium" | "Hot",
    hsnCode: "",
    fssaiLicNo: "",
    weight: "",
    pharmacy: {
      tablets: "",
      quantity: "",
      treatment: "",
      form: "",
      prescriptionRequired: "No",
      packOf: "",
      variant: "",
      dosage: "",
      therapeuticClassification: "",
      composition: "",
      containerType: "",
      salesPackage: "",
      manufacturingDate: "",
      expiryDate: "",
      usageDescription: "",
      sideEffects: "",
      manufacturerName: "",
      howItWorks: "",
      safetyAdvice: "",
      interactions: "",
      manufacturerLicenseNo: "",
      storage: "",
      contraindications: "",
      schedule: "",
      medicineType: "Allopathic",
      underDPCO: "No",
      manufacturingProcess: "",
      manufacturerAddress: "",
    },
    freshProduce: {
      packOf: "",
      brand: "",
      type: "",
      quantity: "",
      shelfLife: "",
      form: "",
      isOrganic: "No",
      commonName: "",
      isWhole: "Yes",
      origin: "",
      packagingType: "",
      netQuantity: "",
      addedPreservatives: "No",
      secondaryQuantity: "",
      isImported: "No",
    },
    grocery: {
      unitType: "Packet" as "Kg" | "Gram" | "Litre" | "Piece" | "Packet",
      minOrderQuantity: "1",
      expiryDate: "",
      brand: "",
      description: "",
    },
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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>("");

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [headerCategories, setHeaderCategories] = useState<HeaderCategory[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          getCategories(),
          getActiveTaxes(),
          getHeaderCategoriesPublic(),
          getBrands(),
        ]);
        
        let fetchedCategories: Category[] = [];
        if (results[0].status === "fulfilled" && results[0].value.success) {
           fetchedCategories = results[0].value.data;
           setCategories(fetchedCategories);
        }
        
        if (results[1].status === "fulfilled" && results[1].value.success) setTaxes(results[1].value.data);

        if (results[3].status === "fulfilled" && results[3].value.success) setBrands(results[3].value.data);
        
        if (results[2].status === "fulfilled") {
           const hRes = results[2].value;
            const sellerCategory = (user?.category || (user?.categories && user.categories.length > 0 ? user.categories[0] : null) || "").toLowerCase();
            
            // Filter by seller's category
            const filtered = hRes.filter((hc: HeaderCategory) => 
              hc.deliveryType === "quick" && 
              hc.status === "Published" &&
              hc.name.toLowerCase() === sellerCategory
            );
            setHeaderCategories(filtered);
            
            if (filtered.length > 0 && !id) {
               const headId = filtered[0]._id;
               
               // Find matching subcategories
               const subCats = fetchedCategories.filter(c => 
                 ((c as any).headerCategoryId?._id === headId || 
                 (c as any).headerCategoryId === headId) &&
                 c.status === "Active"
               );
               
               if (subCats.length > 0) {
                 setFormData(p => ({ 
                   ...p, 
                   headerCategory: headId, 
                   category: subCats[0]._id 
                 }));
               } else {
                 setFormData(p => ({ 
                   ...p, 
                   headerCategory: headId 
                 }));
               }
            }
        }
      } catch (err) { console.error("Error fetching data:", err); }
    };
    fetchData();
  }, [user, id]);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const response = await getProductById(id);
          if (response.success && response.data) {
            const product = response.data;
            setFormData({
              productName: product.productName,
              headerCategory: String((product.headerCategoryId as any)?._id || (product as any).headerCategoryId || ""),
              category: String((product.category as any)?._id || product.categoryId || ""),
              subcategory: String((product.subcategory as any)?._id || product.subcategoryId || (product as any).subcategory || ""),
              foodType: product.foodType || "Veg",
              publish: product.publish ? "Yes" : "No",
              popular: product.popular ? "Yes" : "No",
              dealOfDay: product.dealOfDay ? "Yes" : "No",
              brand: String((product as any).brand?._id || (product as any).brand || ""),
              brandName: product.brandName || "",
              tags: product.tags?.join(", ") || "",
              smallDescription: product.smallDescription || "",
              description: product.description || "",
              tax: String((product.tax as any)?._id || (product as any).taxId || ""),
              totalAllowedQuantity: product.totalAllowedQuantity?.toString() || "10",
              mainImageUrl: product.mainImageUrl || product.mainImage || "",
              galleryImageUrls: product.galleryImageUrls || [],
              preparationTime: product.preparationTime?.toString() || "20",
              timing: product.timing || [],
              sku: product.sku || "",
              barcode: product.barcode || "",
              availabilityStatus: product.availabilityStatus || "Available",
              packagingPrice: product.packagingPrice?.toString() || "0",
              isJain: product.isJain ? "Yes" : "No",
              hsnCode: product.hsnCode || "",
              fssaiLicNo: product.fssaiLicNo || "",
              weight: product.weight || "",
              spicyLevel: product.spicyLevel || "None",
              pharmacy: {
                tablets: product.pharmacy?.tablets || "",
                quantity: product.pharmacy?.quantity || "",
                treatment: product.pharmacy?.treatment || "",
                form: product.pharmacy?.form || "",
                prescriptionRequired: product.pharmacy?.prescriptionRequired ? "Yes" : "No",
                packOf: product.pharmacy?.packOf || "",
                variant: product.pharmacy?.variant || "",
                dosage: product.pharmacy?.dosage || "",
                therapeuticClassification: product.pharmacy?.therapeuticClassification || "",
                composition: product.pharmacy?.composition || "",
                containerType: product.pharmacy?.containerType || "",
                salesPackage: product.pharmacy?.salesPackage || "",
                manufacturingDate: product.pharmacy?.manufacturingDate ? new Date(product.pharmacy.manufacturingDate).toISOString().split('T')[0] : "",
                expiryDate: product.pharmacy?.expiryDate ? new Date(product.pharmacy.expiryDate).toISOString().split('T')[0] : "",
                usageDescription: product.pharmacy?.usageDescription || "",
                sideEffects: product.pharmacy?.sideEffects || "",
                manufacturerName: product.pharmacy?.manufacturerName || "",
                howItWorks: product.pharmacy?.howItWorks || "",
                safetyAdvice: product.pharmacy?.safetyAdvice || "",
                interactions: product.pharmacy?.interactions || "",
                manufacturerLicenseNo: product.pharmacy?.manufacturerLicenseNo || "",
                storage: product.pharmacy?.storage || "",
                contraindications: product.pharmacy?.contraindications || "",
                schedule: product.pharmacy?.schedule || "",
                medicineType: product.pharmacy?.medicineType || "Allopathic",
                underDPCO: product.pharmacy?.underDPCO ? "Yes" : "No",
                manufacturingProcess: product.pharmacy?.manufacturingProcess || "",
                manufacturerAddress: product.pharmacy?.manufacturerAddress || "",
              },
              freshProduce: {
                packOf: product.freshProduce?.packOf || "",
                brand: product.freshProduce?.brand || "",
                type: product.freshProduce?.type || "",
                quantity: product.freshProduce?.quantity || "",
                shelfLife: product.freshProduce?.shelfLife || "",
                form: product.freshProduce?.form || "",
                isOrganic: product.freshProduce?.isOrganic ? "Yes" : "No",
                commonName: product.freshProduce?.commonName || "",
                isWhole: product.freshProduce?.isWhole !== false ? "Yes" : "No",
                origin: product.freshProduce?.origin || "",
                packagingType: product.freshProduce?.packagingType || "",
                netQuantity: product.freshProduce?.netQuantity || "",
                addedPreservatives: product.freshProduce?.addedPreservatives || "No",
                secondaryQuantity: product.freshProduce?.secondaryQuantity || "",
                isImported: product.freshProduce?.isImported ? "Yes" : "No",
              },
              grocery: {
                unitType: product.grocery?.unitType || "Packet",
                minOrderQuantity: product.grocery?.minOrderQuantity?.toString() || "1",
                expiryDate: product.grocery?.expiryDate ? new Date(product.grocery.expiryDate).toISOString().split('T')[0] : "",
                brand: product.grocery?.brand || product.brandName || "",
                description: product.description || "",
              }
            });
            setVariations(product.variations || []);
            setAddons(product.addons || []);
            const allImages = [
              product.mainImage || product.mainImageUrl || "", 
              ...(product.galleryImages || product.galleryImageUrls || [])
            ].filter(Boolean).slice(0, 5);
            
            setImageSlots(prev => { 
              const newSlots = [...prev]; 
              allImages.forEach((url, i) => { 
                if (i < 5) newSlots[i] = { file: null, preview: url as string, url: url as string }; 
              }); 
              return newSlots; 
            });
          }
        } catch (err) { console.error("Error fetching product:", err); }
      };
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!formData.category) {
        setSubcategories([]);
        return;
      }
      try {
        const res = await getSubcategories(formData.category);
        if (res.success) {
          setSubcategories(res.data);
        }
      } catch (err) {
        console.error("Error fetching subcategories:", err);
      }
    };
    fetchSubcategories();
  }, [formData.category]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("pharmacy.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, pharmacy: { ...prev.pharmacy, [field]: value } }));
    }
    else if (name.startsWith("freshProduce.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, freshProduce: { ...prev.freshProduce, [field]: value } }));
    }
    else if (name.startsWith("grocery.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, grocery: { ...prev.grocery, [field]: value } }));
    }
    else if (name === "headerCategory" && value === "propose_new") setShowProposalField(true);
    else setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProposeCategory = async () => {
    if (!proposalName.trim()) return;
    setProposalLoading(true);
    try {
      await api.post("/header-categories/propose", { name: proposalName, deliveryType: "quick" });
      toast.success("Proposal Sent Successfully! 📩");
      setProposalName("");
      setShowProposalField(false);
    } catch (err: any) { toast.error("Failed to propose category."); } finally { setProposalLoading(false); }
  };

  const handleImageSlotChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) { toast.error(validation.error || "Invalid file"); return; }
    try {
      const preview = await createImagePreview(file);
      setImageSlots(prev => { const newSlots = [...prev]; newSlots[index] = { file, preview, url: "" }; return newSlots; });
    } catch (error) { toast.error("Process failed"); }
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
      const res = await generateProductDescriptionAI({ name: formData.productName, category: categories.find(c => c._id === formData.category)?.name });
      if (res.success && res.data?.description) setAiSuggestion(res.data.description);
    } catch (err) { toast.error("AI is busy right now. Ensure GEMINI_API_KEY is set in your backend .env file."); } finally { setAiLoading(false); }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setFormData(prev => ({ ...prev, smallDescription: aiSuggestion }));
    setAiSuggestion("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName.trim()) { toast.error("Product name is required."); return; }
    if (!formData.headerCategory) { toast.error("Parent category is required."); return; }
    if (!formData.category) { toast.error("Sub category is required."); return; }
    if (variations.length === 0) { toast.error("Please add at least one configuration (Size/Price)."); return; }
    
    setUploading(true);
    const idToast = toast.loading(id ? "Updating product..." : "Uploading product...");
    
    try {
      // 1. Upload Images
      const uploadedUrls: string[] = [];
      for (let i = 0; i < imageSlots.length; i++) {
        const slot = imageSlots[i];
        if (slot.file) {
          try {
            const res = await uploadImage(slot.file, "products");
            if (res && res.secureUrl) {
              uploadedUrls.push(res.secureUrl);
            }
          } catch (err) {
            console.error(`Failed to upload image at slot ${i+1}:`, err);
            toast.error(`Image ${i+1} failed to upload.`);
          }
        } else if (slot.url) {
          uploadedUrls.push(slot.url);
        }
      }

      if (uploadedUrls.length === 0) {
        toast.dismiss(idToast);
        toast.error("At least one product image is required.");
        setUploading(false);
        return;
      }

      // 2. Prepare Product Data
      const productData: any = { 
        ...formData, 
        headerCategoryId: formData.headerCategory, 
        categoryId: formData.category, 
        publish: formData.publish === "Yes", 
        popular: formData.popular === "Yes", 
        dealOfDay: formData.dealOfDay === "Yes", 
        isJain: formData.isJain === "Yes",
        spicyLevel: formData.spicyLevel,
        price: variations[0].price, 
        stock: variations[0].stock, 
        preparationTime: (isPharmacy || isProduce) ? undefined : (parseInt(formData.preparationTime) || 20), 
        packagingPrice: parseFloat(formData.packagingPrice) || 0, 
        variations: variations.map(v => ({ ...v, name: v.title })), 
        addons: addons, 
        fssaiLicNo: formData.fssaiLicNo,
        hsnCode: formData.hsnCode,
        weight: formData.weight,
        totalAllowedQuantity: parseInt(formData.totalAllowedQuantity) || 10,
        mainImageUrl: uploadedUrls[0], 
        galleryImageUrls: uploadedUrls.slice(1), 
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean), 
        taxId: formData.tax || undefined,
        brandId: (formData.brand && formData.brand !== "other") ? formData.brand : undefined,
        brandName: (formData.brand === "other" || !formData.brand) ? formData.brandName : brands.find(b => b._id === formData.brand)?.name,
        subcategoryId: formData.subcategory || undefined,
        pharmacy: isPharmacy ? {
          ...formData.pharmacy,
          prescriptionRequired: formData.pharmacy.prescriptionRequired === "Yes",
          underDPCO: formData.pharmacy.underDPCO === "Yes",
          manufacturingDate: formData.pharmacy.manufacturingDate || undefined,
          expiryDate: formData.pharmacy.expiryDate || undefined,
        } : undefined,
        freshProduce: isProduce ? {
          ...formData.freshProduce,
          isOrganic: formData.freshProduce.isOrganic === "Yes",
          isWhole: formData.freshProduce.isWhole === "Yes",
          isImported: formData.freshProduce.isImported === "Yes",
        } : undefined,
        grocery: isGrocery ? {
          ...formData.grocery,
          minOrderQuantity: parseInt(formData.grocery.minOrderQuantity) || 1,
          expiryDate: formData.grocery.expiryDate || undefined,
        } : undefined
      };

      // 3. Submit to Backend
      const response = id ? await updateProduct(id, productData) : await createProduct(productData);
      
      toast.dismiss(idToast);
      if (response.success) { 
        toast.success(id ? "Product Updated Successfully! 🪄" : "Product Submitted for Approval! ⏳"); 
        setTimeout(() => navigate("/seller/product/list"), 1500); 
      } else {
        toast.error(response.message || "Submission failed.");
      }
    } catch (error: any) { 
      toast.dismiss(idToast);
      console.error("Submission Error:", error);
      toast.error(error.response?.data?.message || error.message || "An unexpected error occurred."); 
    } finally { 
      setUploading(false); 
    }
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
                {!isTeaCorner && !isGrocery && (
                  <>
                    <div className="flex flex-col gap-1.5 border-r border-neutral-100 pr-6">
                       <p className="text-[8px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-0.5">Recommended</p>
                       <button type="button" onClick={() => setFormData(p => ({ ...p, popular: p.popular === "Yes" ? "No" : "Yes" }))} className={`w-11 h-5.5 rounded-full transition-all flex items-center px-1 shadow-inner ${formData.popular === "Yes" ? "bg-amber-500" : "bg-neutral-200"}`}><motion.div animate={{ x: formData.popular === "Yes" ? 22 : 0 }} className="w-3.5 h-3.5 bg-white rounded-full shadow-md" /></button>
                    </div>
                    <div className="flex flex-col gap-1.5 border-r border-neutral-100 pr-6">
                       <p className="text-[8px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-0.5">Best Seller</p>
                       <button type="button" onClick={() => setFormData(p => ({ ...p, dealOfDay: p.dealOfDay === "Yes" ? "No" : "Yes" }))} className={`w-11 h-5.5 rounded-full transition-all flex items-center px-1 shadow-inner ${formData.dealOfDay === "Yes" ? "bg-orange-500" : "bg-neutral-200"}`}><motion.div animate={{ x: formData.dealOfDay === "Yes" ? 22 : 0 }} className="w-3.5 h-3.5 bg-white rounded-full shadow-md" /></button>
                    </div>
                    <div className="flex flex-col gap-1.5 border-r border-neutral-100 pr-6">
                       <p className="text-[8px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-0.5">Approval Status</p>
                       <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">Pending 🔍</div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                       <p className="text-[8px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-0.5">Jain Friendly</p>
                       <button type="button" onClick={() => setFormData(p => ({ ...p, isJain: p.isJain === "Yes" ? "No" : "Yes" }))} className={`w-11 h-5.5 rounded-full transition-all flex items-center px-1 shadow-inner ${formData.isJain === "Yes" ? "bg-sky-500" : "bg-neutral-200"}`}><motion.div animate={{ x: formData.isJain === "Yes" ? 22 : 0 }} className="w-3.5 h-3.5 bg-white rounded-full shadow-md" /></button>
                    </div>
                  </>
                )}
             </div>
             {!isGrocery && (
               <div className="bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-100 flex items-center gap-4">
                  <select name="tax" value={formData.tax} onChange={handleChange} className="bg-white border border-neutral-200 rounded-lg py-1.5 px-3 text-[11px] font-black text-neutral-600 outline-none focus:border-teal-500 transition-all min-w-[90px]">{taxes.map(t => <option key={t._id} value={t._id}>{t.percentage}% GST</option>)}<option value="">No Tax</option></select>
               </div>
             )}
          </div>

          {/* Section 1: Basic Information */}
          <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-emerald-600 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Product Identity</h2></div>
                {!isPharmacy && !isProduce && !isGrocery && !isTeaCorner && (
                  <div className="flex bg-neutral-100/50 p-1 rounded-xl border border-neutral-100 gap-1">{["Veg", "Non-Veg", "Egg"].map(type => (<button key={type} type="button" onClick={() => setFormData(p => ({ ...p, foodType: type as any }))} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${formData.foodType === type ? "bg-white text-emerald-600 shadow-sm" : "text-neutral-400"}`}>{type}</button>))}</div>
                )}
             </div>
             <div className="space-y-4">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Full Product Name *</label><input type="text" name="productName" value={formData.productName} onChange={handleChange} placeholder="e.g. Fresh Organic Tomatoes" className="w-full h-12 px-5 bg-neutral-50 border border-neutral-100 rounded-xl text-[16px] font-bold focus:bg-white focus:border-emerald-500 transition-all outline-none" /></div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Brand</label>
                      <select name="brand" value={formData.brand} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-[12px] font-bold outline-none focus:border-teal-500">
                         <option value="">Select Brand</option>
                         {brands.map(b => (
                            <option key={b._id} value={b._id}>{b.name}</option>
                         ))}
                         <option value="other">Other / Custom</option>
                      </select>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">External SKU (ID)</label>
                      <input type="text" name="sku" value={formData.sku} onChange={handleChange} placeholder="e.g. SKU-123" className="w-full h-11 px-5 bg-neutral-50 border border-neutral-100 rounded-xl text-[14px] font-bold focus:bg-white focus:border-emerald-500 transition-all outline-none" />
                   </div>
                </div>
                {formData.brand === "other" && (
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Custom Brand Name</label>
                      <input type="text" name="brandName" value={formData.brandName} onChange={handleChange} placeholder="Enter brand name" className="w-full h-11 px-5 bg-neutral-50 border border-neutral-100 rounded-xl text-[14px] font-bold focus:bg-white focus:border-emerald-500 transition-all outline-none" />
                   </div>
                )}
                {!isPharmacy && !isProduce && !isGrocery && (
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Preparation Time (Mins)</label><input type="number" name="preparationTime" value={formData.preparationTime} onChange={handleChange} className="w-full h-11 px-5 bg-neutral-50 border border-neutral-100 rounded-xl text-[14px] font-black tabular-nums transition-all outline-none focus:border-emerald-500" /></div>
                     {!isTeaCorner && <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Spicy Level</label><select name="spicyLevel" value={formData.spicyLevel} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-[12px] font-black uppercase outline-none focus:border-teal-500"><option value="None">Not Spicy</option><option value="Mild">Mild 🔥</option><option value="Medium">Medium 🔥🔥</option><option value="Hot">Extra Hot 🔥🔥🔥</option></select></div>}
                  </div>
                )}
                <div className="space-y-1.5">
                   <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Short Description</label>
                      <button 
                        type="button" 
                        onClick={handleGenerateAI} 
                        disabled={aiLoading || !formData.productName}
                        className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-teal-100 transition-all disabled:opacity-50"
                      >
                        {aiLoading ? "Thinking..." : "✨ Magic AI"}
                      </button>
                   </div>
                   <textarea name="smallDescription" value={formData.smallDescription} onChange={handleChange} rows={2} placeholder="Brief summary (e.g. A delicious blend of spices...)" className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-medium focus:bg-white transition-all outline-none resize-none mb-3"></textarea>
                   
                   <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5 ml-1">Detailed Description (Required for details page)</label>
                   <textarea name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Full product details, nutrition info, usage instructions, etc..." className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-medium focus:bg-white transition-all outline-none resize-none"></textarea>

                   <AnimatePresence>
                      {aiSuggestion && (
                         <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 bg-teal-50 border border-teal-100 rounded-xl space-y-3 mt-4">
                            <div className="flex items-center justify-between">
                               <p className="text-[10px] font-black text-teal-700 uppercase tracking-widest">AI Suggestion</p>
                               <button type="button" onClick={() => setAiSuggestion("")} className="text-teal-400 text-xs font-black">×</button>
                            </div>
                            <p className="text-xs text-teal-900 leading-relaxed italic">{aiSuggestion}</p>
                            <button type="button" onClick={applyAiSuggestion} className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-teal-600/20 active:scale-95 transition-all">Apply Suggestion</button>
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>
             </div>
          </section>

           {/* Section 2: Category & Packaging */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-4">
                 <div className="flex items-center gap-3"><div className="w-1.5 h-6 bg-teal-600 rounded-full"></div><h2 className="text-md font-black text-neutral-800 tracking-tight">Categories</h2></div>
                 <div className="space-y-4">
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em]">Parent Category</label><select name="headerCategory" value={formData.headerCategory} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 rounded-xl text-[12px] font-bold border border-neutral-100 focus:bg-white focus:border-teal-500 transition-all outline-none cursor-pointer"><option value="">Selection Required</option>{headerCategories.map(hc => <option key={hc._id} value={hc._id}>{hc.name}</option>)}</select></div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em]">Sub Category</label>
                       <select name="category" value={formData.category} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 rounded-xl text-[12px] font-bold border border-neutral-100 focus:bg-white focus:border-teal-500 transition-all outline-none cursor-pointer disabled:opacity-40"><option value="">Selection Required</option>{categories.filter(c => ((c as any).headerCategoryId?._id === formData.headerCategory || (c as any).headerCategoryId === formData.headerCategory) && (c as any).status === "Active").map((cat: any) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}</select>
                    </div>
                    {subcategories.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em]">Deep Sub Category (Optional)</label>
                        <select name="subcategory" value={formData.subcategory} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 rounded-xl text-[12px] font-bold border border-neutral-100 focus:bg-white focus:border-teal-500 transition-all outline-none cursor-pointer"><option value="">Selection Optional</option>{subcategories.map(sc => <option key={sc._id} value={sc._id}>{sc.subcategoryName}</option>)}</select>
                      </div>
                    )}
                 </div>
              </section>
             {!isTeaCorner && !isGrocery && (
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
             )}
          </div>

          {isPharmacy && (
             <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-8">
                <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-teal-600 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Pharmacy Specifications</h2></div>
                
                {/* Visual Highlights */}
                <div className="space-y-4">
                   <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 text-teal-600">★ High Priority Info</h3>
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Tablets Count</label><input type="text" name="pharmacy.tablets" value={formData.pharmacy.tablets} onChange={handleChange} placeholder="e.g. 10 Tabs" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                      <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Quantity/Volume</label><input type="text" name="pharmacy.quantity" value={formData.pharmacy.quantity} onChange={handleChange} placeholder="e.g. 100ml" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                      <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Primary Treatment</label><input type="text" name="pharmacy.treatment" value={formData.pharmacy.treatment} onChange={handleChange} placeholder="e.g. Fever" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                      <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Medicine Form</label><input type="text" name="pharmacy.form" value={formData.pharmacy.form} onChange={handleChange} placeholder="e.g. Syrup" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Prescription Required?</label><select name="pharmacy.prescriptionRequired" value={formData.pharmacy.prescriptionRequired} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none"><option value="No">No (OTC)</option><option value="Yes">Yes (Prescription)</option></select></div>
                      <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Pack Of</label><input type="text" name="pharmacy.packOf" value={formData.pharmacy.packOf} onChange={handleChange} placeholder="e.g. Pack of 2" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none" /></div>
                   </div>
                </div>

               {/* General Medicine Details */}
               <div className="space-y-6 pt-4 border-t border-neutral-100">
                  <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">All Details in General</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(1) Brand Name</label><input type="text" name="brandName" value={formData.brandName} onChange={handleChange} className="w-full h-10 px-4 bg-neutral-50 rounded-xl border-none text-sm font-bold" /></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(5) Variant</label><input type="text" name="pharmacy.variant" value={formData.pharmacy.variant} onChange={handleChange} className="w-full h-10 px-4 bg-neutral-50 rounded-xl border-none text-sm font-bold" /></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(8) Dosage</label><input type="text" name="pharmacy.dosage" value={formData.pharmacy.dosage} onChange={handleChange} placeholder="e.g. Twice daily" className="w-full h-10 px-4 bg-neutral-50 rounded-xl border-none text-sm font-bold" /></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(9) Therapeutic Classification</label><input type="text" name="pharmacy.therapeuticClassification" value={formData.pharmacy.therapeuticClassification} onChange={handleChange} className="w-full h-10 px-4 bg-neutral-50 rounded-xl border-none text-sm font-bold" /></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(10) Composition</label><input type="text" name="pharmacy.composition" value={formData.pharmacy.composition} onChange={handleChange} placeholder="e.g. Paracetamol 500mg" className="w-full h-10 px-4 bg-neutral-50 rounded-xl border-none text-sm font-bold" /></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(11) Container Type</label><input type="text" name="pharmacy.containerType" value={formData.pharmacy.containerType} onChange={handleChange} className="w-full h-10 px-4 bg-neutral-50 rounded-xl border-none text-sm font-bold" /></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(12) Sales Package</label><input type="text" name="pharmacy.salesPackage" value={formData.pharmacy.salesPackage} onChange={handleChange} className="w-full h-10 px-4 bg-neutral-50 rounded-xl border-none text-sm font-bold" /></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(25) Type</label><select name="pharmacy.medicineType" value={formData.pharmacy.medicineType} onChange={handleChange} className="w-full h-10 px-4 bg-neutral-50 rounded-xl border-none text-sm font-bold"><option value="Allopathic">Allopathic</option><option value="Ayurvedic">Ayurvedic</option><option value="Homeopathic">Homeopathic</option></select></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(13) Date of Manufacturing</label><input type="date" name="pharmacy.manufacturingDate" value={formData.pharmacy.manufacturingDate} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(14) Date of Expiry</label><input type="date" name="pharmacy.expiryDate" value={formData.pharmacy.expiryDate} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                  </div>

                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(15) Usage Description In Short</label><textarea name="pharmacy.usageDescription" value={formData.pharmacy.usageDescription} onChange={handleChange} rows={2} className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-medium focus:bg-white outline-none resize-none"></textarea></div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(16) Side Effects</label><input type="text" name="pharmacy.sideEffects" value={formData.pharmacy.sideEffects} onChange={handleChange} className="w-full h-10 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm" /></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(23) Contraindications</label><input type="text" name="pharmacy.contraindications" value={formData.pharmacy.contraindications} onChange={handleChange} className="w-full h-10 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm" /></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(18) How it Works</label><textarea name="pharmacy.howItWorks" value={formData.pharmacy.howItWorks} onChange={handleChange} rows={2} className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"></textarea></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(19) Safety Advice</label><textarea name="pharmacy.safetyAdvice" value={formData.pharmacy.safetyAdvice} onChange={handleChange} rows={2} className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"></textarea></div>
                  </div>

                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(20) Interaction with Drugs and Food</label><textarea name="pharmacy.interactions" value={formData.pharmacy.interactions} onChange={handleChange} rows={2} className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"></textarea></div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(24) Schedule</label><select name="pharmacy.schedule" value={formData.pharmacy.schedule} onChange={handleChange} className="w-full h-10 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"><option value="">None</option><option value="Schedule H">Schedule H</option><option value="Schedule H1">Schedule H1</option><option value="Schedule X">Schedule X</option><option value="Schedule G">Schedule G</option></select></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(26) Under DPCO?</label><select name="pharmacy.underDPCO" value={formData.pharmacy.underDPCO} onChange={handleChange} className="w-full h-10 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(22) Storage Explanation</label><input type="text" name="pharmacy.storage" value={formData.pharmacy.storage} onChange={handleChange} placeholder="e.g. Store in cool place" className="w-full h-10 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm" /></div>
                  </div>

                  <div className="space-y-6 pt-4 border-t border-dashed border-neutral-200">
                     <h4 className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em]">Supplier / Manufacturer Info</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(17) Manufacturer/Dealer Name</label><input type="text" name="pharmacy.manufacturerName" value={formData.pharmacy.manufacturerName} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                        <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(21) Licence Number</label><input type="text" name="pharmacy.manufacturerLicenseNo" value={formData.pharmacy.manufacturerLicenseNo} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(27) Manufacturing Process</label><input type="text" name="pharmacy.manufacturingProcess" value={formData.pharmacy.manufacturingProcess} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm" /></div>
                        <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(28) Manufacturer Address</label><textarea name="pharmacy.manufacturerAddress" value={formData.pharmacy.manufacturerAddress} onChange={handleChange} rows={2} className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"></textarea></div>
                     </div>
                  </div>
               </div>
             </section>
          )}

          {isProduce && (
             <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-8">
               <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-emerald-600 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Produce Specifications</h2></div>
               
               {/* Product Highlights */}
               <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 text-emerald-600">★ Product Highlights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Pack of</label><input type="text" name="freshProduce.packOf" value={formData.freshProduce.packOf} onChange={handleChange} placeholder="e.g. 1kg" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold shadow-sm" /></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Brand</label><input type="text" name="freshProduce.brand" value={formData.freshProduce.brand} onChange={handleChange} placeholder="e.g. Fresho" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold shadow-sm" /></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Type</label><input type="text" name="freshProduce.type" value={formData.freshProduce.type} onChange={handleChange} placeholder="e.g. Seasonal" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold shadow-sm" /></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Quantity</label><input type="text" name="freshProduce.quantity" value={formData.freshProduce.quantity} onChange={handleChange} placeholder="e.g. 5 units" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold shadow-sm" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Shelf Life</label><input type="text" name="freshProduce.shelfLife" value={formData.freshProduce.shelfLife} onChange={handleChange} placeholder="e.g. 3-4 days" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold shadow-sm" /></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Form</label><input type="text" name="freshProduce.form" value={formData.freshProduce.form} onChange={handleChange} placeholder="e.g. Whole/Cut" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold shadow-sm" /></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Organic?</label><select name="freshProduce.isOrganic" value={formData.freshProduce.isOrganic} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold shadow-sm"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Common Name</label><input type="text" name="freshProduce.commonName" value={formData.freshProduce.commonName} onChange={handleChange} placeholder="e.g. Onion" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold shadow-sm" /></div>
                  </div>
               </div>

               {/* All Details / General */}
               <div className="space-y-6 pt-6 border-t border-neutral-100">
                  <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">General Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Origin / Country</label><input type="text" name="freshProduce.origin" value={formData.freshProduce.origin} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Packaging Type</label><input type="text" name="freshProduce.packagingType" value={formData.freshProduce.packagingType} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Net Quantity</label><input type="text" name="freshProduce.netQuantity" value={formData.freshProduce.netQuantity} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Added Preservatives?</label><select name="freshProduce.addedPreservatives" value={formData.freshProduce.addedPreservatives} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Whole / Cut?</label><select name="freshProduce.isWhole" value={formData.freshProduce.isWhole} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold"><option value="Yes">Whole</option><option value="No">Pre-Cut</option></select></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Secondary Quantity</label><input type="text" name="freshProduce.secondaryQuantity" value={formData.freshProduce.secondaryQuantity} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Food Type</label><select name="foodType" value={formData.foodType} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-[10px] font-black uppercase"><option value="Veg">Veg</option><option value="Non-Veg">Non-Veg</option><option value="Egg">Egg</option></select></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Imported?</label><select name="freshProduce.isImported" value={formData.freshProduce.isImported} onChange={handleChange} className="w-full h-10 px-4 bg-white border border-neutral-100 rounded-xl text-sm font-bold"><option value="No">Local / Domestic</option><option value="Yes">Imported</option></select></div>
                  </div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Product Weight (Total)</label><input type="text" name="weight" value={formData.weight} onChange={handleChange} placeholder="e.g. 500g" className="w-full h-11 px-4 bg-white border border-neutral-100 rounded-xl text-sm font-bold" /></div>
               </div>
            </section>
          )}

          {isGrocery && (
             <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-8">
               <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-amber-600 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Grocery Details</h2></div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Unit Type</label><select name="grocery.unitType" value={formData.grocery.unitType} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white focus:border-amber-500 transition-all outline-none"><option value="Kg">Kg</option><option value="Gram">Gram</option><option value="Litre">Litre</option><option value="Piece">Piece</option><option value="Packet">Packet</option></select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Minimum Order Qty</label><input type="number" name="grocery.minOrderQuantity" value={formData.grocery.minOrderQuantity} onChange={handleChange} placeholder="e.g. 1" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white focus:border-amber-500 transition-all outline-none" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Expiry Date</label><input type="date" name="grocery.expiryDate" value={formData.grocery.expiryDate} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white focus:border-amber-500 transition-all outline-none" /></div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em]">Brand Name *</label><select name="grocery.brand" value={formData.grocery.brand} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white focus:border-amber-500 transition-all outline-none"><option value="">Select Brand</option>{brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}</select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Barcode / SKU</label><input type="text" name="barcode" value={formData.barcode} onChange={handleChange} placeholder="Optional Barcode" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white focus:border-amber-500 transition-all outline-none" /></div>
               </div>
             </section>
          )}

          {/* Section 3: Pricing & Combinations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Sizes & Pricing */}
             <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-teal-600 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Sizes & Pricing</h2></div>
                <div className="space-y-4">
                   <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Variant/Size Name (e.g. Regular, 500g, Half)</label><input type="text" value={variationForm.title} onChange={e => setVariationForm(p => ({ ...p, title: e.target.value }))} className="w-full h-11 px-4 bg-neutral-50 rounded-xl text-[13px] font-bold border border-neutral-100 focus:bg-white focus:border-teal-500 transition-all outline-none" placeholder="e.g. Regular" /></div>
                   <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Regular Price (₹)</label><input type="number" value={variationForm.price} onChange={e => setVariationForm(p => ({ ...p, price: e.target.value }))} className="w-full h-10 px-4 bg-neutral-50 rounded-lg text-xs font-bold border border-neutral-100 focus:bg-white transition-all outline-none" placeholder="0" /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Discount (₹)</label><input type="number" value={variationForm.discPrice} onChange={e => setVariationForm(p => ({ ...p, discPrice: e.target.value }))} className="w-full h-10 px-4 bg-neutral-50 rounded-lg text-xs font-bold border border-neutral-100 focus:bg-white transition-all outline-none" placeholder="0" /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Stock</label><input type="number" value={variationForm.stock} onChange={e => setVariationForm(p => ({ ...p, stock: e.target.value }))} className="w-full h-10 px-4 bg-neutral-50 rounded-lg text-xs font-bold border border-neutral-100 focus:bg-white transition-all outline-none" placeholder="999" /></div>
                   </div>
                   <button type="button" onClick={addVariation} className="w-full h-10 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">Add Configuration Node</button>
                   <div className="space-y-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                      {variations.map((v, i) => (<div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl mb-2 group transition-all hover:bg-teal-50/50"><div className="flex items-center gap-3"><div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center font-black text-[9px] text-teal-600 shadow-sm border border-neutral-100">{i+1}</div><div><p className="text-[11px] font-black text-slate-800">{v.title}</p><div className="flex items-center gap-2"><p className="text-[10px] font-bold text-teal-600">₹{v.discPrice || v.price}</p>{v.discPrice > 0 && <p className="text-[9px] font-bold text-neutral-400 line-through">₹{v.price}</p>}</div></div></div><button type="button" onClick={() => removeVariation(i)} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-all">×</button></div>))}
                   </div>
                </div>
             </section>

             {/* Add-ons Management */}
             {!isGrocery && (
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
             )}
          </div>

          {/* Section 4: Imagery & Logistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Imagery */}
             <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-teal-600 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Product Images</h2></div><span className="text-[8px] font-black text-neutral-400 uppercase bg-neutral-50 px-3 py-1 rounded-full">Max 5 Photos</span></div>
                <div className="grid grid-cols-4 gap-4">
                   <div className="col-span-4 lg:col-span-2 aspect-video lg:aspect-auto h-48 lg:h-40 rounded-2xl overflow-hidden border-2 border-dashed border-neutral-200 hover:border-teal-500 transition-all bg-neutral-50 group relative">
                      {imageSlots[0].preview ? (
                         <><img src={imageSlots[0].preview} className="w-full h-full object-cover group-hover:scale-105 transition-all" alt="" /><div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><button type="button" onClick={() => clearImageSlot(0)} className="bg-white text-rose-500 w-8 h-8 rounded-lg font-black text-lg">×</button></div></>
                      ) : (
                         <label className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-neutral-100 transition-all"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><polyline points="21 15 16 10 5 21"/></svg><div className="flex flex-col items-center"><span className="text-[10px] font-black text-neutral-800 uppercase tracking-widest">Cover Image</span><span className="text-[8px] font-bold text-neutral-400 uppercase">Primary Display</span></div><input type="file" onChange={e => handleImageSlotChange(0, e)} className="hidden" accept="image/*" /></label>
                      )}
                   </div>
                   <div className="col-span-4 lg:col-span-2 grid grid-cols-4 gap-3 lg:h-40">
                      {imageSlots.slice(1).map((slot, index) => (
                         <div key={index+1} className="aspect-square rounded-xl overflow-hidden border-2 border-dashed border-neutral-200 hover:border-teal-500 transition-all bg-neutral-50 group relative">
                            {slot.preview ? (
                               <><img src={slot.preview} className="w-full h-full object-cover group-hover:scale-105 transition-all" alt="" /><div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><button type="button" onClick={() => clearImageSlot(index+1)} className="bg-white text-rose-500 w-6 h-6 rounded-md font-black text-sm">×</button></div></>
                            ) : (
                               <label className="absolute inset-0 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-neutral-100 transition-all"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><polyline points="21 15 16 10 5 21"/></svg><span className="text-[7px] font-black text-neutral-400 uppercase">Slot {index+2}</span><input type="file" onChange={e => handleImageSlotChange(index+1, e)} className="hidden" accept="image/*" /></label>
                            )}
                         </div>
                      ))}
                   </div>
                </div>
             </section>

             {!isTeaCorner && !isGrocery && (
               <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-6">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-neutral-800 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Compliance & Limits</h2></div>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">HSN Code</label><input type="text" name="hsnCode" value={formData.hsnCode} onChange={handleChange} placeholder="8 digits" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none" /></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">FSSAI License No.</label><input type="text" name="fssaiLicNo" value={formData.fssaiLicNo} onChange={handleChange} placeholder="14 digits" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Weight (e.g. 500g)</label><input type="text" name="weight" value={formData.weight} onChange={handleChange} placeholder="Size/Weight" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none" /></div>
                     <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Max Order limit</label><input type="number" name="totalAllowedQuantity" value={formData.totalAllowedQuantity} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none" /></div>
                  </div>
                  <p className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest mt-2 leading-relaxed opacity-60">Mandatory for GST compliance and shipping calculations.</p>
               </section>
             )}
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
      </div>
    </div>
  );
}
