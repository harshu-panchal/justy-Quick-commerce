import React from 'react';
import { motion } from 'framer-motion';

const RefundPolicy: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-12"
    >
      <h1 className="text-3xl font-extrabold text-neutral-900 mb-8">Refund Policy</h1>
      
      <div className="space-y-6 text-neutral-600 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-neutral-800 mb-3">1. Return and Refund Overview</h2>
          <p>We want you to be completely satisfied with your purchase from JYASTI. If you are not satisfied, you may be eligible for a return or refund under the following conditions.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-800 mb-3">2. Eligible Items for Return</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Items that are damaged, defective, or incorrect.</li>
            <li>Items that have expired by the time of delivery.</li>
            <li>Items with a shorter than reasonable remaining shelf life.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-800 mb-3">3. Non-Returnable Items</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Perishable goods (e.g., fresh produce, dairy) cannot be returned unless damaged or incorrect at the time of delivery.</li>
            <li>Hygiene products that have been opened.</li>
            <li>Items without original packaging and receipts.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-800 mb-3">4. Refund Process</h2>
          <p>Refunds will be processed back to the original method of payment within 5-7 business days of approval. Approval is subject to verification by the seller and platform representatives.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-800 mb-3">5. Requesting a Refund</h2>
          <p>To request a refund, please use the 'Return' feature within the Orders section of your account or contact our customer support team immediately upon delivery.</p>
        </section>

        <section className="pt-8 border-t border-neutral-200">
          <p className="text-sm">Last Updated: March 2026</p>
        </section>
      </div>
    </motion.div>
  );
};

export default RefundPolicy;
