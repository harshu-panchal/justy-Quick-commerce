import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-12"
    >
      <h1 className="text-3xl font-extrabold text-neutral-900 mb-8">Privacy Policy</h1>
      
      <div className="space-y-6 text-neutral-600 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-neutral-800 mb-3">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create or modify your account, request delivery services, contact customer support, or otherwise communicate with us. This information may include: Name, Email, Phone Number, and Delivery Address.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-800 mb-3">2. How We Use Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, including to facilitate connections between users and sellers, process payments, send receipts, and provide customer support.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-800 mb-3">3. Location Information</h2>
          <p>To enable the connection between users and nearby sellers and to ensure efficient delivery services, we collect location data from your device. This data is used solely for service provision and is not shared with third parties for marketing purposes.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-800 mb-3">4. Security</h2>
          <p>We take reasonable measures to protect your information from loss, theft, misuse, and unauthorized access. However, no method of transmission over the internet or method of electronic storage is 100% secure.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-800 mb-3">5. Data Deletion</h2>
          <p>You have the right to request the deletion of your account and personal information at any time. Please contact us to initiate this process.</p>
        </section>

        <section className="pt-8 border-t border-neutral-200">
          <p className="text-sm">Last Updated: March 2026</p>
        </section>
      </div>
    </motion.div>
  );
};

export default PrivacyPolicy;
