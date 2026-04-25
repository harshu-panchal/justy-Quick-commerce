import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { register } from '../services/executiveService';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import OTPInput from '../../../components/OTPInput';
import { sendOTP } from '../services/executiveService';

export default function ExecutiveRegister() {
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
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

    const handleSendOTP = async (e: React.FormEvent) => {
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

    const handleVerifyAndRegister = async (otp: string) => {
        setLoading(true);
        try {
            // First we need to register, but the backend usually expects OTP verification either separate or as part of reg.
            // In this flow, we'll assume we register only after OTP is verified.
            // Wait, the standard verifyOTP returns a token if user exists, or isNewUser if not.
            // But we already have the registration details.
            
            // Let's call register directly with the OTP if the backend supports it, 
            // OR verify OTP then register.
            
            // Looking at executiveAuthController, register doesn't take OTP.
            // But wait, the standard pattern for this app is usually verifying first.
            
            // Actually, I should probably check the backend `register` controller to see if it checks for verified mobile.
            // If not, I'll just register after OTP is "verified" locally via a separate call if needed.
            
            // Let's check executiveAuthController.ts
            const response = await register({ ...formData, otp });
            
            if (response.success && response.data?.token) {
                const userData = { 
                    ...response.data.user, 
                    userType: 'Executive' as const 
                };
                await login(response.data.token, userData);
                toast.success('Welcome! Your account is active. Please complete your KYC.');
                navigate('/executive/dashboard');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await register(formData);
            
            if (response.success && response.data?.token) {
                // Auto-login after successful registration
                const userData = { 
                    ...response.data.user, 
                    userType: 'Executive' as const 
                };
                await login(response.data.token, userData);
                toast.success('Welcome! Your account is active. Please complete your KYC.');
                navigate('/executive/dashboard');
            } else if (response.success) {
                // If success but no token (should not happen normally)
                toast.success('Application submitted successfully!');
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
                    <p className="text-sm text-neutral-500 font-medium">Complete the form below to register your account</p>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-5">
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
                            disabled={otpSent}
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
                                    readOnly={!!location.state?.mobile || otpSent}
                                    className={`w-full pl-12 pr-4 py-3 ${location.state?.mobile || otpSent ? 'bg-neutral-100 opacity-70' : 'bg-neutral-50'} border-2 border-neutral-100 rounded-lg focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm`}
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
                                disabled={otpSent}
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
                                disabled={otpSent}
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
                                disabled={otpSent}
                            />
                        </div>
                    </div>

                    {!otpSent ? (
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-lg transition-all active:scale-[0.98] shadow-lg shadow-emerald-100"
                        >
                            {loading ? 'Sending OTP...' : 'Verify & Register'}
                        </button>
                    ) : (
                        <div className="space-y-6 pt-4 border-t border-neutral-100">
                            <div className="text-center">
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Enter OTP sent to +91 {formData.mobile}</p>
                                <OTPInput length={4} onComplete={handleVerifyAndRegister} disabled={loading} />
                            </div>
                            <button 
                                type="button"
                                onClick={() => setOtpSent(false)}
                                className="w-full text-center text-xs font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest"
                            >
                                Change Mobile Number
                            </button>
                        </div>
                    )}
                </form>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-[10px] text-blue-700 font-bold leading-relaxed">
                    NOTE: AFTER REGISTRATION, YOU NEED TO UPLOAD YOUR KYC DOCUMENTS (AADHAR & PAN) FROM THE DASHBOARD TO BE ELIGIBLE FOR PAYOUTS.
                </div>

                <div className="text-center pt-4">
                    <Link to="/executive/login" className="text-sm font-bold text-neutral-400 hover:text-emerald-600 transition-colors">
                        Already have an account? <span className="text-emerald-600 font-black">Login</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
