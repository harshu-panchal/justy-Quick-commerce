import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCategories, Category } from "../../../services/api/categoryService";
import { getHeaderCategoriesPublic, HeaderCategory } from "../../../services/api/headerCategoryService";
import api from "../../../services/api/config";
import { useAuth } from "../../../context/AuthContext";
import toast from 'react-hot-toast';

export default function SellerCategory() {
  const { user } = useAuth();
  
  const [headerCategories, setHeaderCategories] = useState<HeaderCategory[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 7;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    headerCategoryId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hRes, sRes] = await Promise.all([
        getHeaderCategoriesPublic(true),
        getCategories()
      ]);
      const rawCategory = (user?.category || (user?.categories && (user.categories as string[]).length > 0 ? (user.categories as string[])[0] : null));
      const sellerCategory = rawCategory?.trim().toLowerCase();
      
      // Filter to show ONLY the seller's assigned category
      const filteredH = hRes.filter((h: any) => {
        const hName = h.name?.trim().toLowerCase();
        return hName === sellerCategory || hName?.includes(sellerCategory || "") || sellerCategory?.includes(hName || "");
      });

      setHeaderCategories(filteredH);
      
      if (filteredH.length > 0) {
        setFormData(prev => ({ ...prev, headerCategoryId: filteredH[0]._id }));
      }
      
      if (sRes.success) {
        // Filter subcategories by the seller's registered header category
        const filteredBySeller = sRes.data.filter((cat: any) => 
          cat.headerCategoryId?.name === sellerCategory
        );
        setSubCategories(filteredBySeller);
      }
    } catch (err) {
      setError("Sync failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredCategories = subCategories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.headerCategoryId as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredCategories.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(filteredCategories.length / rowsPerPage);

  const handleEdit = (cat: Category) => {
    setSelectedCategoryId(cat._id);
    setFormData({
      name: cat.name,
      headerCategoryId: typeof cat.headerCategoryId === 'string' ? cat.headerCategoryId : (cat.headerCategoryId as any)?._id || "",
    });
    setIsModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.headerCategoryId) { 
      toast.error("Fields required."); 
      return; 
    }
    setSubmitting(true);
    try {
      if (selectedCategoryId) {
        // Update existing category
        await api.put(`/categories/${selectedCategoryId}`, { 
          name: formData.name, 
          headerCategoryId: formData.headerCategoryId 
        });
        toast.success("Category updated successfully! ✨");
      } else {
        // Create new category
        await api.post("/categories", { 
          name: formData.name, 
          headerCategoryId: formData.headerCategoryId, 
          status: "Unpublished" 
        });
        toast.success("Category added successfully! ✨");
      }
      setIsModalOpen(false);
      setSelectedCategoryId(null);
      setFormData({ name: "", headerCategoryId: "" });
      fetchData();
    } catch (err: any) { 
      toast.error(err.response?.data?.message || "Sync failed."); 
    } finally { 
      setSubmitting(false); 
    }
  };

  return (
    <div className="font-sans antialiased text-slate-900 pb-10">
      <div className="max-w-7xl mx-auto py-8 lg:py-10 px-4 sm:px-6">
        
        {/* Header - Zoomed Out */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="space-y-1">
             <nav className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                <span>Enterprise</span><span className="text-slate-200">/</span><span className="text-teal-600">Product Map</span>
             </nav>
             <h1 className="text-2xl font-black tracking-tight text-slate-900">Category Architecture</h1>
          </div>
          <button 
            onClick={() => {
              setSelectedCategoryId(null);
              setFormData({ name: "", headerCategoryId: headerCategories[0]?._id || "" });
              setIsModalOpen(true);
            }}
            className="h-11 px-8 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.1em] hover:bg-slate-800 transition-all flex items-center gap-3 shadow-lg"
          >
             <span className="bg-teal-500 text-white w-5 h-5 rounded-md flex items-center justify-center font-black">+</span>
             New Category
          </button>
        </header>

        {/* Search - Zoomed Out */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm mb-8">
           <div className="relative w-full md:w-[320px]">
              <input 
                type="text" placeholder="Quick search..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 text-[12px] font-bold focus:bg-white focus:border-teal-500 transition-all outline-none"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
           </div>
           <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 font-black text-[8px] text-slate-400 uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />Active</div>
              <div className="flex items-center gap-2 font-black text-[8px] text-slate-400 uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-rose-500 shadow-sm" />Pending</div>
           </div>
        </div>

        {/* Table - Zoomed Out */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Active Hierarchy</h2>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{filteredCategories.length} Nodes</p>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                       <th className="p-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Image</th>
                       <th className="p-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Name</th>
                       <th className="p-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Parent Category</th>
                       <th className="p-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    <AnimatePresence mode="popLayout">
                       {paginatedData.map((cat) => (
                          <motion.tr key={cat._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group hover:bg-slate-50/40 transition-all duration-300">
                             <td className="p-5">
                                <div className="w-16 h-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-100 shadow-inner"><img src={cat.image || "https://placehold.co/80x50?text=Asset"} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt={cat.name} /></div>
                             </td>
                             <td className="p-5"><div className="space-y-0.5"><p className="text-[13px] font-black text-slate-800 group-hover:text-teal-600 transition-colors uppercase italic">{cat.name}</p><p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">ID {cat._id.slice(-6).toUpperCase()}</p></div></td>
                             <td className="p-5"><span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black tracking-widest uppercase border border-slate-100">{(cat as any).headerCategoryId?.name || "Global Tier"}</span></td>
                             <td className="p-5 text-right">
                                <div className="flex items-center justify-end gap-3">
                                  <button 
                                    onClick={() => handleEdit(cat)}
                                    className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                    title="Edit Category"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                  </button>
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${cat.status === "Published" || cat.status === "Active" || cat.isActive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}><div className={`w-1.5 h-1.5 rounded-full ${cat.status === "Published" || cat.status === "Active" || cat.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />{cat.status === "Published" || cat.status === "Active" || cat.isActive ? "Active" : "Pending"}</span>
                                </div>
                             </td>
                          </motion.tr>
                       ))}
                    </AnimatePresence>
                 </tbody>
              </table>
           </div>
           <footer className="p-6 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages || 1}</p>
              <div className="flex items-center gap-2">
                 <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all disabled:opacity-20 shadow-sm"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>
                 <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all disabled:opacity-20 shadow-sm"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>
              </div>
           </footer>
        </div>

        {/* Modal - Zoomed Out */}
        <AnimatePresence>
           {isModalOpen && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-slate-900/30 backdrop-blur-3xl flex items-center justify-center p-6">
                <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative border border-slate-100">
                   <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-300">×</button>
                   <form onSubmit={handleAddSubmit} className="space-y-6">
                      <div className="space-y-1"><h3 className="text-xl font-black text-slate-900 tracking-tight">{selectedCategoryId ? 'Update Category' : 'Create New Category'}</h3></div>
                      <div className="space-y-4">
                         <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Parent Category</label>
                           <select 
                             value={formData.headerCategoryId} 
                             onChange={e => setFormData(p => ({ ...p, headerCategoryId: e.target.value }))} 
                             className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-[12px] font-black outline-none"
                           >
                             <option value="">Select Category</option>
                             {headerCategories.map(h => (
                               <option key={h._id} value={h._id}>{h.name}</option>
                             ))}
                           </select>
                         </div>
                         <div className="space-y-2"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label><input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Category Name" className="w-full h-12 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-black outline-none" /></div>
                      </div>
                      <button type="submit" disabled={submitting} className="w-full h-14 bg-slate-900 text-white rounded-[1.2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-lg">{submitting ? "..." : (selectedCategoryId ? "Update Category" : "Submit Category")}</button>
                   </form>
                </motion.div>
             </motion.div>
           )}
        </AnimatePresence>
      </div>
    </div>
  );
}
