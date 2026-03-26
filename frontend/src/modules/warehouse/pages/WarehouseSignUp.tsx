import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function WarehouseSignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    location: '',
    securityPin: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate Registration
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => navigate('/warehouse/login'), 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-neutral-50 transition-colors"
        aria-label="Back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18L9 12L15 6" />
        </svg>
      </button>

      {/* SignUp Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-[0_32px_64px_-12px_rgba(15,118,110,0.15)] border border-white overflow-hidden"
      >
        <div className="px-6 py-8 text-center bg-gradient-to-br from-teal-700 to-teal-900 border-b border-white/10">
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Create Warehouse Account</h1>
          <p className="text-teal-100 text-sm font-medium mt-1">Join our high-efficiency logistics network</p>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-10 space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner">
                  ✓
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-neutral-900">Registration Received!</h2>
                  <p className="text-neutral-500 font-medium">Redirecting to login portal...</p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl py-4 px-6 text-sm font-bold focus:border-teal-500 focus:bg-white outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={(e) => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '')})}
                      className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl py-4 px-6 text-sm font-bold focus:border-teal-500 focus:bg-white outline-none transition-all"
                      placeholder="9876543210"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Work Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl py-4 px-6 text-sm font-bold focus:border-teal-500 focus:bg-white outline-none transition-all"
                      placeholder="john@warehouse.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Warehouse Hub</label>
                    <select
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl py-4 px-6 text-sm font-bold focus:border-teal-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select Hub</option>
                      <option value="hyderabad">Hyderabad Hub</option>
                      <option value="bangalore">Bangalore Hub</option>
                      <option value="delhi">Delhi Hub</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Security PIN (4 Digits)</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={formData.securityPin}
                    onChange={(e) => setFormData({...formData, securityPin: e.target.value.replace(/\D/g, '')})}
                    className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-3xl py-5 px-6 text-center text-3xl font-black tracking-[1em] focus:border-teal-500 focus:bg-white outline-none transition-all"
                    placeholder="0000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-5 bg-gradient-to-r from-teal-700 to-teal-900 text-white rounded-2xl font-black text-lg shadow-[0_20px_40px_-10px_rgba(15,118,110,0.3)] hover:shadow-teal-700/40 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isLoading ? 'Creating Account...' : 'Initialize Onboarding'}
                </button>
              </form>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Already a partner? <Link to="/warehouse/login" className="text-teal-600 hover:text-teal-700">Go to Log In</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
