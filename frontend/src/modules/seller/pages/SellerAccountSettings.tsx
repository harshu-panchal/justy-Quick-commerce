import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSellerProfile, updateSellerProfile } from '../../../services/api/auth/sellerAuthService';
import { useAuth } from '../../../context/AuthContext';
import { getCategories, Category } from '../../../services/api/categoryService';
import GoogleMapsAutocomplete from '../../../components/GoogleMapsAutocomplete';
import LocationPickerMap from '../../../components/LocationPickerMap';
import toast from 'react-hot-toast';

const SellerAccountSettings = () => {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('basic');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [saveLoading, setSaveLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [sellerData, setSellerData] = useState({
        sellerName: '',
        email: '',
        mobile: '',
        storeName: '',
        category: '',
        address: '',
        city: '',
        pincode: '',
        searchLocation: '',
        latitude: '',
        longitude: '',
        serviceRadiusKm: '10',
        panCard: '',
        taxNumber: '', // Used for GST
        accountName: '',
        bankName: '',
        accountNumber: '',
        ifsc: '',
        upiId: '',
        profile: '',
        logo: '',
        storeBanner: '',
        storeDescription: '',
        commission: 0,
        status: '',
        isDeliveryByPlatform: true,
    });

    useEffect(() => {
        fetchProfile();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await getCategories();
            if (res.success) setCategories(res.data);
        } catch (err) {
            console.error('Category Error:', err);
        }
    };

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await getSellerProfile();
            if (response.success) {
                const data = response.data;
                const locationCoords = data.location?.coordinates || [];
                setSellerData({
                    ...data,
                    latitude: data.latitude || (locationCoords[1]?.toString() || ''),
                    longitude: data.longitude || (locationCoords[0]?.toString() || ''),
                    searchLocation: data.searchLocation || data.address || '',
                    serviceRadiusKm: (data.serviceRadiusKm || 10).toString(),
                    isDeliveryByPlatform: data.isDeliveryByPlatform !== undefined ? data.isDeliveryByPlatform : true,
                });
            }
        } catch (err) {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'pincode' && value.replace(/\D/g, '').length > 6) return;
        setSellerData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveLoading(true);
        try {
            const radius = parseFloat(sellerData.serviceRadiusKm);
            if (isNaN(radius) || radius < 0.1 || radius > 100) {
                toast.error('Radius must be 0.1 - 100km');
                return;
            }

            const response = await updateSellerProfile({
                ...sellerData,
                serviceRadiusKm: radius
            });

            if (response.success) {
                toast.success('Profile updated successfully');
                setIsEditing(false);
                if (updateUser) updateUser({ ...user, ...response.data });
                fetchProfile(); // Refresh
            }
        } catch (err: any) {
            toast.error(err.message || 'Update failed');
        } finally {
            setSaveLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const tabs = [
        { id: 'basic', label: 'IDENTITY', icon: '👤' },
        { id: 'store', label: 'STOREFRONT', icon: '🏬' },
        { id: 'finance', label: 'FINANCE', icon: '💳' },
    ];

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
            {/* Minimal Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <img 
                            src={sellerData.profile || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + sellerData.sellerName} 
                            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-neutral-50 shadow-inner"
                            alt="Profile"
                        />
                        {isEditing && (
                            <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                                <span className="text-[10px] font-black text-white">CHANGE</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-neutral-900 tracking-tight uppercase">{sellerData.sellerName || 'Account Settings'}</h1>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">{sellerData.email}</p>
                        <div className="flex gap-2 mt-2">
                             <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${sellerData.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                {sellerData.status || 'Pending'}
                            </span>
                            <span className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest">
                                {sellerData.commission}% COMM.
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    {!isEditing ? (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] rounded-xl transition-all uppercase tracking-widest shadow-xl shadow-slate-900/10 active:scale-95"
                        >
                            Modify Account
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-500 font-black text-[10px] rounded-xl transition-all uppercase tracking-widest active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSubmit}
                                disabled={saveLoading}
                                className="px-10 py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-black text-[10px] rounded-xl transition-all uppercase tracking-widest shadow-xl shadow-teal-500/20 active:scale-95 disabled:opacity-50"
                            >
                                {saveLoading ? 'Saving...' : 'Confirm Changes'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Switcher */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Navigation */}
                <div className="lg:col-span-1 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-left ${activeTab === tab.id 
                                ? 'bg-white shadow-xl shadow-neutral-200/50 border border-neutral-100 scale-[1.02]' 
                                : 'hover:bg-neutral-50 text-neutral-400 opacity-60 hover:opacity-100'}`}
                        >
                            <span className="text-xl">{tab.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Form Panels */}
                <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden min-h-[500px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-10"
                        >
                            {activeTab === 'basic' && (
                                <div className="space-y-10">
                                    <SectionHeader title="Basic Intelligence" subtitle="Core merchant identity and contact nodes" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <InputGroup label="Merchant Name" name="sellerName" value={sellerData.sellerName} onChange={handleInputChange} disabled={!isEditing} />
                                        <InputGroup label="Primary Email" name="email" value={sellerData.email} disabled={true} type="email" />
                                        <InputGroup label="Secure Mobile" name="mobile" value={sellerData.mobile} onChange={handleInputChange} disabled={!isEditing} />
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Account Security</label>
                                            <div className="h-12 bg-neutral-50 border border-neutral-100 rounded-xl px-4 flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-neutral-500">PASSWORD: ••••••••••</span>
                                                {isEditing && <button type="button" className="text-[9px] font-black text-teal-600 uppercase border-b border-teal-600/30">Reset Pin</button>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'store' && (
                                <div className="space-y-10">
                                    <SectionHeader title="Store Presence" subtitle="Public-facing storefront configuration" />
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="md:col-span-2 flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                            <img src={sellerData.logo || 'https://placehold.co/100'} className="w-16 h-16 rounded-xl object-cover bg-white" alt="Logo" />
                                            <div>
                                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{sellerData.storeName}</p>
                                                <p className="text-[9px] font-medium text-slate-400 mt-1">Store visual identification badge</p>
                                            </div>
                                            {isEditing && <button type="button" className="ml-auto px-4 py-2 bg-white text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-200">Replace</button>}
                                        </div>

                                        <InputGroup label="Official Store Name" name="storeName" value={sellerData.storeName} onChange={handleInputChange} disabled={!isEditing} />
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Trade Category</label>
                                            <select 
                                                name="category" 
                                                value={sellerData.category} 
                                                onChange={handleInputChange} 
                                                disabled={!isEditing}
                                                className="w-full h-12 bg-neutral-50 border border-neutral-100 rounded-xl px-4 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60"
                                            >
                                                {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="md:col-span-2 space-y-4">
                                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Operational Area Node</label>
                                            {isEditing ? (
                                                <div className="space-y-4">
                                                    <GoogleMapsAutocomplete 
                                                        value={sellerData.searchLocation} 
                                                        onChange={(addr, lat, lng) => setSellerData(prev => ({ ...prev, searchLocation: addr, address: addr, latitude: lat.toString(), longitude: lng.toString() }))} 
                                                    />
                                                    <div className="h-[300px] rounded-3xl overflow-hidden border border-neutral-100 ring-4 ring-neutral-50/50">
                                                        <LocationPickerMap 
                                                            initialLat={parseFloat(sellerData.latitude) || 0} 
                                                            initialLng={parseFloat(sellerData.longitude) || 0} 
                                                            onLocationSelect={(lat, lng) => setSellerData(prev => ({ ...prev, latitude: lat.toString(), longitude: lng.toString() }))}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
                                                    <p className="text-[10px] font-bold text-neutral-600 uppercase leading-relaxed">{sellerData.address || 'Location Not Defined'}</p>
                                                </div>
                                            )}
                                        </div>

                                        <InputGroup label="Merchant Region (City)" name="city" value={sellerData.city} onChange={handleInputChange} disabled={!isEditing} />
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Service Radius Threshold (KM)</label>
                                            <select 
                                                name="serviceRadiusKm" 
                                                value={sellerData.serviceRadiusKm} 
                                                onChange={handleInputChange} 
                                                disabled={!isEditing}
                                                className="w-full h-12 bg-neutral-50 border border-neutral-100 rounded-xl px-4 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-teal-500/20"
                                            >
                                                {[2, 5, 10, 15, 25, 50].map(r => <option key={r} value={r.toString()}>{r} Kilometers</option>)}
                                            </select>
                                        </div>

                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Store Billboard (Banner)</label>
                                            <div className="relative group aspect-[21/9] rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                                                <img src={sellerData.storeBanner || 'https://placehold.co/1200x400?text=Store+Banner'} className="w-full h-full object-cover" alt="Banner" />
                                                {isEditing && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Update Backdrop</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Store Narrative (Description)</label>
                                            <textarea 
                                                name="storeDescription" 
                                                value={sellerData.storeDescription || ''} 
                                                onChange={handleInputChange} 
                                                disabled={!isEditing}
                                                rows={4}
                                                className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-4 text-[10px] font-bold outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60 transition-all resize-none"
                                                placeholder="Describe your store legacy and specialty..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'finance' && (
                                <div className="space-y-10">
                                    <SectionHeader title="Financial Ledger" subtitle="Banking credentials and tax identification" />
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <InputGroup label="Account Holder Name" name="accountName" value={sellerData.accountName} onChange={handleInputChange} disabled={!isEditing} />
                                        <InputGroup label="Institution Name" name="bankName" value={sellerData.bankName} onChange={handleInputChange} disabled={!isEditing} />
                                        <InputGroup label="Ledger/Account Number" name="accountNumber" value={sellerData.accountNumber} onChange={handleInputChange} disabled={!isEditing} />
                                        <InputGroup label="IFSC Protocol" name="ifsc" value={sellerData.ifsc} onChange={handleInputChange} disabled={!isEditing} />
                                        
                                        <div className="md:col-span-2 pt-6 border-t border-neutral-50">
                                            <SectionHeader title="Fiscal ID" subtitle="Government issued identifiers" />
                                        </div>
                                        
                                        <InputGroup label="Tax Number (GST)" name="taxNumber" value={sellerData.taxNumber} onChange={handleInputChange} disabled={!isEditing} />
                                        <InputGroup label="PAN Identity" name="panCard" value={sellerData.panCard} onChange={handleInputChange} disabled={!isEditing} />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const SectionHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="space-y-1">
        <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tight">{title}</h3>
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{subtitle}</p>
    </div>
);

const InputGroup = ({ label, name, value, onChange, disabled, type = "text", placeholder }: any) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">{label}</label>
        <input
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full h-12 bg-neutral-50 border border-neutral-100 rounded-xl px-4 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60 transition-all placeholder:text-neutral-300"
        />
    </div>
);

export default SellerAccountSettings;
