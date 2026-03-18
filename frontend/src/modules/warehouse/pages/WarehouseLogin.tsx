import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function WarehouseLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      navigate('/warehouse/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-100 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-100 rounded-full blur-[120px] opacity-60" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white/80 backdrop-blur-xl rounded-[40px] p-8 md:p-12 shadow-[0_32px_64px_-12px_rgba(234,88,12,0.15)] border border-white max-w-md w-full"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-600/30 rotate-12 group transition-transform hover:rotate-0">
            <span className="text-4xl -rotate-12 group-hover:rotate-0 transition-transform">🏢</span>
          </div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Warehouse Portal</h1>
          <p className="text-neutral-500 mt-2 font-medium">Log in to manage orders & inventory</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Staff ID / Email</label>
            <div className="relative">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-100/50 border-2 border-transparent focus:border-orange-500 focus:bg-white outline-none py-4 px-6 rounded-2xl font-bold transition-all placeholder:text-neutral-300"
                placeholder="staff_001@warehouse.com"
                required
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20">👤</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Secret Access Key</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-100/50 border-2 border-transparent focus:border-orange-500 focus:bg-white outline-none py-4 px-6 rounded-2xl font-bold transition-all placeholder:text-neutral-300"
                placeholder="••••••••"
                required
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20">🔑</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-5 h-5 rounded-lg border-2 border-neutral-200 checked:bg-orange-600 transition-all cursor-pointer" />
              <span className="text-xs font-bold text-neutral-500 group-hover:text-neutral-700">Remember Me</span>
            </label>
            <button type="button" className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors">Forgot Key?</button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-5 rounded-2xl font-black text-lg shadow-[0_20px_40px_-10px_rgba(234,88,12,0.3)] hover:shadow-orange-600/40 active:scale-95 transition-all flex items-center justify-center gap-3 ${
              isLoading ? 'bg-orange-500 text-white' : 'bg-orange-600 text-white'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Authorize Access</span>
            )}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest leading-relaxed">
            Quick Commerce • Warehouse Management System<br />
            Secure Node: Hyderabad_WH_01
          </p>
        </div>
      </motion.div>
    </div>
  );
}
