import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";
import {
  getHeaderCategoriesPublic,
  HeaderCategory
} from "../../../services/api/headerCategoryService";
import {
  getCategories,
  Category
} from "../../../services/api/categoryService";
import { 
  createProduct
} from "../../../services/api/productService";
import { getBrands } from "../../../services/api/brandService";
import api from "../../../services/api/config";
import toast from "react-hot-toast";
import IconLoader from "../../../components/loaders/IconLoader";
import { uploadImages } from "../../../services/api/uploadService";

interface ProductField {
  _id: string;
  label: string;
  type: string;
  section: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  headerCategory: any;
  status: string;
}

export default function SellerDynamicAddProduct() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [headerCategories, setHeaderCategories] = useState<HeaderCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [dynamicFields, setDynamicFields] = useState<ProductField[]>([]);
  
  // Form states — only classification fields remain static
  const [formData, setFormData] = useState({
    headerCategory: "",
    category: "",
    brand: "",
  });
  const [dynamicData, setDynamicData] = useState<Record<string, any>>({});

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [hRes, cRes, fRes, bRes] = await Promise.all([
          getHeaderCategoriesPublic(),
          getCategories(),
          api.get("/products/product-fields").then(r => r.data),
          getBrands()
        ]);

        if (hRes) setHeaderCategories(hRes.filter((hc: any) => hc.status === "Published"));
        if (cRes.success) setCategories(cRes.data);
        if (fRes.success) setDynamicFields(fRes.data);
        if (bRes.success) setBrands(bRes.data);

        // Auto-select seller's category if possible
        const sellerCatName = (user?.category || (user?.categories && user.categories[0]) || "").toLowerCase();
        const matchedHC = hRes.find((hc: any) => hc.name.toLowerCase() === sellerCatName);
        
        if (matchedHC) {
          setFormData(prev => ({ ...prev, headerCategory: matchedHC._id }));
        }

      } catch (error) {
        console.error("Initialization error:", error);
        toast.error("Failed to load form data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  const currentHCFields = dynamicFields.filter(f => {
    const hId = typeof f.headerCategory === 'string' ? f.headerCategory : f.headerCategory?._id;
    return hId === formData.headerCategory && f.status === 'Active';
  });

  const groupedFields = currentHCFields.reduce((acc, f) => {
    const section = f.section;
    if (!acc[section]) acc[section] = [];
    acc[section].push(f);
    return acc;
  }, {} as Record<string, ProductField[]>);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDynamicChange = (fieldId: string, value: any) => {
    setDynamicData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.headerCategory) return toast.error("Please select a category");
    
    setSubmitting(true);
    try {
      const payload = {
        headerCategoryId: formData.headerCategory,
        categoryId: formData.category || undefined,
        brandId: formData.brand || undefined,
        dynamicFields: dynamicData,
        publish: true,
      };
      
      const res = await createProduct(payload as any);
      if (res.success) {
        toast.success("Product created successfully!");
        navigate("/seller/product/list");
      } else {
        toast.error(res.message || "Failed to create product");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <IconLoader forceShow />;

  const hasForm = currentHCFields.length > 0;

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Create New Product</h1>
          <p className="text-neutral-500 font-medium">Add product details for your assigned category</p>
        </header>

        {!formData.headerCategory ? (
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-amber-800 font-bold">
                Your account is not assigned to any product category. Please contact support.
            </div>
        ) : !hasForm ? (
            <div className="bg-rose-50 border border-rose-200 p-8 rounded-3xl text-center space-y-4">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-xl font-black text-rose-900">Custom Form Not Found</h2>
                <p className="text-rose-700 max-w-md mx-auto">
                    Admin has not yet configured the dynamic form for your category 
                    <span className="bg-rose-100 px-2 py-0.5 rounded mx-1 uppercase italic">
                        {headerCategories.find(hc => hc._id === formData.headerCategory)?.name}
                    </span>.
                </p>
                <div className="pt-4">
                    <button onClick={() => navigate(-1)} className="bg-rose-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95">Go Back</button>
                </div>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Permanent classification & core identity section */}
                <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-sm font-black text-rose-600 uppercase tracking-widest whitespace-nowrap">Classification & Identity</h2>
                        <div className="h-px w-full bg-rose-50"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Header Category</label>
                            <input 
                                type="text" 
                                readOnly 
                                value={headerCategories.find(hc => hc._id === formData.headerCategory)?.name || "Not Assigned"} 
                                className="w-full h-11 px-4 bg-neutral-100/50 rounded-xl border border-neutral-100 text-neutral-500 font-bold outline-none cursor-not-allowed" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Sub Category</label>
                            <select 
                                name="category" 
                                value={formData.category} 
                                onChange={handleInputChange} 
                                required 
                                className="w-full h-11 px-4 bg-neutral-50 rounded-xl border border-neutral-100 focus:bg-white focus:border-rose-500 outline-none transition-all cursor-pointer font-bold"
                            >
                                <option value="">Select Sub-Category</option>
                                {categories.filter(c => (c.headerCategoryId as any)?._id === formData.headerCategory || c.headerCategoryId === formData.headerCategory).map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Product Brand</label>
                            <select 
                                name="brand" 
                                value={formData.brand} 
                                onChange={handleInputChange} 
                                className="w-full h-11 px-4 bg-neutral-50 rounded-xl border border-neutral-100 focus:bg-white focus:border-rose-500 outline-none transition-all cursor-pointer font-bold"
                            >
                                <option value="">Select Brand</option>
                                {brands.map(b => (
                                    <option key={b._id} value={b._id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                {/* Dynamic Content Grouped by Sections */}
                {Object.entries(groupedFields).map(([sectionName, fields]) => (
                    <motion.section 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={sectionName} 
                        className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-6"
                    >
                        <div className="flex items-center gap-4">
                            <h2 className="text-sm font-black text-indigo-600 uppercase tracking-widest whitespace-nowrap">{sectionName}</h2>
                            <div className="h-px w-full bg-indigo-50"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {fields.map(field => (
                                <div key={field._id} className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                                    </label>
                                    
                                    {field.type === "text" && (
                                        <input 
                                            type="text" 
                                            placeholder={field.placeholder}
                                            required={field.required}
                                            value={dynamicData[field._id] || ""}
                                            onChange={(e) => handleDynamicChange(field._id, e.target.value)}
                                            className="w-full h-11 px-4 bg-neutral-50 rounded-xl border border-neutral-100 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold"
                                        />
                                    )}

                                    {field.type === "number" && (
                                        <input 
                                            type="number" 
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            value={dynamicData[field._id] || ""}
                                            onChange={(e) => handleDynamicChange(field._id, e.target.value)}
                                            className="w-full h-11 px-4 bg-neutral-50 rounded-xl border border-neutral-100 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold"
                                        />
                                    )}

                                    {field.type === "select" && (
                                        <select 
                                            required={field.required}
                                            value={dynamicData[field._id] || ""}
                                            onChange={(e) => handleDynamicChange(field._id, e.target.value)}
                                            className="w-full h-11 px-4 bg-neutral-50 rounded-xl border border-neutral-100 focus:bg-white focus:border-indigo-500 outline-none transition-all cursor-pointer font-bold appearance-none"
                                        >
                                            <option value="">{field.placeholder || "Select Option"}</option>
                                            {field.options?.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    )}

                                    {field.type === "date" && (
                                        <input 
                                            type="date" 
                                            required={field.required}
                                            value={dynamicData[field._id] || ""}
                                            onChange={(e) => handleDynamicChange(field._id, e.target.value)}
                                            className="w-full h-11 px-4 bg-neutral-50 rounded-xl border border-neutral-100 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold"
                                        />
                                    )}

                                    {field.type === "time" && (
                                        <input 
                                            type="time" 
                                            required={field.required}
                                            value={dynamicData[field._id] || ""}
                                            onChange={(e) => handleDynamicChange(field._id, e.target.value)}
                                            className="w-full h-11 px-4 bg-neutral-50 rounded-xl border border-neutral-100 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold"
                                        />
                                    )}

                                    {field.type === "checkbox" && (
                                        <div className="flex items-center gap-3 h-11">
                                            <input 
                                                type="checkbox" 
                                                id={field._id}
                                                checked={!!dynamicData[field._id]}
                                                onChange={(e) => handleDynamicChange(field._id, e.target.checked)}
                                                className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <label htmlFor={field._id} className="text-sm font-bold text-neutral-600 cursor-pointer">
                                                {field.placeholder || `Enable ${field.label}`}
                                            </label>
                                        </div>
                                    )}

                                    {field.type === "toggle" && (
                                        <div className="flex items-center justify-between h-11 px-4 bg-neutral-50 rounded-xl border border-neutral-100">
                                            <span className="text-[10px] font-black text-neutral-400 uppercase">Status: {dynamicData[field._id] ? 'ON' : 'OFF'}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleDynamicChange(field._id, !dynamicData[field._id])}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none ${dynamicData[field._id] ? 'bg-indigo-600' : 'bg-neutral-300'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dynamicData[field._id] ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    )}

                                    {field.type === "file" && (
                                        <div className="space-y-4">
                                            <div className="relative group">
                                                <input 
                                                    type="file" 
                                                    multiple
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        const files = Array.from(e.target.files || []);
                                                        if (files.length > 0) {
                                                            const loadToast = toast.loading(`Uploading ${files.length} images...`);
                                                            try {
                                                                // Use our backend upload service which is already configured
                                                                const uploadResults = await uploadImages(files, "products/dynamic");
                                                                const urls = uploadResults.map(r => r.secureUrl);
                                                                
                                                                const current = Array.isArray(dynamicData[field._id]) ? dynamicData[field._id] : (dynamicData[field._id] ? [dynamicData[field._id]] : []);
                                                                handleDynamicChange(field._id, [...current, ...urls]);
                                                                toast.success("Images uploaded successfully!");
                                                            } catch (err) {
                                                                toast.error("Upload failed. Using backup method...");
                                                                console.error(err);
                                                            } finally {
                                                                toast.dismiss(loadToast);
                                                                e.target.value = ""; // Clear input
                                                            }
                                                        }
                                                    }}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                                />
                                                <div className="w-full h-11 px-4 bg-neutral-50 rounded-xl flex items-center justify-between border border-neutral-100 group-hover:border-indigo-500 transition-all font-bold text-xs truncate">
                                                    <span className="text-neutral-500 truncate">{Array.isArray(dynamicData[field._id]) && dynamicData[field._id].length > 0 ? `${dynamicData[field._id].length} Files Attached` : (field.placeholder || `Upload ${field.label}`)}</span>
                                                    <svg className="w-4 h-4 text-neutral-400 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                </div>
                                            </div>

                                            {/* Preview Grid */}
                                            {Array.isArray(dynamicData[field._id]) && dynamicData[field._id].length > 0 && (
                                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                                                    {dynamicData[field._id].map((url: string, idx: number) => (
                                                        <div key={idx} className="relative aspect-square group">
                                                            <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover rounded-lg border border-neutral-100 shadow-sm" />
                                                            <button 
                                                                type="button"
                                                                onClick={() => {
                                                                    const updated = dynamicData[field._id].filter((_: any, i: number) => i !== idx);
                                                                    handleDynamicChange(field._id, updated);
                                                                }}
                                                                className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {field.type === "multi-input" && (
                                        <div className="space-y-3">
                                            {(dynamicData[field._id] || [""]).map((val: string, idx: number) => (
                                                <div key={idx} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                                                    <input 
                                                        type="text" 
                                                        placeholder={field.placeholder || `Enter ${field.label} ${idx + 1}`}
                                                        value={val}
                                                        onChange={(e) => {
                                                            const current = [...(dynamicData[field._id] || [""])];
                                                            current[idx] = e.target.value;
                                                            handleDynamicChange(field._id, current);
                                                        }}
                                                        className="flex-1 h-11 px-4 bg-neutral-50 rounded-xl border border-neutral-100 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold"
                                                    />
                                                    {(dynamicData[field._id] || [""]).length > 1 && (
                                                        <button 
                                                            type="button" 
                                                            onClick={() => {
                                                                const current = (dynamicData[field._id] || [""]).filter((_: any, i: number) => i !== idx);
                                                                handleDynamicChange(field._id, current);
                                                            }}
                                                            className="w-11 h-11 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-100 transition-colors"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    const current = dynamicData[field._id] || [""];
                                                    handleDynamicChange(field._id, [...current, ""]);
                                                }}
                                                className="flex items-center gap-2 text-indigo-600 font-bold text-xs bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all active:scale-95"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                                Add More {field.label}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.section>
                ))}

                <div className="pt-6">
                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full bg-neutral-900 text-white py-4 rounded-2xl font-black text-lg tracking-widest shadow-2xl hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:bg-neutral-400"
                    >
                        {submitting ? "Processing..." : "Submit Product"}
                    </button>
                    <p className="text-center text-[10px] text-neutral-400 mt-4 uppercase font-bold tracking-tighter italic">This will send the product for admin review and publication.</p>
                </div>
            </form>
        )}
      </div>
    </div>
  );
}
