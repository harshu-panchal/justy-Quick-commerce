import React, { useState, useEffect } from 'react';
import {
  getExecutiveKycFields,
  createExecutiveKycField,
  updateExecutiveKycField,
  deleteExecutiveKycField,
  ExecutiveKycField,
  CreateExecutiveKycFieldData
} from '../../../services/api/admin/executiveKycFieldService';

export default function AdminExecutiveKycForm() {
  const [fields, setFields] = useState<ExecutiveKycField[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [sectionTitle, setSectionTitle] = useState('General');
  const [fieldLabel, setFieldLabel] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [inputType, setInputType] = useState('text');
  const [options, setOptions] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isRequired, setIsRequired] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dependsOnFieldId, setDependsOnFieldId] = useState<string | null>(null);
  const [dependsOnValue, setDependsOnValue] = useState('');
  const [bulkFields, setBulkFields] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [fieldSearch, setFieldSearch] = useState('');
  const [tempOptionLinks, setTempOptionLinks] = useState<Record<string, string[]>>({});

  // Table states
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const res = await getExecutiveKycFields();
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
    setSectionTitle('General');
    setFieldLabel('');
    setPlaceholder('');
    setInputType('text');
    setOptions([]);
    setIsActive(true);
    setIsRequired(false);
    setEditingId(null);
    setDependsOnFieldId(null);
    setDependsOnValue('');
    setTempOptionLinks({});
    setIsModalOpen(false);
  };

  const handleAddOrUpdate = async () => {
    if (!fieldLabel.trim()) return alert('Please enter field label');
    if (!sectionTitle.trim()) return alert('Please enter a section title');
    if (inputType === 'select' && options.filter(o => o.trim()).length === 0) {
        return alert('Please add at least one option for the dropdown');
    }

    try {
      const payload: CreateExecutiveKycFieldData = {
        section: sectionTitle,
        label: fieldLabel,
        placeholder: placeholder,
        type: inputType,
        options: inputType === 'select' ? options.filter(o => o.trim()) : [],
        status: isActive ? 'Active' : 'Inactive',
        isRequired: isRequired,
        dependsOn: dependsOnFieldId ? { fieldId: dependsOnFieldId, value: dependsOnValue } : undefined
      };

      const res = editingId ? await updateExecutiveKycField(editingId, payload) : await createExecutiveKycField(payload);
      
      if (res.success) {
        const fieldId = editingId || res.data._id;
        
        // Handle pending option links (especially important for new fields)
        if (!editingId && Object.keys(tempOptionLinks).length > 0) {
            await Promise.all(
                Object.entries(tempOptionLinks).flatMap(([opt, childIds]) => 
                    childIds.map(childId => updateExecutiveKycField(childId, {
                        dependsOn: { fieldId, value: opt }
                    }))
                )
            );
        }
        
        alert(editingId ? 'Field updated successfully!' : 'Field added successfully!');
        fetchFields();
        resetForm();
        setTempOptionLinks({});
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (field: ExecutiveKycField) => {
    setEditingId(field._id);
    setSectionTitle(field.section || 'General');
    setFieldLabel(field.label);
    setPlaceholder(field.placeholder || '');
    setInputType(field.type);
    setOptions(field.options || []);
    setIsActive(field.status === 'Active');
    setIsRequired(field.isRequired || false);
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
        updateExecutiveKycField(id, {
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
      await updateExecutiveKycField(childId, {
        dependsOn: value ? { fieldId: editingId!, value } : { fieldId: null, value: '' }
      });
      fetchFields(); // Refresh to show latest connections
    } catch (error) {
      console.error('Failed to update child dependency', error);
      alert('Failed to update field connection');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this KYC field?')) {
      try {
        await deleteExecutiveKycField(id);
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
    const sectionMatch = !sectionFilter || field.section === sectionFilter;
    return labelMatch && sectionMatch;
  });

  const totalPages = Math.ceil(filteredFields.length / rowsPerPage);
  const paginatedFields = filteredFields.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const sections = Array.from(new Set(fields.map(f => f.section || 'General')));

  return (
    <div className="p-4 sm:p-8 bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Executive KYC Form Configurator</h1>
            <p className="text-neutral-500 mt-1">Define dynamic fields for executive KYC process</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
                onClick={() => { resetForm(); setIsModalOpen(true); }}
                className="bg-neutral-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-neutral-800 transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Add New Field
            </button>
            <nav className="hidden sm:flex text-sm font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-neutral-200">
                <span className="text-teal-600">Admin</span>
                <span className="mx-2 text-neutral-300">/</span>
                <span className="text-neutral-600">Executive KYC Config</span>
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
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest whitespace-nowrap">Filter by section:</label>
                    <select
                        value={sectionFilter}
                        onChange={(e) => { setSectionFilter(e.target.value); setCurrentPage(1); }}
                        className="w-full md:w-64 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                        <option value="">All Sections</option>
                        {sections.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-neutral-50/50 border-b border-neutral-100">
                        <th className="px-8 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Section</th>
                        <th className="px-8 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Field Label</th>
                        <th className="px-8 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Type</th>
                        <th className="px-8 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Required</th>
                        <th className="px-8 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Status</th>
                        <th className="px-8 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-sm">
                    {loading ? (
                        <tr><td colSpan={6} className="text-center py-20 text-neutral-400 animate-pulse font-bold uppercase tracking-widest">Loading Configurations...</td></tr>
                    ) : paginatedFields.length > 0 ? (
                        paginatedFields.map((field) => (
                            <tr key={field._id} className="hover:bg-neutral-50/50 transition-colors group">
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
                                            {field.isRequired ? (
                                                <span className="text-rose-500 font-black text-xs uppercase tracking-tighter">Required</span>
                                            ) : (
                                                <span className="text-neutral-300 font-bold text-[10px] uppercase">Optional</span>
                                            )}
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
                             {editingId ? 'Edit KYC Field' : 'New KYC Field Definition'}
                        </h2>
                        <button onClick={resetForm} className="text-neutral-400 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Section Title (Group Name)</label>
                             <input
                                 type="text"
                                 value={sectionTitle}
                                 onChange={(e) => setSectionTitle(e.target.value)}
                                 placeholder="e.g. Personal Details, Documents, Bank Info..."
                                 className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-bold placeholder:text-neutral-300"
                             />
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Field Label / Display Text</label>
                             <input
                                 type="text"
                                 value={fieldLabel}
                                 onChange={(e) => setFieldLabel(e.target.value)}
                                 placeholder="e.g. Father's Name, Vehicle Number..."
                                 className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-bold placeholder:text-neutral-300"
                             />
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Custom Placeholder (Optional)</label>
                             <input
                                 type="text"
                                 value={placeholder}
                                 onChange={(e) => setPlaceholder(e.target.value)}
                                 placeholder="What executive sees inside input..."
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
                                            
                                            {/* Dependent fields */}
                                            {opt.trim() && (
                                                <div className="bg-white p-3 rounded-xl border border-teal-100 space-y-2 shadow-sm relative">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[9px] font-black text-teal-600 uppercase tracking-widest flex items-center gap-1.5">
                                                            Visible Fields for "{opt}":
                                                        </label>
                                                    </div>
                                                    
                                                    <div className="relative">
                                                        <div 
                                                            onClick={() => {
                                                                setOpenDropdown(openDropdown === `${idx}` ? null : `${idx}`);
                                                                setFieldSearch('');
                                                            }}
                                                            className="w-full flex items-center justify-between px-3 py-2.5 bg-neutral-50 border border-teal-200 rounded-xl text-[10px] font-black cursor-pointer transition-all hover:bg-white hover:border-teal-500 hover:shadow-md group"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-5 h-5 bg-teal-100 text-teal-600 rounded-md flex items-center justify-center font-black">
                                                                    {editingId 
                                                                        ? fields.filter(f => f.dependsOn?.fieldId === editingId && f.dependsOn?.value === opt).length
                                                                        : (tempOptionLinks[opt] || []).length
                                                                    }
                                                                </div>
                                                                <span className="text-neutral-600 group-hover:text-teal-700 uppercase tracking-tight">Set Visibility</span>
                                                            </div>
                                                            <svg className={`w-4 h-4 text-teal-400 transition-transform duration-300 ${openDropdown === `${idx}` ? "rotate-180 text-teal-600" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                        </div>

                                                        {openDropdown === `${idx}` && (
                                                            <>
                                                                <div className="fixed inset-0 z-[100]" onClick={() => setOpenDropdown(null)}></div>
                                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-teal-200 rounded-2xl shadow-2xl z-[101] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 border-t-4 border-t-teal-500">
                                                                    <div className="p-3 bg-neutral-50 border-b border-neutral-100">
                                                                        <div className="relative">
                                                                            <input 
                                                                                type="text"
                                                                                placeholder="Search available fields..."
                                                                                value={fieldSearch}
                                                                                onChange={(e) => setFieldSearch(e.target.value)}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-[10px] font-bold focus:border-teal-500 outline-none transition-all"
                                                                            />
                                                                            <svg className="absolute left-2.5 top-2 w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                                        </div>
                                                                    </div>

                                                                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                                                                        {fields
                                                                            .filter(f => f._id !== editingId && f.label.toLowerCase().includes(fieldSearch.toLowerCase()))
                                                                            .map(f => {
                                                                                const isLinked = editingId 
                                                                                    ? (f.dependsOn?.fieldId === editingId && f.dependsOn?.value === opt)
                                                                                    : (tempOptionLinks[opt] || []).includes(f._id);
                                                                                
                                                                                const handleToggle = () => {
                                                                                    if (editingId) {
                                                                                        handleChildDependencyUpdate(f._id, isLinked ? null : opt);
                                                                                    } else {
                                                                                        setTempOptionLinks(prev => {
                                                                                            const current = prev[opt] || [];
                                                                                            const updated = isLinked ? current.filter(id => id !== f._id) : [...current, f._id];
                                                                                            return { ...prev, [opt]: updated };
                                                                                        });
                                                                                    }
                                                                                };

                                                                                return (
                                                                                    <label key={f._id} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${isLinked ? "bg-teal-50 shadow-inner" : "hover:bg-neutral-50"}`} onClick={(e) => e.stopPropagation()}>
                                                                                        <input type="checkbox" checked={isLinked} onChange={handleToggle} className="w-4 h-4 rounded-md text-teal-600 border-neutral-300 focus:ring-teal-500 cursor-pointer"/>
                                                                                        <div className="flex flex-col">
                                                                                            <span className={`text-[10px] font-black uppercase tracking-tight ${isLinked ? "text-teal-700 font-black" : "text-neutral-600"}`}>{f.label}</span>
                                                                                            <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-widest">{f.type} • {f.section || 'General'}</span>
                                                                                        </div>
                                                                                    </label>
                                                                                );
                                                                            })
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                             <div>
                                 <span className="block text-sm font-black text-neutral-800 uppercase tracking-tight">Required Field</span>
                                 <span className="text-[10px] font-bold text-neutral-400 uppercase">{isRequired ? 'Must be filled' : 'Optional'}</span>
                             </div>
                             <button
                                 onClick={() => setIsRequired(!isRequired)}
                                 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none ${isRequired ? 'bg-rose-600' : 'bg-neutral-300'}`}
                             >
                                 <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isRequired ? 'translate-x-6' : 'translate-x-1'}`} />
                             </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                             <div>
                                 <span className="block text-sm font-black text-neutral-800 uppercase tracking-tight">Active Status</span>
                                 <span className="text-[10px] font-bold text-neutral-400 uppercase">{isActive ? 'Shown to executives' : 'Currently Hidden'}</span>
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
                                {editingId ? 'Update Field' : 'Save Field'}
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
