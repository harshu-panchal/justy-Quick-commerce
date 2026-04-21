import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How do I place an order?',
    answer: 'To place an order, simply browse our products, add items to your cart, and proceed to checkout. You\'ll need to provide your delivery address and payment details. Once confirmed, your order will be processed and delivered to you.',
  },
  {
    id: '2',
    question: 'What are the delivery charges?',
    answer: 'Delivery charges vary based on your location and order value. We offer free delivery on orders above ₹199. For orders below this threshold, a nominal delivery fee applies. You can check the exact charges during checkout.',
  },
  {
    id: '3',
    question: 'How long does delivery take?',
    answer: 'We typically deliver within 17-20 minutes for most locations. Delivery time may vary based on your location, order size, and current demand. You\'ll receive real-time updates about your order status.',
  },
  {
    id: '4',
    question: 'Can I cancel my order?',
    answer: 'Yes, you can cancel your order before it\'s confirmed by the seller. Once confirmed, cancellation may not be possible. Please check our cancellation policy for more details. Refunds are processed within 5-7 business days.',
  },
  {
    id: '5',
    question: 'What payment methods do you accept?',
    answer: 'We accept various payment methods including credit/debit cards, UPI, net banking, and digital wallets. Cash on delivery (COD) is also available for select locations.',
  },
  {
    id: '6',
    question: 'How do I track my order?',
    answer: 'You can track your order in real-time through the Orders section in your account. We also send SMS and email notifications with order updates. For detailed tracking, visit the order details page.',
  },
  {
    id: '7',
    question: 'What is your return policy?',
    answer: 'Most products are returnable within 2 days of delivery. Some items like perishables may not be returnable. Please check the product details for specific return policies. Returns are subject to our terms and conditions.',
  },
  {
    id: '8',
    question: 'How do I apply a coupon code?',
    answer: 'During checkout, you\'ll see an option to "See all coupons". Click on it, browse available coupons, and click "Apply" on the coupon you want to use. The discount will be automatically applied to your order.',
  },
  {
    id: '9',
    question: 'Can I modify my delivery address?',
    answer: 'Yes, you can modify your delivery address before placing the order. You can also save multiple addresses in your Address Book for quick selection during checkout.',
  },
  {
    id: '10',
    question: 'What if I receive a damaged or wrong item?',
    answer: 'If you receive a damaged or incorrect item, please contact our customer support immediately. We offer 48-hour replacement guarantee. You can report the issue through the order details page or contact us at help@justi.com.',
  },
  {
    id: '11',
    question: 'How do I add items to my wishlist?',
    answer: 'Simply click the heart icon on any product to add it to your wishlist. You can access your wishlist from the Account page. Items in your wishlist can be easily added to cart when you\'re ready to purchase.',
  },
  {
    id: '12',
    question: 'Is my personal information secure?',
    answer: 'Yes, we take your privacy seriously. All personal information is encrypted and stored securely. We never share your data with third parties without your consent. Please review our Privacy Policy for more details.',
  },
];

export default function FAQ() {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="pb-12 bg-neutral-50 min-h-screen">
      {/* ── Premium Floating Header ── */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-b-[40px] shadow-lg relative pb-12 overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between px-4 py-4 pt-6 relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white active:scale-95 transition-transform"
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
            Support Center
          </div>
        </div>

        <div className="px-8 pb-4 text-white relative z-10 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-3xl bg-white/15 backdrop-blur-xl border border-white/20 flex items-center justify-center mx-auto mb-4 shadow-xl"
          >
             <span className="text-3xl">❓</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black mb-2 drop-shadow-sm"
          >
            How can we help?
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xs text-emerald-100 font-medium opacity-90 max-w-[280px] mx-auto"
          >
            Search our FAQ for quick answers to common questions about Justy.
          </motion.p>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="px-4 md:px-6 lg:px-8 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-2">
            {faqData.map((item) => {
              const isOpen = openItems.has(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-neutral-100 overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors text-left"
                  >
                    <span className="text-sm font-semibold text-neutral-800 pr-4 leading-snug">
                      {item.question}
                    </span>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={`flex-shrink-0 text-neutral-400 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3 pt-0">
                          <p className="text-xs text-neutral-500 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Contact Support Section */}
          <div className="mt-6 bg-gradient-to-br from-green-50 to-white rounded-2xl p-5 border border-green-100/50 shadow-sm">
            <div className="text-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                className="mx-auto mb-3 text-green-600"
              >
                <path
                  d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h3 className="text-base font-bold text-neutral-900 mb-1">
                Still have questions?
              </h3>
              <p className="text-[10px] text-neutral-500 mb-4 font-medium">
                Our support team is here to help you 24/7
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <a
                  href="mailto:help@justi.com"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors text-xs shadow-md shadow-green-200"
                >
                  Email Us
                </a>
                <a
                  href="tel:+91-XXXXX-XXXXX"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-white text-green-600 border border-green-200 rounded-xl font-bold hover:bg-green-50 transition-colors text-xs"
                >
                  Call Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

