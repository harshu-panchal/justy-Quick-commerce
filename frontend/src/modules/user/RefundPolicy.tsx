import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const RefundPolicy: React.FC = () => {
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
              <h1 className="text-xl font-black text-neutral-900 tracking-tight">Refund Policy</h1>
              <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-0.5">Hassle-Free Returns</p>
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
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 text-xl">📄</span>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">1. Return and Refund Overview</h2>
                </div>
                <p className="text-neutral-600 leading-relaxed text-sm md:text-base">We want you to be completely satisfied with your purchase from JYASTI. If you are not satisfied, you may be eligible for a return or refund under the specific conditions outlined below.</p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-50 text-xl">✅</span>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">2. Eligible Items for Return</h2>
                </div>
                <ul className="list-disc pl-5 space-y-3 text-neutral-600 text-sm md:text-base">
                  <li>Items that are damaged, defective, or incorrect upon delivery.</li>
                  <li>Items that have reached their expiration date by the time of delivery.</li>
                  <li>Items with an unreasonably short remaining shelf life.</li>
                </ul>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 text-xl">🚫</span>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">3. Non-Returnable Items</h2>
                </div>
                <ul className="list-disc pl-5 space-y-3 text-neutral-600 text-sm md:text-base">
                  <li>Perishable goods (fresh produce, dairy) unless damaged at the time of delivery.</li>
                  <li>Opened hygiene or personal care products.</li>
                  <li>Items missing their original packaging or proof of purchase.</li>
                </ul>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-xl">💳</span>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">4. Refund Process</h2>
                </div>
                <p className="text-neutral-600 leading-relaxed text-sm md:text-base">Approved refunds are processed to the original payment method within 5-7 business days. All requests are subject to verification by Jyasti and the respective seller.</p>
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
            <h3 className="text-lg font-bold mb-2">Need a refund?</h3>
            <p className="text-neutral-400 text-sm mb-6">Our support team is ready to assist you with your return request.</p>
            <button onClick={() => navigate('/contact-us')} className="px-8 py-3 bg-white text-neutral-900 text-sm font-bold rounded-xl hover:bg-neutral-100 transition-colors">Contact Support</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RefundPolicy;
