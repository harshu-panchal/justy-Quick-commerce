import React from 'react';
import { motion } from 'framer-motion';

const ContactUs: React.FC = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send an email or store in DB
    alert("Thank you for reaching out! We'll get back to you soon.");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-12"
    >
      <h1 className="text-3xl font-extrabold text-neutral-900 mb-8 text-center">Contact Us</h1>
      
      <div className="grid md:grid-cols-2 gap-12 mt-12 bg-white p-8 rounded-2xl shadow-sm border border-neutral-100">
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-neutral-800">Get in Touch</h2>
          <p className="text-neutral-600">Have questions about an order or our services? Our team is here to help you.</p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-neutral-600">
              <span className="text-xl text-green-600">📍</span>
              <p>Mandsaur, Madhya Pradesh, India</p>
            </div>
            <div className="flex items-center gap-3 text-neutral-600">
              <span className="text-xl text-blue-600">📧</span>
              <p>support@jyasti.com</p>
            </div>
            <div className="flex items-center gap-3 text-neutral-600">
              <span className="text-xl text-green-500">📞</span>
              <p>+91 1234 567 890</p>
            </div>
          </div>
        </div>

        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
              <input type="text" id="name" required className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
              <input type="email" id="email" required className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-1">Message</label>
              <textarea id="message" rows={4} required className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"></textarea>
            </div>
            <button type="submit" className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-md">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default ContactUs;
