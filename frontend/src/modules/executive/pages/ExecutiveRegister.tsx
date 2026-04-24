import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { register } from '../services/executiveService';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';

export default function ExecutiveRegister() {
    const { login } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        alternateMobile: '',
        workExperience: '',
    });
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

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 1) {
            if (!formData.name || !formData.mobile || !formData.email) {
                toast.error('Please fill all required fields');
                return;
            }
            setStep(2);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await register(formData);
            
            if (response.success && response.data?.token) {
                // Auto-login after successful registration
                await login(response.data.token, response.data.user);
                toast.success('Welcome! Your application has been submitted and is active.');
                navigate('/executive/dashboard');
            } else {
                toast.success('Application submitted successfully! Admin will review your profile.');
                navigate('/executive/login');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col p-6 font-sans">
            <div className="max-w-sm mx-auto w-full space-y-8 py-10">
                <div className="space-y-2">
                    <h1 className="text-3xl font-black tracking-tight text-neutral-900">Join as Executive</h1>
                    <div className="flex items-center gap-2">
                        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-neutral-100'}`} />
                        <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-neutral-100'}`} />
                    </div>
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest pt-2">
                        Step {step} of 2: {step === 1 ? 'Personal Details' : 'Professional Info'}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.form 
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleNext} 
                            className="space-y-4"
                        >
                            <div className="space-y-1">
                                <label className="text-xs font-black text-neutral-400 uppercase ml-1">Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    className="w-full px-4 py-4 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-neutral-400 uppercase ml-1">Mobile Number *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-sm">+91</span>
                                    <input
                                        type="tel"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={(e) => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                                        placeholder="10-digit mobile"
                                        readOnly={!!location.state?.mobile}
                                        className={`w-full pl-12 pr-4 py-4 ${location.state?.mobile ? 'bg-neutral-100 opacity-70' : 'bg-neutral-50'} border-2 border-neutral-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold`}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-neutral-400 uppercase ml-1">Email Address *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="example@mail.com"
                                    className="w-full px-4 py-4 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg transition-all active:scale-[0.98] shadow-lg shadow-emerald-100 mt-4"
                            >
                                Continue
                            </button>
                        </motion.form>
                    ) : (
                        <motion.form 
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleSubmit} 
                            className="space-y-4"
                        >
                            <div className="space-y-1">
                                <label className="text-xs font-black text-neutral-400 uppercase ml-1">Alternate Mobile (Optional)</label>
                                <input
                                    type="tel"
                                    name="alternateMobile"
                                    value={formData.alternateMobile}
                                    onChange={(e) => setFormData({...formData, alternateMobile: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                                    placeholder="Optional mobile"
                                    className="w-full px-4 py-4 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-neutral-400 uppercase ml-1">Work Experience (Years)</label>
                                <input
                                    type="text"
                                    name="workExperience"
                                    value={formData.workExperience}
                                    onChange={handleChange}
                                    placeholder="e.g. 2 Years in Sales"
                                    className="w-full px-4 py-4 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold"
                                />
                            </div>
                            
                            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-[10px] text-blue-700 font-bold leading-relaxed">
                                NOTE: AFTER REGISTRATION, YOU NEED TO UPLOAD YOUR KYC DOCUMENTS (AADHAR & PAN) FROM THE DASHBOARD TO BE ELIGIBLE FOR PAYOUTS.
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-2xl font-black transition-all active:scale-[0.98]"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-100"
                                >
                                    {loading ? 'Submitting...' : 'Submit Application'}
                                </button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>

                <div className="text-center pt-4">
                    <Link to="/executive/login" className="text-sm font-bold text-neutral-400 hover:text-emerald-600 transition-colors">
                        Already have an account? <span className="text-emerald-600 font-black">Login</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
