import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-20 bg-neutral-50/50 min-h-screen font-sans ml-0">
      {/* Premium Header */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-neutral-100">
        <div className="px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4 max-w-4xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-600"
              aria-label="Back"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-black text-neutral-900 tracking-tight">Privacy Policy</h1>
              <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-0.5">Your Privacy Matters</p>
            </div>
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 md:px-6 py-8"
      >
        {/* Main Doc Card */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-neutral-100 overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="space-y-12">
              <section className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 text-xl">🛡️</span>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">1. Information We Collect</h2>
                </div>
                <p className="text-neutral-600 leading-relaxed text-sm md:text-base">
                  We collect information you provide directly to us, such as when you create or modify your account, request delivery services, contact customer support, or otherwise communicate with us. This information may include: 
                  <span className="block mt-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100 text-neutral-500 font-medium italic">
                    Name, Email Address, Phone Number, and Delivery Address.
                  </span>
                </p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-xl">⚙️</span>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">2. How We Use Information</h2>
                </div>
                <p className="text-neutral-600 leading-relaxed text-sm md:text-base">
                  We use the information we collect to provide, maintain, and improve our services, including to facilitate connections between users and sellers, process payments, send receipts, and provide professional customer support.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 text-xl">📍</span>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">3. Location Information</h2>
                </div>
                <p className="text-neutral-600 leading-relaxed text-sm md:text-base">
                  To enable the connection between users and nearby sellers and to ensure efficient delivery services, we collect location data from your device. This data is used solely for service provision and is never shared with third parties for marketing purposes.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-xl">🔒</span>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">4. Security</h2>
                </div>
                <p className="text-neutral-600 leading-relaxed text-sm md:text-base">
                  We take industry-standard measures to protect your information from loss, theft, misuse, and unauthorized access. While we strive for 100% security, please remember that no method of electronic transmission is entirely risk-free.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 text-xl">🗑️</span>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">5. Data Deletion</h2>
                </div>
                <p className="text-neutral-600 leading-relaxed text-sm md:text-base">
                  You have the absolute right to request the deletion of your account and personal information at any time. Simply reach out to our support team to initiate the process immediately.
                </p>
              </section>
            </div>

            <div className="mt-16 pt-8 border-t border-neutral-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="px-4 py-1.5 bg-neutral-100 rounded-full text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                Last Updated: March 2026
              </div>
              <p className="text-xs text-neutral-400">© 2026 Jyasti. All rights reserved.</p>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 bg-neutral-900 rounded-[2rem] p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-3xl" />
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-2">Still have questions?</h3>
            <p className="text-neutral-400 text-sm mb-6">Our legal and support team is here to help you understand our policies better.</p>
            <button 
              onClick={() => navigate('/contact-us')}
              className="px-8 py-3 bg-white text-neutral-900 text-sm font-bold rounded-xl hover:bg-neutral-100 transition-colors"
            >
              Contact Support
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
