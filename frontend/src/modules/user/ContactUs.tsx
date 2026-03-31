import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { submitComplaint } from '../../services/api/customerComplaintService';

const categories = [
  { value: "Delivery", label: "Delivery Issue" },
  { value: "Product", label: "Product Related" },
  { value: "Payment", label: "Payment/Wallet" },
  { value: "Refund", label: "Refund Status" },
  { value: "App/Technical", label: "App/Website Technical" },
  { value: "Other", label: "General Inquiry" }
];

const ContactUs: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'Other',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await submitComplaint({
        category: formData.category,
        subject: formData.subject || `Inquiry from ${formData.name}`,
        message: formData.message,
      });

      if (response.success) {
        showToast("Your message has been sent successfully! Our team will get back to you soon.", "success");
        setFormData({
          name: '',
          email: '',
          category: 'Other',
          subject: '',
          message: ''
        });
      } else {
        showToast(response.message || "Failed to send message", "error");
      }
    } catch (error: any) {
      showToast(error.message || "Something went wrong. Please try again later.", "error");
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-lg font-bold text-neutral-900">Contact Us/Help</h1>
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 md:px-6 py-5"
      >
      
      <div className="grid md:grid-cols-5 gap-8 mt-6">
        {/* Info Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-teal-50/50 p-6 rounded-2xl border border-teal-100">
            <h2 className="text-xl font-bold text-teal-900 mb-2">Need Support?</h2>
            <p className="text-sm text-teal-700 leading-relaxed mb-6">Our dedicated support team is available from 9 AM to 9 PM daily to assist you with order tracking, refunds, and more.</p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-3 bg-white rounded-xl border border-teal-50 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Call Us</p>
                  <p className="text-sm font-bold text-neutral-800">+91 1234 567 890</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 bg-white rounded-xl border border-teal-50 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Email Us</p>
                  <p className="text-sm font-bold text-neutral-800">support@jyasti.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 bg-white rounded-xl border border-teal-50 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Office</p>
                  <p className="text-sm font-bold text-neutral-800">Mandsaur, Madhya Pradesh, India</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="md:col-span-3">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-neutral-100 relative overflow-hidden">
            {/* Decorative dot background */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] pointer-events-none">
              <svg width="100" height="100" viewBox="0 0 100 100"><circle cx="10" cy="10" r="2" fill="currentColor"/><circle cx="30" cy="10" r="2" fill="currentColor"/><circle cx="50" cy="10" r="2" fill="currentColor"/><circle cx="70" cy="10" r="2" fill="currentColor"/><circle cx="90" cy="10" r="2" fill="currentColor"/><circle cx="10" cy="30" r="2" fill="currentColor"/><circle cx="30" cy="30" r="2" fill="currentColor"/><circle cx="50" cy="30" r="2" fill="currentColor"/><circle cx="70" cy="30" r="2" fill="currentColor"/><circle cx="90" cy="30" r="2" fill="currentColor"/><circle cx="10" cy="50" r="2" fill="currentColor"/><circle cx="30" cy="50" r="2" fill="currentColor"/><circle cx="50" cy="50" r="2" fill="currentColor"/><circle cx="70" cy="50" r="2" fill="currentColor"/><circle cx="90" cy="50" r="2" fill="currentColor"/></svg>
            </div>

            <h2 className="text-2xl font-black text-neutral-900 mb-6">Send us a message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">Your Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    required 
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all" 
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    required 
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all" 
                  />
                </div>
              </div>

              <div>
                <label htmlFor="category" className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">How can we help?</label>
                <select 
                  id="category" 
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm appearance-none focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="subject" className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">Subject</label>
                <input 
                  type="text" 
                  id="subject" 
                  required 
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Order difficulty, Refund status, etc."
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all" 
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">Describe your issue</label>
                <textarea 
                  id="message" 
                  rows={4} 
                  required 
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us more about your problem so we can help you better..."
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all resize-none"
                ></textarea>
              </div>

              <motion.button 
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                type="submit" 
                className="w-full py-4 bg-teal-600 text-white text-sm font-black rounded-2xl hover:bg-teal-700 transition-all shadow-xl shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Send Message
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </div>
      </div>
      </motion.div>
    </div>
  );
};

export default ContactUs;
