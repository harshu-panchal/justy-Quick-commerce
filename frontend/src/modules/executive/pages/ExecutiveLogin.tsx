import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import OTPInput from '../../../components/OTPInput';
import { sendOTP, verifyOTP } from '../services/executiveService';
import { useAuth } from '../../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ExecutiveLogin() {
    const [mobile, setMobile] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();
    const [suspendedMessage, setSuspendedMessage] = useState<string | null>(null);

    useEffect(() => {
        if (searchParams.get('suspended') === 'true') {
            setSuspendedMessage("Your account has been suspended due to policy violations or admin action. Please contact support for assistance.");
        }
    }, [searchParams]);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mobile || mobile.length !== 10) {
            toast.error('Please enter a valid 10-digit mobile number');
            return;
        }

        setLoading(true);
        try {
            await sendOTP(mobile);
            setOtpSent(true);
            toast.success('OTP sent successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (otp: string) => {
        setLoading(true);
        try {
            const response = await verifyOTP(mobile, otp);
            if (response.data?.isNewUser) {
                toast.success('OTP verified. Please complete your registration.');
                navigate('/executive/signup', { state: { mobile: response.data.mobile } });
                return;
            }
            await login(response.data.token, response.data.user);
            toast.success('Login successful');
            navigate('/executive/dashboard');
        } catch (error: any) {
            if (error.response?.status === 403 && error.response?.data?.message?.toLowerCase().includes('suspended')) {
                setSuspendedMessage(error.response.data.message || "Your account has been suspended. Please contact admin.");
            } else {
                toast.error(error.response?.data?.message || 'Invalid OTP');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col p-6 font-sans">
            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">
                <div className="space-y-2">
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-200"
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </motion.div>
                    <h1 className="text-3xl font-black tracking-tight text-neutral-900">Executive Portal</h1>
                    <p className="text-neutral-500 font-medium">
                        {otpSent ? `Enter the 4-digit code sent to +91 ${mobile}` : 'Login to manage your onboarded sellers and commissions'}
                    </p>
                </div>

                {!otpSent ? (
                    <form onSubmit={handleSendOTP} className="space-y-4">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-sm">+91</span>
                            <input
                                type="tel"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="Mobile Number"
                                className="w-full pl-12 pr-4 py-4 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-lg"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-100"
                        >
                            {loading ? 'Sending...' : 'Get Started'}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <OTPInput length={4} onComplete={handleVerifyOTP} disabled={loading} />
                        <button 
                            onClick={() => setOtpSent(false)}
                            className="w-full text-center text-sm font-bold text-emerald-600 hover:text-emerald-700"
                        >
                            Change Mobile Number
                        </button>
                    </div>
                )}

                <div className="pt-8 text-center">
                    <p className="text-sm text-neutral-500 font-medium">
                        Don't have an account?{' '}
                        <Link to="/executive/signup" className="text-emerald-600 font-black hover:underline underline-offset-4">
                            Apply Now
                        </Link>
                    </p>
                </div>
            </div>

            <footer className="py-8 text-center">
                <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">Powered by Dhakad Snazzy</p>
            </footer>

            {/* Suspension Modal */}
            <AnimatePresence>
                {suspendedMessage && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-neutral-900/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 text-center">
                                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-black text-neutral-900 mb-2">Account Suspended</h3>
                                <p className="text-neutral-500 font-medium leading-relaxed mb-8">
                                    {suspendedMessage}
                                </p>
                                <button 
                                    onClick={() => setSuspendedMessage(null)}
                                    className="w-full py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl font-black transition-all active:scale-95"
                                >
                                    Okay
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
