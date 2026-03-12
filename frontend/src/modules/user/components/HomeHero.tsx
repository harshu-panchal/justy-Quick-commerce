import { useNavigate } from 'react-router-dom';
import { useLayoutEffect, useRef, useState, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getTheme } from '../../../utils/themes';
import { useLocation } from '../../../hooks/useLocation';
import { appConfig } from '../../../services/configService';
import { getCategories } from '../../../services/api/customerProductService';
import { Category } from '../../../types/domain';
import { getHeaderCategoriesPublic } from '../../../services/api/headerCategoryService';
import { getIconByName } from '../../../utils/iconLibrary';
import PincodeSelector from '../../../components/PincodeSelector';
import DeliveryToggle from '../../../components/header/DeliveryToggle';
import { useDeliveryMode } from '../../../hooks/useDeliveryMode';
import { useCart } from '../../../context/CartContext'; // Assuming CartContext exists
import LocationModal from '../../../components/header/LocationModal';

gsap.registerPlugin(ScrollTrigger);

interface HomeHeroProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const ALL_TAB: Tab = {
  id: 'all',
  label: 'All',
  icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function HomeHero({ activeTab = 'all', onTabChange }: HomeHeroProps) {
  const [tabs, setTabs] = useState<Tab[]>([ALL_TAB]);

  const { deliveryMode } = useDeliveryMode();

  useEffect(() => {
    const fetchHeaderCategories = async () => {
      try {
        const cats = await getHeaderCategoriesPublic();
        if (cats && cats.length > 0) {
          const mapped = cats
            .filter(c => {
              if (c.status !== 'Published') return false;
              const slug = c.slug.toLowerCase();
              const name = c.name.toLowerCase();

              // Determine deliveryType: use API field if present, fallback to keyword heuristic
              const scheduledKeywords = ['fashion', 'electronics', 'beauty', 'wedding', 'sports', 'lux', 'home-decor', 'mobile'];
              const isScheduledByKeyword = scheduledKeywords.some(word => slug.includes(word) || name.includes(word));

              const catDeliveryType = c.deliveryType || (isScheduledByKeyword ? 'scheduled' : 'quick');

              if (deliveryMode === 'scheduled') {
                return catDeliveryType === 'scheduled';
              } else {
                return catDeliveryType === 'quick';
              }
              return (c.deliveryType || 'quick') === deliveryMode;
            })
            .map(c => ({
              id: c.slug,
              label: c.name,
              icon: getIconByName(c.iconName),
            }));

          const newTabs = [ALL_TAB, ...mapped];
          setTabs(newTabs);

          // If current activeTab is not "all" and is no longer in the tabs list for the current deliveryMode,
          // redirect the user back to "all" to avoid showing a category from the wrong delivery mode
          if (activeTab !== 'all' && !newTabs.some((t) => t.id === activeTab)) {
            onTabChange?.('all');
            navigate('/');
          }
        }
      } catch (error) {
        console.error('Failed to fetch header categories', error);
      }
    };
    fetchHeaderCategories();
  }, [deliveryMode]);

  const navigate = useNavigate();
  const { location: userLocation } = useLocation();
  const { cart } = useCart();
  const cartCount = cart?.itemCount || 0;
  const heroRef = useRef<HTMLDivElement>(null);
  const topSectionRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [, setIsSticky] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Format location display text - only show if user has provided location
  const locationDisplayText = useMemo(() => {
    if (userLocation?.address) {
      // Use the full address if available
      return userLocation.address;
    }
    // Fallback to city, state format if available
    if (userLocation?.city && userLocation?.state) {
      return `${userLocation.city}, ${userLocation.state}`;
    }
    // Fallback to city only
    if (userLocation?.city) {
      return userLocation.city;
    }
    // No default - return empty string if no location provided
    return '';
  }, [userLocation]);

  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories for search suggestions
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        if (response.success && response.data) {
          setCategories(response.data.map((c: any) => ({
            ...c,
            id: c._id || c.id
          })));
        }
      } catch (error) {
        console.error("Error fetching categories for suggestions:", error);
      }
    };
    fetchCategories();
  }, []);

  // Search suggestions based on active tab or fetched categories
  const searchSuggestions = useMemo(() => {
    if (activeTab === 'all' && categories.length > 0) {
      // Use real category names for 'all' tab suggestions
      return categories.slice(0, 8).map(c => c.name.toLowerCase());
    }

    switch (activeTab) {
      case 'wedding':
        return ['gift packs', 'dry fruits', 'sweets', 'decorative items', 'wedding cards', 'return gifts'];
      case 'winter':
        return ['woolen clothes', 'caps', 'gloves', 'blankets', 'heater', 'winter wear'];
      case 'electronics':
        return ['chargers', 'cables', 'power banks', 'earphones', 'phone cases', 'screen guards'];
      case 'beauty':
        return ['lipstick', 'makeup', 'skincare', 'kajal', 'face wash', 'moisturizer'];
      case 'grocery':
        return ['atta', 'milk', 'dal', 'rice', 'oil', 'vegetables'];
      case 'fashion':
        return ['clothing', 'shoes', 'accessories', 'watches', 'bags', 'jewelry'];
      case 'sports':
        return ['cricket bat', 'football', 'badminton', 'fitness equipment', 'sports shoes', 'gym wear'];
      default: // 'all'
        return ['atta', 'milk', 'dal', 'coke', 'bread', 'eggs', 'rice', 'oil'];
    }
  }, [activeTab]);

  useLayoutEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        hero,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
        }
      );
    }, hero);

    return () => ctx.revert();
  }, []);

  // Animate search suggestions
  useEffect(() => {
    setCurrentSearchIndex(0);
    const interval = setInterval(() => {
      setCurrentSearchIndex((prev) => (prev + 1) % searchSuggestions.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [searchSuggestions.length, activeTab]);

  // Handle scroll to detect when header is sticky
  useEffect(() => {
    const handleScroll = () => {
      if (topSectionRef.current) {
        const topSectionBottom = topSectionRef.current.getBoundingClientRect().bottom;
        const topSectionHeight = topSectionRef.current.offsetHeight;
        const progress = Math.min(Math.max(1 - (topSectionBottom / topSectionHeight), 0), 1);
        setScrollProgress(progress);
        setIsSticky(topSectionBottom <= 0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update sliding indicator position when activeTab changes and scroll to active tab
  useEffect(() => {
    const updateIndicator = (shouldScroll = true) => {
      const activeTabButton = tabRefs.current.get(activeTab);
      const container = tabsContainerRef.current;

      if (activeTabButton && container) {
        try {
          // Use offsetLeft for position relative to container (not affected by scroll)
          // This ensures the indicator stays aligned even when container scrolls
          const left = activeTabButton.offsetLeft;
          const width = activeTabButton.offsetWidth;

          // Ensure valid values
          if (width > 0) {
            setIndicatorStyle({ left, width });
          }

          // Scroll the container to bring the active tab into view (only when tab changes)
          if (shouldScroll) {
            const containerScrollLeft = container.scrollLeft;
            const containerWidth = container.offsetWidth;
            const buttonLeft = left;
            const buttonWidth = width;
            const buttonRight = buttonLeft + buttonWidth;

            // Calculate scroll position to center the button or keep it visible
            const scrollPadding = 20; // Padding from edges
            let targetScrollLeft = containerScrollLeft;

            // If button is on the left side and partially or fully hidden
            if (buttonLeft < containerScrollLeft + scrollPadding) {
              targetScrollLeft = buttonLeft - scrollPadding;
            }
            // If button is on the right side and partially or fully hidden
            else if (buttonRight > containerScrollLeft + containerWidth - scrollPadding) {
              targetScrollLeft = buttonRight - containerWidth + scrollPadding;
            }

            // Smooth scroll to the target position
            if (targetScrollLeft !== containerScrollLeft) {
              container.scrollTo({
                left: Math.max(0, targetScrollLeft),
                behavior: 'smooth'
              });
            }
          }
        } catch (error) {
          console.warn('Error updating indicator:', error);
        }
      }
    };

    // Update immediately with scroll
    updateIndicator(true);

    // Also update after delays to handle any layout shifts and ensure smooth animation
    const timeout1 = setTimeout(() => updateIndicator(true), 50);
    const timeout2 = setTimeout(() => updateIndicator(true), 150);
    const timeout3 = setTimeout(() => updateIndicator(false), 300); // Last update without scroll to avoid conflicts

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [activeTab]);

  const handleTabClick = (tabId: string) => {
    onTabChange?.(tabId);
    if (tabId === 'all') {
      navigate('/');
    } else {
      navigate(`/header-category/${tabId}`);
    }
  };

  const theme = getTheme(activeTab || 'all');

  return (
    <div ref={heroRef} className="pb-0 mb-0">
      {/* Top Header Section */}
      <div
        className="px-4 md:px-6 lg:px-8 pt-3 pb-3 transition-colors duration-500"
        style={{ backgroundColor: (activeTab === 'all' && deliveryMode === 'scheduled') ? '#00796B' : (theme.headerBg || '#007fb1') }}
      >
        {/* 1. Full-width Mode Toggle */}
        <div className="mb-4 max-w-2xl mx-auto">
          <DeliveryToggle />
        </div>

        {/* 2. Row: Search + Cart + Profile */}
        <div className="flex items-center gap-3 mb-4 max-w-2xl mx-auto">
          {/* Search Bar - Pill shape */}
          <div
            onClick={() => navigate('/search')}
            className="flex-1 rounded-full h-12 flex items-center px-4 gap-3 cursor-pointer border border-white/10 transition-colors duration-500"
            style={{ backgroundColor: (activeTab === 'all' && deliveryMode === 'scheduled') ? '#00695C' : (theme.searchBarBg || '#004e6e') }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/70">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2.5" />
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <div className="flex-1 relative h-5 overflow-hidden">
              {searchSuggestions.map((suggestion, index) => {
                const isActive = index === currentSearchIndex;
                const prevIndex = (currentSearchIndex - 1 + searchSuggestions.length) % searchSuggestions.length;
                const isPrev = index === prevIndex;

                return (
                  <div
                    key={suggestion}
                    className={`absolute inset-0 flex items-center transition-all duration-500 ${isActive
                      ? 'translate-y-0 opacity-100'
                      : isPrev
                        ? '-translate-y-full opacity-0'
                        : 'translate-y-full opacity-0'
                      }`}
                  >
                    <span className="text-white/90 text-sm font-medium">
                      Search in {deliveryMode === 'quick' ? 'Quick' : 'Scheduled'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart Icon */}
          <div className="relative cursor-pointer" onClick={() => navigate('/cart')}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
              <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span
              className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2"
              style={{ borderColor: theme.headerBg || '#007fb1' }}
            >
              {cartCount}
            </span>
          </div>

          {/* Profile Circle */}
          <div
            className="w-10 h-10 bg-[#99d79a] text-[#006002] rounded-full flex items-center justify-center font-bold text-lg cursor-pointer border-2 border-white/20"
            onClick={() => navigate('/account')}
          >
            S
          </div>
        </div>

        {/* 3. Redesigned Location & Delivery Strip */}
        <div className="max-w-2xl mx-auto flex flex-col gap-1 px-1">
          {/* Top Row: Delivery To text */}
          <div className="flex items-center justify-between text-white/95">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="font-semibold text-xs opacity-90">Delivery To:</span>
              <span className="truncate font-bold text-sm tracking-tight">{locationDisplayText || 'Select Location'}</span>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/80 ml-2">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Bottom Row: Delivery Mode Indicator/Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {deliveryMode === 'quick' ? (
                <>
                  <span className="text-white font-black italic text-lg tracking-tighter mr-2">
                    <span className="text-white/60">⎯ </span>Quick
                  </span>
                  <div className="bg-[#e8f5e9] border border-[#2e7d32] px-3 py-1 rounded-lg">
                    <span className="text-[#1b5e20] text-xs font-bold whitespace-nowrap">Quick Delivery</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-white font-bold text-base tracking-tight mr-2">
                    Scheduled
                  </span>
                  <div className="bg-amber-50 border border-amber-600 px-3 py-1 rounded-lg">
                    <span className="text-amber-800 text-xs font-bold whitespace-nowrap">Scheduled Delivery</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Sticky Category Header (Untouched as requested) */}
      <div
        ref={stickyRef}
        className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-100"
      >
        <div className="w-full">
          <div
            ref={tabsContainerRef}
            className={`relative flex ${deliveryMode === 'scheduled' ? 'gap-5 md:gap-8' : 'gap-2 md:gap-3'} overflow-x-auto scrollbar-hide px-4 md:px-6 lg:px-8 md:justify-center scroll-smooth py-1.5 md:py-3`}
          >
            {/* Sliding Indicator */}
            {indicatorStyle.width > 0 && (
              <div
                className="absolute bottom-0 h-1 bg-neutral-900 rounded-t-md transition-all duration-300 ease-out pointer-events-none"
                style={{
                  left: `${indicatorStyle.left}px`,
                  width: `${indicatorStyle.width}px`,
                  transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 0,
                }}
              />
            )}

            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const tabColor = isActive ? 'text-neutral-900' : 'text-neutral-500';

              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    if (el) {
                      tabRefs.current.set(tab.id, el);
                    } else {
                      tabRefs.current.delete(tab.id);
                    }
                  }}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex-shrink-0 flex flex-col md:flex-row items-center justify-center min-w-[60px] md:min-w-fit md:px-4 py-0.5 md:py-1 relative ${tabColor} z-10 transition-colors duration-300`}
                  type="button"
                >
                  <div className={`mb-0 md:mb-1 md:mr-2 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center ${isActive ? 'scale-110' : 'scale-100'} transition-transform duration-300`}>
                    {tab.icon}
                  </div>
                  <span className={`text-[10px] md:text-xs md:whitespace-nowrap ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <LocationModal
        open={isLocationModalOpen}
        onOpenChange={setIsLocationModalOpen}
      />
    </div>
  );
}

