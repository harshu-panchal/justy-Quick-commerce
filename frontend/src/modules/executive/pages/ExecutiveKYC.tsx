import { useState, useEffect } from 'react';
import ExecutiveLayout from '../components/ExecutiveLayout';
import { getDashboardStats, updateKYC } from '../services/executiveService';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../services/api/config';
import { getExecutiveKycFieldsForExecutive } from '../../../services/api/admin/executiveKycFieldService';

export default function ExecutiveKYC() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingField, setUploadingField] = useState<string | null>(null);
    
    const [kycData, setKycData] = useState({
        aadharNumber: '',
        panNumber: '',
        aadharFront: '',
        aadharBack: '',
        panCard: '',
        resume: '',
        bankPassbook: ''
    });

    const [bankDetails, setBankDetails] = useState({
        bankName: '',
        ifscCode: '',
        accountNumber: '',
        accountHolderName: ''
    });

    const [dynamicFields, setDynamicFields] = useState<any[]>([]);
    const [dynamicData, setDynamicData] = useState<Record<string, any>>({});

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getDashboardStats();
                const stats = data.data;
                
                if (stats.kycStatus === 'Approved') {
                    toast.success('KYC already verified');
                    navigate('/executive/profile');
                    return;
                }

                if (stats.kycDetails) {
                    setKycData({
                        aadharNumber: stats.kycDetails.aadharNumber || '',
                        panNumber: stats.kycDetails.panNumber || '',
                        aadharFront: stats.kycDetails.aadharFront || '',
                        aadharBack: stats.kycDetails.aadharBack || '',
                        panCard: stats.kycDetails.panCard || '',
                        resume: stats.kycDetails.resume || '',
                        bankPassbook: stats.kycDetails.bankPassbook || ''
                    });
                }

                if (stats.bankDetails) {
                    setBankDetails({
                        bankName: stats.bankDetails.bankName || '',
                        ifscCode: stats.bankDetails.ifscCode || '',
                        accountNumber: stats.bankDetails.accountNumber || '',
                        accountHolderName: stats.bankDetails.accountHolderName || ''
                    });
                }
            } catch (error) {
                console.error("Error fetching KYC data:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchDynamicFields = async () => {
            try {
                const res = await getExecutiveKycFieldsForExecutive();
                if (res.success) {
                    setDynamicFields(res.data.filter((f: any) => f.status === 'Active'));
                }
            } catch (error) {
                console.error("Error fetching dynamic fields:", error);
            }
        };

        fetchStats();
        fetchDynamicFields();
    }, [navigate]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // File Type Validation
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        const allowedPdfType = ['application/pdf'];

        if (field === 'resume') {
            if (!allowedPdfType.includes(file.type)) {
                toast.error('Only PDF files are allowed for resume');
                return;
            }
        } else {
            if (!allowedImageTypes.includes(file.type)) {
                toast.error('Only JPG or PNG images are allowed');
                return;
            }
        }

        const formData = new FormData();
        formData.append('document', file);

        setUploadingField(field);
        try {
            const response = await api.post('/upload/document', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setKycData(prev => ({ ...prev, [field]: response.data.data.url }));
            toast.success('Document uploaded');
        } catch (error) {
            toast.error('Upload failed');
        } finally {
            setUploadingField(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Dynamic fields validation
        for (const field of dynamicFields) {
            if (field.isRequired && !dynamicData[field._id]) {
                toast.error(`${field.label} is required`);
                return;
            }
        }

        if (Object.keys(dynamicData).length === 0 && dynamicFields.length > 0) {
            toast.error('Please fill in the required fields');
            return;
        }


        setSubmitting(true);
        try {
            await updateKYC({
                dynamicKycData: dynamicData
            });
            toast.success('KYC details submitted for verification');
            navigate('/executive/profile');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <ExecutiveLayout title="KYC Verification" showBack>
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                </div>
            </ExecutiveLayout>
        );
    }

    return (
        <ExecutiveLayout title="KYC Verification" showBack>
            <form onSubmit={handleSubmit} className="space-y-8 pb-10">
                {/* Grouped Dynamic Sections */}
                {Object.entries(
                    dynamicFields.reduce((acc: any, field: any) => {
                        const section = field.section || 'General Information';
                        if (!acc[section]) acc[section] = [];
                        acc[section].push(field);
                        return acc;
                    }, {})
                ).map(([sectionName, fields]: [string, any], index) => (
                    <div key={sectionName} className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-black">{index + 1}</div>
                            <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest">{sectionName}</h3>
                        </div>

                        <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {fields.map((field: any) => {
                                    // Check dependency
                                    if (field.dependsOn?.fieldId) {
                                        const parentValue = dynamicData[field.dependsOn.fieldId];
                                        if (parentValue !== field.dependsOn.value) return null;
                                    }

                                    return (
                                        <div key={field._id} className={`space-y-1 ${field.type === 'file' ? 'md:col-span-1' : ''}`}>
                                            <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">
                                                {field.label} {field.isRequired && <span className="text-rose-500">*</span>}
                                            </label>
                                            
                                            {field.type === 'text' && (
                                                <input
                                                    type="text"
                                                    value={dynamicData[field._id] || ''}
                                                    onChange={(e) => setDynamicData({...dynamicData, [field._id]: e.target.value})}
                                                    placeholder={field.placeholder}
                                                    className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-lg focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                                    required={field.isRequired}
                                                />
                                            )}

                                            {field.type === 'number' && (
                                                <input
                                                    type="number"
                                                    value={dynamicData[field._id] || ''}
                                                    onChange={(e) => setDynamicData({...dynamicData, [field._id]: e.target.value})}
                                                    placeholder={field.placeholder}
                                                    className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-lg focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                                    required={field.isRequired}
                                                />
                                            )}

                                            {field.type === 'select' && (
                                                <select
                                                    value={dynamicData[field._id] || ''}
                                                    onChange={(e) => setDynamicData({...dynamicData, [field._id]: e.target.value})}
                                                    className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-lg focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm appearance-none"
                                                    required={field.isRequired}
                                                >
                                                    <option value="">Select {field.label}</option>
                                                    {field.options?.map((opt: string) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            )}

                                            {field.type === 'date' && (
                                                <input
                                                    type="date"
                                                    value={dynamicData[field._id] || ''}
                                                    onChange={(e) => setDynamicData({...dynamicData, [field._id]: e.target.value})}
                                                    className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-lg focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                                    required={field.isRequired}
                                                />
                                            )}

                                            {field.type === 'file' && (
                                                <UploadCard 
                                                    label={field.label}
                                                    value={dynamicData[field._id]}
                                                    field={field._id}
                                                    isUploading={uploadingField === field._id}
                                                    onUpload={async (e: any, fId: string) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        const formData = new FormData();
                                                        formData.append('document', file);
                                                        setUploadingField(fId);
                                                        try {
                                                            const response = await api.post('/upload/document', formData, {
                                                                headers: { 'Content-Type': 'multipart/form-data' }
                                                            });
                                                            setDynamicData(prev => ({ ...prev, [fId]: response.data.data.url }));
                                                            toast.success('File uploaded');
                                                        } catch (error) {
                                                            toast.error('Upload failed');
                                                        } finally {
                                                            setUploadingField(null);
                                                        }
                                                    }}
                                                    accept="*"
                                                    helpText="Document/Image"
                                                />
                                            )}

                                            {field.type === 'toggle' && (
                                                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border-2 border-neutral-100">
                                                    <span className="text-sm font-bold text-neutral-600">{field.label}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDynamicData({...dynamicData, [field._id]: !dynamicData[field._id]})}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${dynamicData[field._id] ? 'bg-emerald-600' : 'bg-neutral-300'}`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dynamicData[field._id] ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}


                <button
                    type="submit"
                    disabled={submitting || !!uploadingField}
                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-lg transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-emerald-100"
                >
                    {submitting ? 'Submitting...' : 'Submit Verification'}
                </button>
            </form>
        </ExecutiveLayout>
    );
}

function UploadCard({ label, value, field, isUploading, onUpload, accept, helpText }: any) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-neutral-400 uppercase">{label}</label>
                {helpText && <span className="text-[8px] font-bold text-emerald-500 uppercase">{helpText}</span>}
            </div>
            <label className="block relative cursor-pointer group">
                <div className={`w-full h-24 bg-neutral-50 border-2 border-dashed rounded-lg flex flex-col items-center justify-center overflow-hidden transition-all ${
                    value ? 'border-emerald-100' : 'border-neutral-200 group-hover:border-emerald-500'
                }`}>
                    {isUploading ? (
                        <div className="w-6 h-6 border-2 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                    ) : value ? (
                        <div className="relative w-full h-full">
                            {value.toLowerCase().endsWith('.pdf') ? (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-600 p-2">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                    <span className="text-[8px] font-black mt-1">PDF DOCUMENT</span>
                                </div>
                            ) : (
                                <img src={value} className="w-full h-full object-cover" alt={label} />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Change</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-1">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                            </svg>
                            <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">Upload</span>
                        </div>
                    )}
                </div>
                <input type="file" className="hidden" onChange={(e) => onUpload(e, field)} accept={accept} />
            </label>
        </div>
    );
}
