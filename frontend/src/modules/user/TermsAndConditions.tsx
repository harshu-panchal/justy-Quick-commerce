import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const TermsAndConditions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-20 bg-neutral-50/50 min-h-screen font-sans ml-0">
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-neutral-100">
        <div className="px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4 max-w-4xl mx-auto">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <div>
              <h1 className="text-xl font-black text-neutral-900 tracking-tight">Terms & Conditions</h1>
              <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-0.5">Agreement for Usage</p>
            </div>
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-neutral-100 overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="space-y-12">
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 text-xl">🤝</span>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">1. Agreement to Terms</h2>
                </div>
                <p className="text-neutral-600 leading-relaxed text-sm md:text-base">By accessing or using JYASTI, you agree to be bound by these Terms and Conditions. Our platform is designed to provide seamless commerce while maintaining mutual trust and responsibility.</p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-xl">🚀</span>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">2. Service Description</h2>
                </div>
                <p className="text-neutral-600 leading-relaxed text-sm md:text-base">JYASTI is a rapid delivery platform connecting you with local vendors. We facilitate the marketplace but the ultimate product quality remains the responsibility of the registered sellers.</p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50 text-xl">👤</span>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">3. User Accounts</h2>
                </div>
                <p className="text-neutral-600 leading-relaxed text-sm md:text-base">You are responsible for your account security. Any activity under your credentials is considered your responsibility. Please keep your OTPs and passwords private.</p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-50 text-xl">💰</span>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">4. Pricing and Payments</h2>
                </div>
                <p className="text-neutral-600 leading-relaxed text-sm md:text-base">Prices include taxes unless stated. Delivery fees vary by distance. We support multiple secure payment gateways for a smooth checkout experience.</p>
              </section>
            </div>

            <div className="mt-16 pt-8 border-t border-neutral-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="px-4 py-1.5 bg-neutral-100 rounded-full text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Last Updated: March 2026</div>
              <p className="text-xs text-neutral-400">© 2026 Jyasti. All rights reserved.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-neutral-900 rounded-[2rem] p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-3xl" />
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-2">Need clarification?</h3>
            <p className="text-neutral-400 text-sm mb-6">If you have any doubts regarding our service terms, feel free to reach out.</p>
            <button onClick={() => navigate('/contact-us')} className="px-8 py-3 bg-white text-neutral-900 text-sm font-bold rounded-xl hover:bg-neutral-100 transition-colors">Contact Support</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TermsAndConditions;
