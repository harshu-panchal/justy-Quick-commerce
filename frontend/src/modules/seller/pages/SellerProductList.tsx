import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getProducts,
  deleteProduct,
  Product,
} from "../../../services/api/productService";
import { getHeaderCategoriesPublic, HeaderCategory } from "../../../services/api/headerCategoryService";
import { useAuth } from "../../../context/AuthContext";

export default function SellerProductList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: "", name: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, hRes] = await Promise.all([
        getProducts({ sellerId: user?._id }), 
        getHeaderCategoriesPublic()
      ]);
      if (pRes.success) setProducts(pRes.data);
    } catch (err) {
      setError("Sync failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredProducts = products.filter(p => 
    p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.headerCategoryId as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
  const paginatedData = filteredProducts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleDelete = async () => {
    try {
      await deleteProduct(deleteModal.id);
      setDeleteModal({ open: false, id: "", name: "" });
      fetchData();
    } catch (err) {
      setError("Failed.");
    }
  };

  return (
    <div className="font-sans antialiased text-neutral-900 pb-20">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
        
        {/* Header - Zoomed Out */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-teal-100 text-teal-600 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm">Product Management</span>
                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest opacity-60">{products.length} Total Products</span>
             </div>
             <h1 className="text-2xl font-black tracking-tight text-neutral-900">Product List</h1>
          </div>
          <button 
            onClick={() => navigate("/seller/product/add")}
            className="h-11 px-8 bg-neutral-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 group border border-neutral-800"
          >
             <span>Add Product</span>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:rotate-90 transition-transform"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </header>

        {/* Filters - Zoomed Out */}
        <div className="bg-white/80 border border-neutral-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm mb-8">
           <div className="relative w-full md:w-[350px]">
              <input 
                type="text" placeholder="Search products..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full h-10 bg-neutral-50/50 border-none rounded-xl pl-10 pr-4 text-[12px] font-bold focus:ring-4 focus:ring-teal-500/10 transition-all outline-none placeholder:text-neutral-300"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
           </div>
           <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-xl">
              <button className="px-5 py-2 bg-white text-neutral-900 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm">All</button>
              <button className="px-5 py-2 text-neutral-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:text-neutral-600 transition-all">Archived</button>
           </div>
        </div>

        {/* Matrix Cluster (Grid) - Zoomed Out */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <AnimatePresence mode="popLayout">
              {paginatedData.map((p, idx) => (
                 <motion.div key={p._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.05 } }} className="group bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm hover:shadow-xl transition-all duration-300 relative">
                    <div className="flex gap-5 items-start mb-5">
                       <div className="w-24 h-32 bg-neutral-50 rounded-xl overflow-hidden border border-neutral-100/50 relative shadow-inner group-hover:scale-105 transition-all">
                          <img src={p.mainImageUrl || p.mainImage || "https://placehold.co/200x300?text=Dish"} className="w-full h-full object-cover" alt={p.productName} />
                          <div className="absolute top-2 left-2"><span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest shadow-xl border border-white/20 ${p.publish ? "bg-teal-500 text-white" : "bg-neutral-800 text-neutral-200"}`}>{p.publish ? "✓ Live" : "Draft"}</span></div>
                       </div>
                       <div className="flex-1 space-y-4 pt-1">
                          <div className="space-y-0.5">
                             <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest opacity-80">{(p.headerCategoryId as any)?.name || "DOMAIN"}</p>
                             <h3 className="text-base font-black text-neutral-900 tracking-tight leading-tight group-hover:text-teal-600 transition-colors uppercase italic">{p.productName}</h3>
                          </div>
                          <div className="space-y-0.5">
                             <p className="text-xl font-black text-neutral-900 tracking-tighter tabular-nums">₹{p.variations?.[0]?.price || 0}</p>
                             <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">{p.variations?.length || 1} Variations</p>
                          </div>
                          <div className="flex gap-2">
                             <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black shadow-sm border border-neutral-100 ${p.foodType === "Veg" ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"}`}>{p.foodType === "Veg" ? "V" : "N"}</span>
                             {p.popular && <span className="w-7 h-7 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center text-[10px] shadow-sm border border-orange-100">🔥</span>}
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-2 pt-4 border-t border-neutral-50/50">
                       <button onClick={() => navigate(`/seller/product/detail/${p._id}`)} className="w-10 h-10 bg-neutral-50 text-neutral-400 rounded-lg hover:bg-teal-50 hover:text-teal-600 transition-all flex items-center justify-center shadow-sm" title="View"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                       <button onClick={() => navigate(`/seller/product/edit/${p._id}`)} className="flex-1 h-10 bg-teal-50 text-teal-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-teal-600 hover:text-white transition-all shadow-sm">Edit</button>
                       <button onClick={() => setDeleteModal({ open: true, id: p._id, name: p.productName })} className="w-10 h-10 bg-white border border-neutral-200 text-neutral-300 rounded-lg hover:text-rose-500 hover:border-rose-200 transition-all flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="3 6 5 6 21 6"/><path d="M19 6h-14v14h14v-14z"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6v-2h6v2"/></svg></button>
                    </div>
                 </motion.div>
              ))}
           </AnimatePresence>
        </div>

        {/* Global Control Footer - Zoomed Out */}
        <footer className="mt-12 p-6 bg-white border border-neutral-200 rounded-2xl flex items-center justify-between shadow-sm">
           <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Page {currentPage} of {totalPages || 1}</p>
           <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-10 h-10 border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-300 hover:text-neutral-900 disabled:opacity-20 transition-all"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="15 18 9 12 15 6"/></svg></button>
              <div className="flex gap-1.5">
                 {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${currentPage === i + 1 ? "bg-neutral-900 text-white shadow-xl" : "text-neutral-400 hover:bg-neutral-50"}`}>{i + 1}</button>
                 ))}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-10 h-10 border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-300 hover:text-neutral-900 disabled:opacity-20 transition-all"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="9 18 15 12 9 6"/></svg></button>
           </div>
        </footer>

        {/* Deletion Protocol Modal */}
        <AnimatePresence>
           {deleteModal.open && (
             <motion.div className="fixed inset-0 z-[200] bg-neutral-900/40 backdrop-blur-3xl flex items-center justify-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl relative border border-neutral-100" initial={{ scale: 0.95 }}>
                   <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">🗑️</div>
                   <h3 className="text-xl font-black text-neutral-900 tracking-tight leading-tight mb-2">Delete Product?</h3>
                   <p className="text-xs text-neutral-400 font-bold mb-8 px-6">Sure you want to remove <span className="text-neutral-900 underline">"{deleteModal.name}"</span>?</p>
                   <div className="flex flex-col gap-2">
                      <button onClick={handleDelete} className="h-12 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20">Execute</button>
                      <button onClick={() => setDeleteModal({ open: false, id: "", name: "" })} className="h-12 bg-neutral-100 text-neutral-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all">Cancel</button>
                   </div>
                </motion.div>
             </motion.div>
           )}
        </AnimatePresence>
      </div>
    </div>
  );
}
