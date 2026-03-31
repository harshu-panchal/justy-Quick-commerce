import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ContactUs: React.FC = () => {
  const navigate = useNavigate();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send an email or store in DB
    alert("Thank you for reaching out! We'll get back to you soon.");
  };

  return (
    <div className="pb-12 bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-teal-50 to-white pb-4 pt-3 sticky top-0 z-10 border-b border-neutral-100">
        <div className="px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-neutral-900 p-1 hover:bg-neutral-100 rounded-full transition-colors"
              aria-label="Back"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-neutral-900">Contact Us</h1>
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto px-4 md:px-6 py-5"
      >
      
      <div className="grid md:grid-cols-2 gap-6 mt-6 bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
        <div className="space-y-4">
          <h2 className="text-base font-bold text-neutral-800">Get in Touch</h2>
          <p className="text-sm text-neutral-600">Have questions about an order or our services? Our team is here to help you.</p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-neutral-600">
              <span className="text-lg text-green-600">📍</span>
              <p>Mandsaur, Madhya Pradesh, India</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-600">
              <span className="text-lg text-blue-600">📧</span>
              <p>support@jyasti.com</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-600">
              <span className="text-lg text-green-500">📞</span>
              <p>+91 1234 567 890</p>
            </div>
          </div>
        </div>

        <div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-neutral-700 mb-1">Name</label>
              <input type="text" id="name" required className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-neutral-700 mb-1">Email</label>
              <input type="email" id="email" required className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
            <div>
              <label htmlFor="message" className="block text-xs font-medium text-neutral-700 mb-1">Message</label>
              <textarea id="message" rows={3} required className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"></textarea>
            </div>
            <button type="submit" className="w-full py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors shadow-md">
              Send Message
            </button>
          </form>
        </div>
      </div>
      </motion.div>
    </div>
  );
};

export default ContactUs;
