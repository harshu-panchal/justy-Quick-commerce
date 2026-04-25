import { useState, useEffect } from 'react';
import ExecutiveLayout from '../components/ExecutiveLayout';
import { getDashboardStats, updateKYC } from '../services/executiveService';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../services/api/config';

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
        fetchStats();
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
        
        // Validation
        if (!kycData.aadharNumber || !kycData.panNumber || !kycData.aadharFront || !kycData.aadharBack || 
            !kycData.panCard || !kycData.resume || !kycData.bankPassbook) {
            toast.error('Please upload all mandatory documents');
            return;
        }

        if (!bankDetails.bankName || !bankDetails.ifscCode || !bankDetails.accountNumber || !bankDetails.accountHolderName) {
            toast.error('Please fill all bank details');
            return;
        }

        if (!/^[0-9]{12}$/.test(kycData.aadharNumber)) {
            toast.error('Aadhar number must be exactly 12 digits');
            return;
        }

        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(kycData.panNumber)) {
            toast.error('Invalid PAN card format');
            return;
        }

        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails.ifscCode)) {
            toast.error('Invalid IFSC code format (11 characters)');
            return;
        }

        setSubmitting(true);
        try {
            await updateKYC({
                ...kycData,
                ...bankDetails
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
                {/* ID Proofs Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-black">1</div>
                        <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest">Identity Proofs</h3>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Aadhar Number</label>
                            <input
                                type="text"
                                value={kycData.aadharNumber}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 12);
                                    setKycData({...kycData, aadharNumber: val});
                                }}
                                placeholder="12-digit Aadhar Number"
                                className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-lg focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                required
                                maxLength={12}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <UploadCard 
                                label="Aadhar Front" 
                                value={kycData.aadharFront} 
                                field="aadharFront" 
                                isUploading={uploadingField === 'aadharFront'} 
                                onUpload={handleFileUpload} 
                                accept=".jpg,.jpeg,.png"
                                helpText="JPG/PNG"
                            />
                            <UploadCard 
                                label="Aadhar Back" 
                                value={kycData.aadharBack} 
                                field="aadharBack" 
                                isUploading={uploadingField === 'aadharBack'} 
                                onUpload={handleFileUpload} 
                                accept=".jpg,.jpeg,.png"
                                helpText="JPG/PNG"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">PAN Number</label>
                            <input
                                type="text"
                                value={kycData.panNumber}
                                onChange={(e) => {
                                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                                    setKycData({...kycData, panNumber: val});
                                }}
                                placeholder="10-digit PAN Number"
                                className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-lg focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                required
                                maxLength={10}
                            />
                        </div>

                        <UploadCard 
                            label="PAN Card Photo" 
                            value={kycData.panCard} 
                            field="panCard" 
                            isUploading={uploadingField === 'panCard'} 
                            onUpload={handleFileUpload} 
                            accept=".jpg,.jpeg,.png"
                            helpText="JPG/PNG"
                        />
                    </div>
                </div>

                {/* Professional Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-black">2</div>
                        <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest">Documents</h3>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm space-y-4">
                        <UploadCard 
                            label="Resume / CV" 
                            value={kycData.resume} 
                            field="resume" 
                            isUploading={uploadingField === 'resume'} 
                            onUpload={handleFileUpload} 
                            accept=".pdf"
                            helpText="PDF ONLY"
                        />
                        <UploadCard 
                            label="Bank Passbook / Cancelled Cheque" 
                            value={kycData.bankPassbook} 
                            field="bankPassbook" 
                            isUploading={uploadingField === 'bankPassbook'} 
                            onUpload={handleFileUpload} 
                            accept=".jpg,.jpeg,.png"
                            helpText="JPG/PNG"
                        />
                    </div>
                </div>

                {/* Bank Details Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-black">3</div>
                        <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest">Settlement Bank Account</h3>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Account Holder Name</label>
                            <input
                                type="text"
                                value={bankDetails.accountHolderName}
                                onChange={(e) => setBankDetails({...bankDetails, accountHolderName: e.target.value})}
                                placeholder="As per bank records"
                                className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-lg focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Bank Name</label>
                            <input
                                type="text"
                                value={bankDetails.bankName}
                                onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                                className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-lg focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Account Number</label>
                                <input
                                    type="text"
                                    value={bankDetails.accountNumber}
                                    onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                                    className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-lg focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">IFSC Code</label>
                                <input
                                    type="text"
                                    value={bankDetails.ifscCode}
                                    onChange={(e) => setBankDetails({...bankDetails, ifscCode: e.target.value.toUpperCase().slice(0, 11)})}
                                    className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-lg focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                    required
                                    maxLength={11}
                                />
                            </div>
                        </div>
                    </div>
                </div>

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
