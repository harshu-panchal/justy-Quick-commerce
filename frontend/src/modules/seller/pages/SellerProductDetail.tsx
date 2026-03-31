import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getProductById, Product } from "../../../services/api/productService";
import { useAuth } from "../../../context/AuthContext";

export default function SellerProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const res = await getProductById(id);
        if (res.success) {
          setProduct(res.data);
          setActiveImage(res.data.mainImageUrl || res.data.mainImage || "");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-teal-600 animate-pulse uppercase tracking-[0.2em]">Synchronizing...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center font-black text-rose-500 uppercase tracking-[0.2em]">Node Not Found</div>;

  const images = [product.mainImageUrl || product.mainImage, ...(product.galleryImageUrls || [])].filter(Boolean);

  return (
    <div className="font-sans antialiased text-neutral-900 pb-20">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
        
        {/* Header Navigation */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2">
                <button onClick={() => navigate("/seller/product/list")} className="text-[10px] font-black text-neutral-400 uppercase hover:text-teal-600 transition-colors">Catalogue</button>
                <span className="text-neutral-300">/</span>
                <span className="text-[10px] font-black text-teal-600 uppercase">Product Detail</span>
             </div>
             <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase italic">{product.productName}</h1>
          </div>
          <div className="flex gap-3">
             <button onClick={() => navigate(`/seller/product/edit/${product._id}`)} className="h-10 px-6 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-teal-700 transition-all">Edit Product</button>
             <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-white border border-neutral-200 rounded-xl text-neutral-400 hover:bg-neutral-50 shadow-sm transition-all">×</button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           
           {/* Visual Section */}
           <div className="lg:col-span-5 space-y-4">
              <div className="aspect-[4/5] bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm relative group">
                 <img src={activeImage || "https://placehold.co/800x1000?text=Product"} alt={product.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                 <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl border border-white/20 ${product.publish ? "bg-teal-500 text-white" : "bg-neutral-900 text-white"}`}>{product.publish ? "Live" : "Draft"}</span>
                    {product.popular && <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl">Best Seller</span>}
                 </div>
              </div>
              <div className="grid grid-cols-5 gap-3">
                 {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(img as string)} className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImage === img ? "border-teal-500 scale-95" : "border-neutral-100 opacity-60 hover:opacity-100"}`}>
                       <img src={img as string} className="w-full h-full object-cover" alt="" />
                    </button>
                 ))}
              </div>
           </div>

           {/* Information Section */}
           <div className="lg:col-span-7 space-y-8">
              
              {/* Core Stats */}
              <div className="bg-slate-900 rounded-3xl p-8 text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
                 <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Primary Valuation</p>
                    <p className="text-5xl font-black tracking-tighter tabular-nums">₹{product.variations?.[0]?.price || 0}<span className="text-sm font-bold opacity-30 ml-2">Starting</span></p>
                 </div>
                 <div className="text-right flex flex-col gap-4 relative z-10">
                    <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10">
                       <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">In Stock</p>
                       <p className="text-xl font-black tabular-nums">{product.variations?.[0]?.stock || 0}</p>
                    </div>
                    <div className="bg-teal-500/20 px-4 py-2 rounded-xl border border-teal-500/20">
                       <p className="text-[9px] font-black uppercase tracking-widest text-teal-400 mb-1">Margin (Est)</p>
                       <p className="text-xl font-black text-teal-400 tabular-nums">12%</p>
                    </div>
                 </div>
                 {/* Decorative background element */}
                 <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              </div>

              {/* Identity Details */}
              <div className="grid grid-cols-2 gap-6">
                 <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-4">Architecture</p>
                    <div className="space-y-4">
                       <div><p className="text-[9px] font-black text-teal-600 uppercase">Domain</p><p className="text-sm font-black text-neutral-800 uppercase italic">{(product.headerCategoryId as any)?.name || "N/A"}</p></div>
                       <div><p className="text-[9px] font-black text-teal-600 uppercase">Category</p><p className="text-sm font-black text-neutral-800 uppercase italic">{(product.categoryId as any)?.name || (product as any).category?.name || "N/A"}</p></div>
                    </div>
                 </div>
                 <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-4">Specifications</p>
                    <div className="space-y-4">
                       <div><p className="text-[9px] font-black text-orange-600 uppercase">Food Type</p><p className="text-sm font-black text-neutral-800">{product.foodType}</p></div>
                       <div><p className="text-[9px] font-black text-orange-600 uppercase">Prep Time</p><p className="text-sm font-black text-neutral-800">{product.preparationTime} Minutes</p></div>
                    </div>
                 </div>
              </div>

              {/* Description */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">
                 <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-4">Product Narrative</p>
                 <p className="text-neutral-600 leading-relaxed font-medium">{product.smallDescription || "No detailed description provided for this node."}</p>
              </div>

              {/* Variation Matrix */}
              <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                 <div className="px-8 py-5 border-b border-neutral-100 flex items-center justify-between">
                    <h3 className="text-[12px] font-black text-neutral-800 uppercase tracking-widest">Pricing Matrix</h3>
                    <span className="text-[9px] font-black text-neutral-300 uppercase italic">{product.variations?.length || 0} Nodes</span>
                 </div>
                 <div className="divide-y divide-neutral-50 px-8">
                    {product.variations?.map((v, i) => (
                       <div key={i} className="py-4 flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                             <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                             <p className="text-[12px] font-black text-neutral-700 group-hover:text-teal-600 transition-colors uppercase italic">{v.name || v.title}</p>
                          </div>
                          <div className="flex items-center gap-8">
                             <div className="text-right"><p className="text-[8px] font-black text-neutral-400 uppercase">Stock</p><p className="text-[12px] font-black text-neutral-800 tabular-nums">{v.stock}</p></div>
                             <div className="text-right"><p className="text-[8px] font-black text-neutral-400 uppercase">Price</p><p className="text-lg font-black text-teal-600 tabular-nums">₹{v.price}</p></div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Fiscal Stats */}
              <div className="bg-neutral-50/50 border border-neutral-100 rounded-2xl p-6 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-orange-500 font-black">₹</div>
                    <div><p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Packaging & Service</p><p className="text-sm font-black text-neutral-800">₹{product.packagingPrice || 0}</p></div>
                 </div>
                 <div className="flex items-center gap-4 text-right">
                    <div><p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">HSN / TAX</p><p className="text-sm font-black text-neutral-800">18% GST (Default)</p></div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
