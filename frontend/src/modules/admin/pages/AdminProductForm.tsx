import React, { useState, useEffect } from 'react';
import {
  getProductFields,
  createProductField,
  updateProductField,
  deleteProductField,
  ProductField,
  CreateProductFieldData
} from '../../../services/api/admin/productFieldService';
import {
  getHeaderCategoriesAdmin,
  HeaderCategory
} from '../../../services/api/headerCategoryService';

export default function AdminProductForm() {
  const [fields, setFields] = useState<ProductField[]>([]);
  const [headerCategories, setHeaderCategories] = useState<HeaderCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedHeaderCategory, setSelectedHeaderCategory] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [inputType, setInputType] = useState('text');
  const [options, setOptions] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dependsOnFieldId, setDependsOnFieldId] = useState<string | null>(null);
  const [dependsOnValue, setDependsOnValue] = useState('');
  const [bulkFields, setBulkFields] = useState<string[]>([]);

  // Table states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    fetchHeaderCategories();
    fetchFields();
  }, []);

  const fetchHeaderCategories = async () => {
    try {
      const data = await getHeaderCategoriesAdmin();
      setHeaderCategories(data || []);
    } catch (error) {
      console.error('Failed to fetch header categories', error);
    }
  };

  const fetchFields = async () => {
    try {
      setLoading(true);
      const res = await getProductFields();
      if (res.success) {
        setFields(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch fields', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedHeaderCategory('');
    setSectionTitle('');
    setFieldLabel('');
    setPlaceholder('');
    setInputType('text');
    setOptions([]);
    setIsActive(true);
    setEditingId(null);
    setDependsOnFieldId(null);
    setDependsOnValue('');
    setIsModalOpen(false);
  };

  const handleAddOrUpdate = async () => {
    if (!selectedHeaderCategory) return alert('Please select a header category');
    if (!fieldLabel.trim()) return alert('Please enter field label');
    if (!sectionTitle.trim()) return alert('Please enter a section title');
    if (inputType === 'select' && options.filter(o => o.trim()).length === 0) {
        return alert('Please add at least one option for the dropdown');
    }

    try {
      const payload: CreateProductFieldData = {
        headerCategory: selectedHeaderCategory,
        section: sectionTitle,
        label: fieldLabel,
        placeholder: placeholder,
        type: inputType,
        options: inputType === 'select' ? options.filter(o => o.trim()) : [],
        status: isActive ? 'Active' : 'Inactive',
        dependsOn: dependsOnFieldId ? { fieldId: dependsOnFieldId, value: dependsOnValue } : undefined
      };

      if (editingId) {
        await updateProductField(editingId, payload);
        alert('Field updated successfully!');
      } else {
        await createProductField(payload);
        alert('Field added successfully!');
      }

      fetchFields();
      resetForm();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (field: ProductField) => {
    setEditingId(field._id);
    setSelectedHeaderCategory(typeof field.headerCategory === 'string' ? field.headerCategory : (field.headerCategory as any)?._id);
    setSectionTitle(field.section || '');
    setFieldLabel(field.label);
    setPlaceholder(field.placeholder || '');
    setInputType(field.type);
    setOptions(field.options || []);
    setIsActive(field.status === 'Active');
    setDependsOnFieldId(field.dependsOn?.fieldId || null);
    setDependsOnValue(field.dependsOn?.value || '');
    setIsModalOpen(true);
  };

  const addOption = () => setOptions([...options, '']);
  const updateOption = (index: number, val: string) => {
    const newOptions = [...options];
    newOptions[index] = val;
    setOptions(newOptions);
  };
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));

  const handleBulkDependencyUpdate = async (value: string | null) => {
    if (bulkFields.length === 0) return alert('Select fields first');
    if (!value) return alert('Select a trigger value');
    
    try {
      await Promise.all(bulkFields.map(id => 
        updateProductField(id, {
          dependsOn: { fieldId: editingId!, value }
        })
      ));
      fetchFields();
      setBulkFields([]);
      alert(`Linked ${bulkFields.length} fields successfully`);
    } catch (error) {
      console.error(error);
      alert('Bulk update failed');
    }
  };

  const handleChildDependencyUpdate = async (childId: string, value: string | null) => {
    try {
      await updateProductField(childId, {
        dependsOn: value ? { fieldId: editingId!, value } : { fieldId: null, value: '' }
      });
      fetchFields(); // Refresh to show latest connections
    } catch (error) {
      console.error('Failed to update child dependency', error);
      alert('Failed to update field connection');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this form field?')) {
      try {
        await deleteProductField(id);
        alert('Field deleted successfully!');
        fetchFields();
      } catch (error) {
        console.error(error);
        alert('Failed to delete field');
      }
    }
  };

  const filteredFields = fields.filter(field => {
    const labelMatch = field.label.toLowerCase().includes(searchTerm.toLowerCase());
    const hId = typeof field.headerCategory === 'string' ? field.headerCategory : field.headerCategory?._id;
    const categoryMatch = !categoryFilter || hId === categoryFilter;
    return labelMatch && categoryMatch;
  });

  const totalPages = Math.ceil(filteredFields.length / rowsPerPage);
  const paginatedFields = filteredFields.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const groupedFields = paginatedFields.reduce((acc, field) => {
    const section = field.section || 'Uncategorized';
    if (!acc[section]) acc[section] = [];
    acc[section].push(field);
    return acc;
  }, {} as Record<string, ProductField[]>);

  return (
    <div className="p-4 sm:p-8 bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Product Form Configurator</h1>
            <p className="text-neutral-500 mt-1">Define dynamic fields for different product categories</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
                onClick={() => { resetForm(); if (categoryFilter) setSelectedHeaderCategory(categoryFilter); setIsModalOpen(true); }}
                className="bg-neutral-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-neutral-800 transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Add New Field
            </button>
            <nav className="hidden sm:flex text-sm font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-neutral-200">
                <span className="text-teal-600">Admin</span>
                <span className="mx-2 text-neutral-300">/</span>
                <span className="text-neutral-600">Field Management</span>
            </nav>
          </div>
        </header>

        {/* List Section - Full Width */}
        <div className="bg-white rounded-2xl shadow-xl shadow-neutral-200/50 border border-neutral-200 overflow-hidden min-h-[400px]">
            <div className="p-6 border-b border-neutral-100 bg-neutral-50/30 flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
                <div className="relative w-full max-w-md">
                    <input
                    type="text"
                    placeholder="Search field names..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-12 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all shadow-inner"
                    />
                    <svg className="absolute left-4 top-3 w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest whitespace-nowrap">Filter by category:</label>
                    <select
                        value={categoryFilter}
                        onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                        className="w-full md:w-64 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                        <option value="">All Categories ({fields.length})</option>
                        {headerCategories.map(hc => {
                            const count = fields.filter(f => {
                                const hId = typeof f.headerCategory === 'string' ? f.headerCategory : (f.headerCategory as any)?._id;
                                return hId === hc._id;
                            }).length;
                            return (
                                <option key={hc._id} value={hc._id}>{hc.name} ({count})</option>
                            );
                        })}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-neutral-50/50 border-b border-neutral-100">
                        <th className="px-8 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Header Category</th>
                        <th className="px-8 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Section Title</th>
                        <th className="px-8 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Field Text</th>
                        <th className="px-8 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Input Type</th>
                        <th className="px-8 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Status</th>
                        <th className="px-8 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-sm">
                    {loading ? (
                        <tr><td colSpan={6} className="text-center py-20 text-neutral-400 animate-pulse font-bold uppercase tracking-widest">Synchronizing Catalog...</td></tr>
                    ) : paginatedFields.length > 0 ? (
                        paginatedFields.map((field) => (
                            <tr key={field._id} className="hover:bg-neutral-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <span className="font-bold text-neutral-900 uppercase text-xs italic">
                                                {(field.headerCategory as any)?.name || 'ROOT'}
                                            </span>
                                            {(field.headerCategory as any)?.deliveryType && (
                                                <span className={`block text-[8px] font-bold mt-0.5 ${
                                                    (field.headerCategory as any).deliveryType === 'quick' ? 'text-amber-600' : 'text-indigo-600'
                                                }`}>
                                                    {(field.headerCategory as any).deliveryType.toUpperCase()}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-md text-[9px] font-black uppercase tracking-wider">
                                                {field.section || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="font-extrabold text-neutral-700 block">{field.label}</span>
                                            {field.options && field.options.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {field.options.map((opt, i) => (
                                                        <span key={i} className="text-[9px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded border border-neutral-200">
                                                            {opt}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold text-[10px] uppercase border border-blue-100">
                                                {field.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase border ${
                                                field.status === 'Active' 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                : 'bg-rose-50 text-rose-700 border-rose-200'
                                            }`}>
                                                {field.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right whitespace-nowrap">
                                            <div className="flex justify-end gap-3 text-neutral-400">
                                                <button
                                                    onClick={() => handleEdit(field)}
                                                    className="p-2.5 rounded-xl hover:bg-neutral-900 hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg active:scale-90"
                                                    title="Edit Field"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(field._id)}
                                                    className="p-2.5 rounded-xl hover:bg-rose-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg active:scale-90"
                                                    title="Delete Field"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                    ) : (
                        <tr><td colSpan={6} className="text-center py-40 text-neutral-400 italic font-medium">No field configurations found.</td></tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Implementation */}
            {totalPages > 1 && (
                <div className="p-6 bg-white border-t border-neutral-100 flex items-center justify-between">
                    <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                        Page {currentPage} of {totalPages} ({filteredFields.length} Total Fields)
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="w-10 h-10 border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-900 disabled:opacity-20 transition-all hover:bg-neutral-50"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        
                        <div className="flex gap-1.5">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                                        currentPage === i + 1 
                                        ? "bg-neutral-900 text-white shadow-xl" 
                                        : "text-neutral-400 hover:bg-neutral-50"
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="w-10 h-10 border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-900 disabled:opacity-20 transition-all hover:bg-neutral-50"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Modal for Add/Edit */}
        {isModalOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                <div 
                    className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
                    onClick={resetForm}
                ></div>
                <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="bg-neutral-900 px-6 py-5 flex items-center justify-between">
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                             <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                             {editingId ? 'Edit Configuration' : 'New Field Definition'}
                        </h2>
                        <button onClick={resetForm} className="text-neutral-400 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Assigned Header Category</label>
                            <select
                                value={selectedHeaderCategory}
                                onChange={(e) => setSelectedHeaderCategory(e.target.value)}
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all appearance-none cursor-pointer font-bold text-neutral-700"
                            >
                                <option value="">Selection Required</option>
                                <optgroup label="Quick Order Commerce">
                                    {headerCategories.filter(c => c.deliveryType === 'quick').map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </optgroup>
                                {headerCategories.some(c => c.deliveryType === 'scheduled') && (
                                    <optgroup label="Service-Based Commerce">
                                        <option value={headerCategories.find(c => c.deliveryType === 'scheduled')?._id}>
                                            Scheduled Category
                                        </option>
                                    </optgroup>
                                )}
                            </select>
                        </div>
                        
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Section Title (Group Name)</label>
                             <input
                                 type="text"
                                 value={sectionTitle}
                                 onChange={(e) => setSectionTitle(e.target.value)}
                                 placeholder="e.g. Product Identity, Pricing, Specs..."
                                 className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-bold placeholder:text-neutral-300"
                             />
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Input Label / Display Text</label>
                             <input
                                 type="text"
                                 value={fieldLabel}
                                 onChange={(e) => setFieldLabel(e.target.value)}
                                 placeholder="e.g. Manufacture Date, Potency..."
                                 className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-bold placeholder:text-neutral-300"
                             />
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Custom Placeholder (Optional)</label>
                             <input
                                 type="text"
                                 value={placeholder}
                                 onChange={(e) => setPlaceholder(e.target.value)}
                                 placeholder="What seller sees inside input..."
                                 className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-bold placeholder:text-neutral-300"
                             />
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Input Strategy</label>
                             <select
                                 value={inputType}
                                 onChange={(e) => setInputType(e.target.value)}
                                 className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all appearance-none cursor-pointer font-bold text-neutral-700"
                             >
                                 <option value="text">Input Text</option>
                                 <option value="number">Input Number</option>
                                 <option value="select">Input Dropdown</option>
                                 <option value="multi-input">Input Multi Text</option>
                                 <option value="file">Input File Upload</option>
                                 <option value="date">Input Date</option>
                                 <option value="time">Input Time</option>
                                 <option value="checkbox">Input Checkbox</option>
                                 <option value="toggle">Input Toggle / Switch</option>
                             </select>
                        </div>

                        {inputType === 'select' && (
                            <div className="space-y-3 p-4 bg-teal-50 border border-teal-100 rounded-2xl">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-teal-600 uppercase tracking-widest">DropDown Selection Values</label>
                                    <button 
                                        type="button"
                                        onClick={addOption}
                                        className="text-[10px] font-bold text-white bg-teal-600 px-3 py-1 rounded-lg hover:bg-teal-700 shadow-sm"
                                    >
                                        + Add Option
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {options.map((opt, idx) => (
                                        <div key={idx} className="flex flex-col gap-2 p-3 bg-white/50 rounded-xl border border-teal-100">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => updateOption(idx, e.target.value)}
                                                    placeholder={`Value ${idx + 1}`}
                                                    className="flex-1 px-3 py-2 bg-white border border-teal-200 rounded-lg text-sm font-bold outline-none focus:border-teal-500"
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => removeOption(idx)}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                            
                                            {/* Multi-Select for dependent fields */}
                                            {editingId && opt.trim() && (
                                                <div className="bg-teal-50/50 p-2 rounded-lg space-y-2">
                                                    <label className="text-[8px] font-black text-teal-600 uppercase tracking-widest block ml-1">Trigger Fields for "{opt}":</label>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {fields
                                                            .filter(f => f._id !== editingId && (typeof f.headerCategory === 'string' ? f.headerCategory : (f.headerCategory as any)?._id) === selectedHeaderCategory)
                                                            .map(f => {
                                                                const isLinked = f.dependsOn?.fieldId === editingId && f.dependsOn?.value === opt;
                                                                return (
                                                                    <button
                                                                        key={f._id}
                                                                        type="button"
                                                                        onClick={() => handleChildDependencyUpdate(f._id, isLinked ? null : opt)}
                                                                        className={`text-[9px] font-bold px-2 py-1 rounded-full border transition-all ${
                                                                            isLinked 
                                                                            ? "bg-teal-600 text-white border-teal-600 shadow-sm" 
                                                                            : "bg-white text-teal-400 border-teal-100 hover:border-teal-300"
                                                                        }`}
                                                                    >
                                                                        {isLinked && "✓ "}{f.label}
                                                                    </button>
                                                                );
                                                            })
                                                        }
                                                        {fields.filter(f => f._id !== editingId && (typeof f.headerCategory === 'string' ? f.headerCategory : (f.headerCategory as any)?._id) === selectedHeaderCategory).length === 0 && (
                                                            <span className="text-[8px] text-teal-300 uppercase italic font-bold">No fields available to link</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {options.length === 0 && (
                                        <p className="text-[10px] text-teal-400 font-bold uppercase text-center py-2">Add at least one option</p>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {inputType === 'select' && editingId && (
                            <div className="space-y-4 p-5 bg-indigo-50 border border-indigo-100 rounded-3xl">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Bulk Link Fields (Multi-Select)</h3>
                                </div>
                                
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-indigo-500 uppercase">1. Select Fields to Show:</label>
                                    <div className="relative group">
                                        <div className="min-h-[44px] p-2 bg-white border border-indigo-200 rounded-xl flex flex-wrap gap-1.5 focus-within:border-indigo-500 transition-all cursor-text">
                                            {bulkFields.length === 0 && <span className="text-xs text-neutral-400 py-1 px-2">Select category fields...</span>}
                                            {bulkFields.map(id => (
                                                <span key={id} className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                                    {fields.find(f => f._id === id)?.label}
                                                    <button onClick={() => setBulkFields(bulkFields.filter(f => f !== id))}><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                                                </span>
                                            ))}
                                        </div>
                                        {/* Simple Searchable List Dropdown */}
                                        <div className="mt-2 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-white/50 border border-indigo-50 rounded-xl custom-scrollbar">
                                            {selectedHeaderCategory ? (
                                                fields
                                                .filter(f => 
                                                    f._id !== editingId && 
                                                    f.status === 'Active' &&
                                                    (typeof f.headerCategory === 'string' ? f.headerCategory : (f.headerCategory as any)?._id) === selectedHeaderCategory
                                                )
                                                .map(f => (
                                                    <label key={f._id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors group">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={bulkFields.includes(f._id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setBulkFields([...bulkFields, f._id]);
                                                                else setBulkFields(bulkFields.filter(id => id !== f._id));
                                                            }}
                                                            className="w-4 h-4 rounded text-indigo-600 border-indigo-200 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-[10px] font-bold text-neutral-600 group-hover:text-indigo-600">{f.label}</span>
                                                    </label>
                                                ))
                                            ) : (
                                                <p className="col-span-2 text-center py-4 text-[10px] font-bold text-indigo-400 uppercase">Please Select a Header Category Above first</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-2 space-y-3">
                                        <label className="text-[10px] font-black text-indigo-500 uppercase">2. Select Dropdown Trigger:</label>
                                        <div className="flex gap-2">
                                            <select 
                                                className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-600"
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val) handleBulkDependencyUpdate(val);
                                                }}
                                            >
                                                <option value="">Select Option to Trigger...</option>
                                                {options.filter(o => o.trim()).map(opt => (
                                                    <option key={opt} value={opt}>When selected: {opt}</option>
                                                ))}
                                            </select>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    if (confirm(`Show these ${bulkFields.length} fields for all options? (Always Show)`)) {
                                                        handleBulkDependencyUpdate(null);
                                                    }
                                                }}
                                                className="px-4 py-2 bg-neutral-100 text-neutral-600 rounded-xl text-[10px] font-bold hover:bg-neutral-200 transition-all"
                                            >
                                                Always Show
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Conditional Visibility Section */}
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Conditional Visibility (Optional)</label>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-amber-700 uppercase ml-1">Parent Dropdown</label>
                                    <select
                                        value={dependsOnFieldId || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setDependsOnFieldId(val || null);
                                            setDependsOnValue('');
                                        }}
                                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-bold outline-none focus:border-amber-500"
                                    >
                                        {selectedHeaderCategory ? (
                                            <>
                                                <option value="">None (Always Show)</option>
                                                {fields
                                                    .filter(f => 
                                                        f._id !== editingId && 
                                                        f.status === 'Active' &&
                                                        (typeof f.headerCategory === 'string' ? f.headerCategory : (f.headerCategory as any)?._id) === selectedHeaderCategory
                                                    )
                                                    .map(f => (
                                                        <option key={f._id} value={f._id}>{f.label} ({f.type})</option>
                                                    ))
                                                }
                                            </>
                                        ) : (
                                            <option disabled>Select Category First</option>
                                        )}
                                    </select>
                                </div>
                                
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-amber-700 uppercase ml-1">Show If Value Is</label>
                                    {dependsOnFieldId && ['text', 'number', 'date', 'time'].includes(fields.find(f => f._id === dependsOnFieldId)?.type || '') ? (
                                        <input
                                            type="text"
                                            value={dependsOnValue}
                                            onChange={(e) => setDependsOnValue(e.target.value)}
                                            placeholder="Enter value..."
                                            className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-bold outline-none focus:border-amber-500"
                                        />
                                    ) : (
                                        <select
                                            value={dependsOnValue}
                                            onChange={(e) => setDependsOnValue(e.target.value)}
                                            disabled={!dependsOnFieldId}
                                            className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-bold outline-none focus:border-amber-500 disabled:bg-amber-100/50 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Select Value</option>
                                            {dependsOnFieldId && fields.find(f => f._id === dependsOnFieldId)?.type === 'select' ? (
                                                fields.find(f => f._id === dependsOnFieldId)?.options?.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))
                                            ) : dependsOnFieldId && ['checkbox', 'toggle'].includes(fields.find(f => f._id === dependsOnFieldId)?.type || '') ? (
                                                <>
                                                    <option value="true">True (Checked)</option>
                                                    <option value="false">False (Unchecked)</option>
                                                </>
                                            ) : null}
                                        </select>
                                    )}
                                </div>
                            </div>
                            <p className="text-[9px] text-amber-500 font-medium italic underline underline-offset-2">
                                * This field will only appear when the selected value matches in the parent field.
                            </p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                             <div>
                                 <span className="block text-sm font-black text-neutral-800 uppercase tracking-tight">Active Status</span>
                                 <span className="text-[10px] font-bold text-neutral-400 uppercase">{isActive ? 'Shown to sellers' : 'Currently Hidden'}</span>
                             </div>
                             <button
                                 onClick={() => setIsActive(!isActive)}
                                 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none ${isActive ? 'bg-teal-600' : 'bg-neutral-300'}`}
                             >
                                 <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                             </button>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={handleAddOrUpdate}
                                className="flex-1 bg-neutral-900 text-white font-black py-3.5 rounded-xl hover:bg-neutral-800 transition-all shadow-xl active:scale-95 uppercase text-xs tracking-[0.1em]"
                            >
                                {editingId ? 'Update Definition' : 'Save Definition'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
