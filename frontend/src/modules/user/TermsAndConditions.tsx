import React from 'react';
import { motion } from 'framer-motion';

const TermsAndConditions: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-12"
    >
      <h1 className="text-3xl font-extrabold text-neutral-900 mb-8">Terms and Conditions</h1>
      
      <div className="space-y-6 text-neutral-600 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-neutral-800 mb-3">1. Agreement to Terms</h2>
          <p>By accessing or using JYASTI, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree to all of these terms, do not use our services.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-800 mb-3">2. Service Description</h2>
          <p>JYASTI provides a quick-commerce platform connecting users with local sellers for rapid delivery of groceries and other items. We act as an intermediary and are not responsible for the products themselves, though we strive for quality.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-800 mb-3">3. User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-800 mb-3">4. Pricing and Payments</h2>
          <p>All prices are listed in local currency and include applicable taxes unless stated otherwise. Delivery fees may apply based on distance and order size.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-800 mb-3">5. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, JYASTI shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.</p>
        </section>

        <section className="pt-8 border-t border-neutral-200">
          <p className="text-sm">Last Updated: March 2026</p>
        </section>
      </div>
    </motion.div>
  );
};

export default TermsAndConditions;
