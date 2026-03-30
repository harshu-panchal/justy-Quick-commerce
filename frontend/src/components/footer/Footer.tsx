import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-50 border-t border-slate-200 pt-16 pb-24 md:pb-12 text-slate-600 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand Section */}
        <div className="col-span-1 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-6 group">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-green-700 transition-colors">
              <span className="text-white font-extrabold text-xl">J</span>
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">JYASTI</span>
          </Link>
          <p className="text-sm leading-relaxed mb-6 italic">
            Groceries delivered in 15 minutes. Experience the future of quick-commerce today.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all">FB</a>
            <a href="#" className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center hover:bg-sky-400 hover:text-white transition-all">TW</a>
            <a href="#" className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center hover:bg-pink-500 hover:text-white transition-all">IG</a>
          </div>
        </div>

        {/* Categories (Placeholder for future or static list) */}
        <div>
          <h3 className="text-slate-900 font-bold mb-6 text-sm uppercase tracking-wider">Quick Shopping</h3>
          <ul className="space-y-3 text-sm">
            <li><Link to="/category/grocery-staples" className="hover:text-green-600 transition-colors">Grocery & Staples</Link></li>
            <li><Link to="/category/vegetables-fruits" className="hover:text-green-600 transition-colors">Vegetables & Fruits</Link></li>
            <li><Link to="/category/personal-care" className="hover:text-green-600 transition-colors">Personal Care</Link></li>
            <li><Link to="/category/household-items" className="hover:text-green-600 transition-colors">Household Items</Link></li>
          </ul>
        </div>

        {/* Company Links */}
        <div>
          <h3 className="text-slate-900 font-bold mb-6 text-sm uppercase tracking-wider">Company</h3>
          <ul className="space-y-3 text-sm text-neutral-500">
            <li><Link to="/about-us" className="hover:text-green-600 transition-colors">About Us</Link></li>
            <li><Link to="/contact-us" className="hover:text-green-600 transition-colors">Contact Us</Link></li>
            <li><Link to="/faq" className="hover:text-green-600 transition-colors">FAQ</Link></li>
            <li><Link to="/seller/signup" className="hover:text-green-600 transition-colors">Partner with Us</Link></li>
          </ul>
        </div>

        {/* Legal Links */}
        <div>
          <h3 className="text-slate-900 font-bold mb-6 text-sm uppercase tracking-wider">Legal & Policy</h3>
          <ul className="space-y-3 text-sm text-neutral-500 font-medium">
            <li><Link to="/terms-and-conditions" className="hover:text-green-600 transition-colors font-semibold text-neutral-700">Terms & Conditions</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-green-600 transition-colors font-semibold text-neutral-700">Privacy Policy</Link></li>
            <li><Link to="/refund-policy" className="hover:text-green-600 transition-colors font-semibold text-neutral-700">Refund Policy</Link></li>
            <li className="mt-6 pt-6 border-t border-slate-200">
              <span className="block text-[10px] text-slate-400">© {currentYear} JYASTI. All rights reserved.</span>
            </li>
          </ul>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
