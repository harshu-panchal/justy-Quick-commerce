import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { register, updateKYC } from '../services/executiveService';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import OTPInput from '../../../components/OTPInput';
import { sendOTP } from '../services/executiveService';
import { getExecutiveKycFieldsForExecutive } from '../../../services/api/admin/executiveKycFieldService';
import api from '../../../services/api/config';

export default function ExecutiveRegister() {
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        alternateMobile: '',
        workExperience: '',
    });

    const [dynamicFields, setDynamicFields] = useState<any[]>([]);
    const [dynamicData, setDynamicData] = useState<Record<string, any>>({});
    const [uploadingField, setUploadingField] = useState<string | null>(null);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.mobile) {
            setFormData(prev => ({ ...prev, mobile: location.state.mobile }));
        }
    }, [location]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNext = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.mobile || !formData.email) {
            toast.error('Please fill all required fields');
            return;
        }
        if (formData.mobile.length !== 10) {
            toast.error('Please enter a valid 10-digit mobile number');
            return;
        }
        
        setLoading(true);
        try {
            await sendOTP(formData.mobile);
            setOtpSent(true);
            toast.success('OTP sent successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const [registeredUser, setRegisteredUser] = useState<any>(null);

    const handleVerifyAndRegister = async (otp: string) => {
        setLoading(true);
        try {
            const res = await register({ ...formData, otp });
            if (res.success && res.data?.token) {
                // Set token in localStorage manually for the next API call (updateKYC)
                localStorage.setItem('authToken', res.data.token);
                setRegisteredUser(res.data.user);
                toast.success('Mobile verified successfully');
                setStep(2);
                setOtpSent(false);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleKYCSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation for Step 2 dynamic fields
        for (const field of dynamicFields) {
            if (field.isRequired && !dynamicData[field._id]) {
                toast.error(`${field.label} is required`);
                return;
            }
        }

        setLoading(true);
        try {
            const kycRes = await updateKYC({ dynamicKycData: dynamicData });
            
            if (kycRes.success) {
                toast.success('Registration and KYC submitted successfully');
                
                // Finalize login
                const token = localStorage.getItem('authToken');
                if (token && registeredUser) {
                    await login(token, { ...registeredUser, userType: 'Executive' });
                    navigate('/executive/dashboard');
                } else {
                    // Fallback if state was lost
                    navigate('/executive/login');
                }
            }
        } catch (error: any) {
            console.error("KYC Submission Error:", error);
            toast.error(error.response?.data?.message || 'KYC submission failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (step === 2) {
            const fetchFields = async () => {
                try {
                    const res = await getExecutiveKycFieldsForExecutive();
                    if (res.success) {
                        setDynamicFields(res.data.filter((f: any) => f.status === 'Active'));
                    }
                } catch (error) {
                    console.error("Error fetching fields:", error);
                }
            };
            fetchFields();
        }
    }, [step]);

    return (
        <>
            <div className="min-h-screen bg-white flex flex-col p-6 font-sans">
                <div className="max-w-sm mx-auto w-full space-y-8 py-10">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black tracking-tight text-neutral-900">
                            {step === 1 ? 'Join as Executive' : 'KYC Verification'}
                        </h1>
                        <p className="text-sm text-neutral-500 font-medium">
                            {step === 1 ? 'Complete the form below to register your account' : 'Please provide your KYC details for verification'}
                        </p>
                    </div>

                    <form onSubmit={step === 1 ? handleNext : handleKYCSubmit} className="space-y-5">
                        {step === 1 ? (
                            <div className="space-y-5">
                                {!otpSent ? (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Full Name *</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="Enter your full name"
                                                className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-lg focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Mobile Number *</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-sm">+91</span>
                                                    <input
                                                        type="tel"
                                                        name="mobile"
                                                        value={formData.mobile}
                                                        onChange={(e) => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                                                        placeholder="Enter mobile number"
                                                        readOnly={!!location.state?.mobile}
                                                        className={`w-full pl-12 pr-4 py-3 ${location.state?.mobile ? 'bg-neutral-100 opacity-70' : 'bg-neutral-50'} border-2 border-neutral-100 rounded-lg focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm`}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Email Address *</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    placeholder="yourname@email.com"
                                                    className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-lg focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Alternate Mobile</label>
                                                <input
                                                    type="tel"
                                                    name="alternateMobile"
                                                    value={formData.alternateMobile}
                                                    onChange={(e) => setFormData({...formData, alternateMobile: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                                                    placeholder="Secondary mobile (optional)"
                                                    className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-lg focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Experience (Years)</label>
                                                <input
                                                    type="text"
                                                    name="workExperience"
                                                    value={formData.workExperience}
                                                    onChange={handleChange}
                                                    placeholder="e.g. 3 Years"
                                                    className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-lg focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-lg transition-all active:scale-[0.98] shadow-lg shadow-emerald-100"
                                        >
                                            {loading ? 'Sending OTP...' : 'Verify Mobile & Next'}
                                        </button>
                                    </>
                                ) : (
                                    <div className="space-y-6 py-4">
                                        <div className="text-center">
                                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Enter OTP sent to +91 {formData.mobile}</p>
                                            <OTPInput length={4} onComplete={handleVerifyAndRegister} disabled={loading} />
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setOtpSent(false)}
                                            className="w-full text-center text-xs font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest"
                                        >
                                            Change Mobile/Details
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Grouped Dynamic Sections */}
                                {dynamicFields.length > 0 ? (
                                    <div className="space-y-8">
                                        {Object.entries(
                                            dynamicFields.reduce((acc: any, field: any) => {
                                                const section = field.section || 'General Information';
                                                if (!acc[section]) acc[section] = [];
                                                acc[section].push(field);
                                                return acc;
                                            }, {})
                                        ).map(([sectionName, fields]: [string, any], index) => (
                                            <div key={sectionName} className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-xs font-black">{index + 1}</div>
                                                    <h3 className="text-xs font-black text-neutral-900 uppercase tracking-widest">{sectionName}</h3>
                                                </div>

                                                <div className="bg-white p-5 rounded-lg border border-neutral-100 shadow-sm space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {fields.map((field: any) => {
                                                            // Dependency check
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
                                                                                const fd = new FormData();
                                                                                fd.append('document', file);
                                                                                setUploadingField(fId);
                                                                                try {
                                                                                    const response = await api.post('/upload/document', fd, {
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
                                                                        />
                                                                    )}

                                                                    {field.type === 'toggle' && (
                                                                        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border-2 border-neutral-100 mt-1">
                                                                            <span className="text-xs font-bold text-neutral-600">{field.label}</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setDynamicData({...dynamicData, [field._id]: !dynamicData[field._id]})}
                                                                                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all ${dynamicData[field._id] ? 'bg-emerald-600' : 'bg-neutral-300'}`}
                                                                            >
                                                                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${dynamicData[field._id] ? 'translate-x-6' : 'translate-x-1'}`} />
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
                                    </div>
                                ) : (
                                    <div className="py-10 text-center text-neutral-400 font-bold text-sm">
                                        {loading ? 'Loading KYC form...' : 'No KYC details required. Proceed to register.'}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <button
                                        type="submit"
                                        disabled={loading || !!uploadingField}
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-lg transition-all active:scale-[0.98] shadow-lg shadow-emerald-100"
                                    >
                                        {loading ? 'Processing...' : 'Submit KYC & Finish'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                    {step === 1 && (
                        <div className="text-center pt-4">
                            <Link to="/executive/login" className="text-sm font-bold text-neutral-400 hover:text-emerald-600 transition-colors">
                                Already have an account? <span className="text-emerald-600 font-black">Login</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
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

