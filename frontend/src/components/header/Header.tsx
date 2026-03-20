import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DeliveryToggle from './DeliveryToggle';
import { useLocation as useLocationContext } from '../../hooks/useLocation';
import { useCart } from '../../context/CartContext';
import { getHeaderCategoriesPublic } from '../../services/api/headerCategoryService';
import { useDeliveryMode } from '../../hooks/useDeliveryMode';
import { useThemeContext } from '../../context/ThemeContext';
import { getIconByName } from '../../utils/iconLibrary';
import jyastiLogo from '@assets/jyastiLogo.png';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { location: userLocation } = useLocationContext();
  const { cart } = useCart();
  const { deliveryMode } = useDeliveryMode();
  const { activeCategory, setActiveCategory, currentTheme } = useThemeContext();
  const cartCount = cart?.itemCount || 0;

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await getHeaderCategoriesPublic(true);
        const filtered = cats.filter(c => {
          if (c.status !== 'Published') return false;
          
          const slug = c.slug.toLowerCase();
          const name = c.name.toLowerCase();
          const scheduledKeywords = ['fashion', 'electronics', 'beauty', 'wedding', 'sports', 'lux', 'home-decor', 'mobile'];
          const isScheduledByKeyword = scheduledKeywords.some(word => slug.includes(word) || name.includes(word));
          const catDeliveryType = c.deliveryType || (isScheduledByKeyword ? 'scheduled' : 'quick');

          return catDeliveryType === deliveryMode;
        });
        setCategories(filtered);
      } catch (error) {
        console.error('Failed to fetch header categories', error);
      }
    };
    fetchCategories();
  }, [deliveryMode]);

  const headerBg = (activeCategory === 'all' && deliveryMode === 'scheduled')
    ? '#00796B'
    : currentTheme.headerBg
      ? currentTheme.headerBg
      : currentTheme.primary[0];

  const searchBarBg = (activeCategory === 'all' && deliveryMode === 'scheduled')
    ? '#00695C'
    : currentTheme.searchBarBg || currentTheme.headerBg || currentTheme.primary[1];

  const textColor = currentTheme.headerTextColor || '#ffffff';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (location.pathname === '/search') {
      if (value.trim()) {
        setSearchParams({ q: value });
      } else {
        setSearchParams({});
      }
    }
  };

  const handleCategoryClick = (slug: string) => {
    setActiveCategory(slug);
    if (slug === 'all') {
      navigate('/');
    } else {
      navigate(`/header-category/${slug}`);
    }
  };

  // Icons for action items
  const LocationIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );

  const NotificationIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );

  const ProfileIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  const CartIcon = () => (
    <div className="relative">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" />
        <path d="M3 6H21" />
        <path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" />
      </svg>
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#ffce10] text-neutral-900 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
          {cartCount}
        </span>
      )}
    </div>
  );

  // All Tab Icon
  const AllIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" />
      <path d="M9 22V12H15V22" />
    </svg>
  );

  return (
    <header className="hidden md:block w-full sticky top-0 z-[100] shadow-sm font-outfit transition-colors duration-500" style={{ background: headerBg }}>
      {/* Top Row: Logo, Toggle, Search, Icons */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-3 flex items-center gap-8">
        {/* Logo */}
        <Link to="/" onClick={() => setActiveCategory('all')} className="flex-shrink-0">
          <img src={jyastiLogo} alt="JYASTI builds trust" className="h-20 lg:h-24 w-auto object-contain" />
        </Link>

        {/* Middle: Toggle & Search */}
        <div className="flex-1 flex items-center gap-4 max-w-3xl">
          <DeliveryToggle variant="compact" />
          
          <form onSubmit={handleSearch} className="flex-1 relative group">
            <input
              type="text"
              placeholder="Search for items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-12 pr-4 rounded-xl text-sm font-medium transition-all focus:ring-2 focus:ring-white/20 border-none outline-none"
              style={{ backgroundColor: searchBarBg, color: textColor }}
            />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="absolute left-4 top-1/2 -translate-y-1/2 opacity-70" style={{ color: textColor }}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 lg:gap-3" style={{ color: textColor }}>
          <button onClick={() => navigate('/addresses')} className="flex flex-col items-center p-2 hover:bg-white/10 rounded-xl transition-colors min-w-[64px]">
            <LocationIcon />
            <span className="text-[10px] font-bold mt-0.5">Location</span>
          </button>
          <button className="flex flex-col items-center p-2 hover:bg-white/10 rounded-xl transition-colors min-w-[64px]">
            <NotificationIcon />
            <span className="text-[10px] font-bold mt-0.5">Alerts</span>
          </button>
          <button onClick={() => navigate('/account')} className="flex flex-col items-center p-2 hover:bg-white/10 rounded-xl transition-colors min-w-[64px]">
            <ProfileIcon />
            <span className="text-[10px] font-bold mt-0.5">Account</span>
          </button>
          <button onClick={() => navigate('/cart')} className="flex flex-col items-center p-2 hover:bg-white/10 rounded-xl transition-colors min-w-[64px]">
            <CartIcon />
            <span className="text-[10px] font-bold mt-0.5">Cart</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Categories & Rewards */}
      <div className="bg-white border-t border-neutral-100">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-11 flex items-center justify-between">
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide py-1">
            {/* All Tab */}
            <button
              onClick={() => handleCategoryClick('all')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${activeCategory === 'all' ? 'bg-neutral-100 text-neutral-900 font-bold' : 'text-neutral-500 hover:text-neutral-900 font-medium'}`}
            >
              <AllIcon />
              <span className="text-xs">All</span>
            </button>

            {categories.map((cat) => {
              const isActive = activeCategory === cat.slug;
              return (
                <button
                  key={cat._id}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${isActive ? 'bg-neutral-100 text-neutral-900 font-bold' : 'text-neutral-500 hover:text-neutral-900 font-medium'}`}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    {getIconByName(cat.iconName)}
                  </div>
                  <span className="text-xs">{cat.name}</span>
                </button>
              );
            })}
          </div>
          
          <Link to="/spin-wheel" className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-amber-100 px-4 py-1.5 rounded-full border border-yellow-200 hover:shadow-md transition-all group">
            <span className="text-[10px] font-black italic text-amber-800 tracking-tighter uppercase">Spin & Win Rewards</span>
            <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white scale-90 group-hover:rotate-[360deg] transition-transform duration-700">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
