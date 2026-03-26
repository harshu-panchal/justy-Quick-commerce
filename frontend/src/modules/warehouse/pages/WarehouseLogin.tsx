import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import OTPInput from '../../../components/OTPInput';
import { useAuth } from '../../../context/AuthContext';
import { sendOTP, verifyOTP } from '../../../services/api/auth/adminAuthService';

export default function WarehouseLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMobileLogin = async () => {
    if (mobileNumber.length !== 10) return;
    setIsLoading(true);
    setError("");
    
    try {
      // Use real Admin OTP service
      const response = await sendOTP(mobileNumber);
      if (response.success) {
        setShowOTP(true);
      } else {
        setError(response.message || "Failed to send OTP.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error connecting to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPComplete = async (otpValue: string) => {
    setIsLoading(true);
    setError("");
    
    try {
      // Use real Admin OTP verify service
      const response = await verifyOTP(mobileNumber, otpValue);
      if (response.success && response.data) {
        const { token, user } = response.data;
        login(token, {
          id: user.id || (user as any)._id,
          name: `${user.firstName} ${user.lastName}`,
          mobile: user.mobile,
          userType: "Admin"
        });
        navigate("/warehouse/dashboard");
      } else {
        setError(response.message || "Invalid OTP.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Verification failed. Please check your code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 flex flex-col items-center justify-center px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-neutral-50 transition-colors"
        aria-label="Back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18L9 12L15 6" />
        </svg>
      </button>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-[0_32px_64px_-12px_rgba(15,118,110,0.15)] border border-white overflow-hidden"
      >
        {/* Header Section */}
        <div className="px-6 py-8 text-center bg-gradient-to-br from-teal-700 to-teal-900">
          <div className="flex justify-center mb-4">
            <img
              src="/assets/jyastiLogo.png"
              alt="JYASTI builds trust"
              className="h-28 w-auto object-contain bg-white/90 rounded-2xl p-2 shadow-sm"
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-1 uppercase">
            Warehouse Login
          </h1>
          <p className="text-teal-100 text-sm font-medium">
            Authorized Personnel Access Only
          </p>
        </div>

        {/* Login Form */}
        <div className="p-8 space-y-6">
          <AnimatePresence mode="wait">
            {!showOTP ? (
              <motion.div 
                key="mobile"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">
                    Registered Mobile Number
                  </label>
                  <div className="flex items-center bg-neutral-50 border-2 border-neutral-100 rounded-2xl overflow-hidden focus-within:border-teal-500 focus-within:bg-white transition-all">
                    <div className="px-5 py-4 text-sm font-bold text-neutral-400 border-r border-neutral-100">
                      +91
                    </div>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="Enter mobile number"
                      className="flex-1 px-5 py-4 text-sm font-bold bg-transparent outline-none placeholder:text-neutral-300"
                      maxLength={10}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {error && <div className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl">{error}</div>}

                <button
                  onClick={handleMobileLogin}
                  disabled={mobileNumber.length !== 10 || isLoading}
                  className={`w-full py-5 rounded-2xl font-black text-lg shadow-[0_20px_40px_-10px_rgba(15,118,110,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3 ${
                    mobileNumber.length === 10 && !isLoading
                    ? 'bg-gradient-to-r from-teal-700 to-teal-900 text-white shadow-teal-700/30'
                    : 'bg-neutral-100 text-neutral-300 cursor-not-allowed shadow-none'
                  }`}
                >
                  {isLoading ? "Sending..." : "Request Access OTP"}
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="otp"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6 text-center"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-neutral-500">
                    Verification code sent to
                  </p>
                  <p className="text-sm font-black text-neutral-900">+91 {mobileNumber}</p>
                </div>

                <OTPInput onComplete={handleOTPComplete} disabled={isLoading} />

                {error && <div className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl">{error}</div>}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowOTP(false); setError(""); }}
                    disabled={isLoading}
                    className="flex-1 py-4 rounded-xl font-bold text-xs bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
                  >
                    Change Number
                  </button>
                  <button
                    onClick={handleMobileLogin}
                    disabled={isLoading}
                    className="flex-1 py-4 rounded-xl font-bold text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                  >
                    {isLoading ? "Verifying..." : "Resend"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>

      {/* Footer Text */}
      <p className="mt-8 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] text-center leading-relaxed">
        Quick Commerce • Warehouse Management System<br />
        Secure Protocol WH-HYD-01
      </p>
    </div>
  );
}
