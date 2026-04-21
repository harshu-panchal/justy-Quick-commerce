import { ReactNode, useEffect, useRef, useState, useMemo } from 'react';
import { cn } from '../utils/cn';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingCartPill from './FloatingCartPill';
import Header from './header/Header';
import Footer from './footer/Footer';
import { useLocation as useLocationContext } from '../hooks/useLocation';
import LocationPermissionRequest from './LocationPermissionRequest';
import { useThemeContext } from '../context/ThemeContext';
import { useDeliveryMode } from '../hooks/useDeliveryMode';
import ServiceNotAvailable from './ServiceNotAvailable';
import { checkServiceability } from '../services/api/customerHomeService';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mainRef = useRef<HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [categoriesRotation, setCategoriesRotation] = useState(0);
  const [prevCategoriesActive, setPrevCategoriesActive] = useState(false);
  const { isLocationEnabled, isLocationLoading, location: userLocation } = useLocationContext();
  const [showLocationRequest, setShowLocationRequest] = useState(false);
  const [showLocationChangeModal, setShowLocationChangeModal] = useState(false);
  const { currentTheme, activeCategory } = useThemeContext();
  const { deliveryMode } = useDeliveryMode();

  // State to track if service is available at user's location
  const [isServiceAvailable, setIsServiceAvailable] = useState<boolean>(true);

  // Check serviceability when user location changes
  useEffect(() => {
    // TEMPORARILY DISABLED FOR WALLET TESTING - UNCOMMENT TO RE-ENABLE
    // const performCheck = async () => {
    //   if (userLocation && userLocation.latitude && userLocation.longitude) {
    //     try {
    //       const result = await checkServiceability(userLocation.latitude, userLocation.longitude);
    //       setIsServiceAvailable(result.isServiceAvailable);
    //     } catch (error) {
    //       console.error("Failed to check serviceability:", error);
    //       // Default to true on error to avoid blocking user due to network issues
    //       setIsServiceAvailable(true);
    //     }
    //   } else {
    //     // If no location, we can't determine, so we assume available or waiting for location
    //     setIsServiceAvailable(true);
    //   }
    // };

    // performCheck();

    // TEMPORARY: Always set service as available for wallet testing
    setIsServiceAvailable(true);
  }, [userLocation]);

  const isActive = (path: string) => location.pathname === path;

  // ... (rest of the component logic)

  // Check if location is required for current route
  const requiresLocation = () => {
    const publicRoutes = ['/login', '/signup', '/seller/login', '/seller/signup', '/delivery/login', '/delivery/signup', '/admin/login'];
    // Don't require location on login/signup pages
    if (publicRoutes.includes(location.pathname)) {
      return false;
    }
    // Require location for ALL routes (not just authenticated users)
    // This ensures location is mandatory for everyone visiting the platform
    return true;
  };

  // ... (rest of the component logic)

  // ...

  // ALWAYS show location request modal on app load if location is not enabled
  // This ensures modal appears on every app open, regardless of browser permission state
  useEffect(() => {
    // Wait for initial loading to complete
    if (isLocationLoading) {
      return;
    }

    // If location is enabled, hide modal
    if (isLocationEnabled) {
      setShowLocationRequest(false);
      return;
    }

    // If location is NOT enabled and route requires location, ALWAYS show modal
    // This will trigger on every app open until user explicitly confirms location
    if (!isLocationEnabled && requiresLocation()) {
      setShowLocationRequest(true);
    } else {
      setShowLocationRequest(false);
    }
  }, [isLocationLoading, isLocationEnabled, location.pathname]);

  // ...



  // Update search query when URL params change
  useEffect(() => {
    const query = searchParams.get('q') || '';
    setSearchQuery(query);
  }, [searchParams]);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (location.pathname === '/search') {
      // Update URL params when on search page
      if (value.trim()) {
        setSearchParams({ q: value });
      } else {
        setSearchParams({});
      }
    } else {
      // Navigate to search page with query
      if (value.trim()) {
        navigate(`/search?q=${encodeURIComponent(value)}`);
      }
    }
  };


  const SCROLL_POSITION_KEY = 'home-scroll-position';

  // Reset scroll position when navigating to any page (smooth, no flash)
  // BUT skip for Home page if there's a saved scroll position to restore
  useEffect(() => {
    const isHomePage = location.pathname === '/' || location.pathname === '/user/home';

    // Home page handles its own scroll restoration and reset logic
    if (isHomePage) {
      return;
    }

    // Use requestAnimationFrame to prevent visual flash
    requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
      // Also reset window scroll smoothly
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  }, [location.pathname]);

  // Track categories active state for rotation
  const isCategoriesActive = isActive('/categories') || location.pathname.startsWith('/category/');

  useEffect(() => {
    if (isCategoriesActive && !prevCategoriesActive) {
      // Rotate clockwise when clicked (becoming active)
      setCategoriesRotation(prev => prev + 360);
      setPrevCategoriesActive(true);
    } else if (!isCategoriesActive && prevCategoriesActive) {
      // Rotate counter-clockwise when unclicked (becoming inactive)
      setCategoriesRotation(prev => prev - 360);
      setPrevCategoriesActive(false);
    }
  }, [isCategoriesActive, prevCategoriesActive]);

  const isProductDetailPage = location.pathname.startsWith('/product/');
  const isSearchPage = location.pathname === '/search';
  const isCheckoutPage = location.pathname === '/checkout' || location.pathname.startsWith('/checkout/');
  const isCartPage = location.pathname === '/cart';
  const showHeader = isSearchPage && !isCheckoutPage && !isCartPage;
  const showSearchBar = isSearchPage && !isCheckoutPage && !isCartPage;
  const showBottomNavbar = !isCheckoutPage && !isProductDetailPage;

  return (
    <div 
      className="flex flex-col min-h-screen w-full overflow-x-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Desktop Container Wrapper */}
      <div className="md:w-full md:bg-white md:min-h-screen overflow-x-hidden">
        <div className="md:w-full md:min-h-screen md:flex md:flex-col overflow-x-hidden">
          {/* Desktop Header */}
          {location.pathname !== '/account' && <Header />}

          {/* Sticky Header - Show on search page and other non-home pages, excluding account page - Mobile Only */}
          {(showHeader || isSearchPage) && (
            <header className="sticky top-0 z-50 bg-white shadow-sm md:hidden">
              {/* Delivery info line */}
              <div className="px-4 md:px-6 lg:px-8 py-1 bg-green-50 text-[10px] text-green-700 text-center font-bold">
                Delivering in 10–15 mins
              </div>

              {/* Location line - only show if user has provided location */}
              {userLocation && (userLocation.address || userLocation.city) && (
                <div className="px-4 md:px-6 lg:px-8 py-1.5 flex items-center justify-between text-xs">
                  <span className="text-neutral-700 line-clamp-1" title={userLocation?.address || ''}>
                    {userLocation?.address
                      ? userLocation.address.length > 50
                        ? `${userLocation.address.substring(0, 50)}...`
                        : userLocation.address
                      : userLocation?.city && userLocation?.state
                        ? `${userLocation.city}, ${userLocation.state}`
                        : userLocation?.city || ''}
                  </span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => navigate('/seller/signup')} 
                      className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-tighter shadow-sm active:scale-95"
                    >
                      <span className="whitespace-nowrap">Become a Seller</span>
                    </button>
                    <button
                      onClick={() => setShowLocationChangeModal(true)}
                      className="text-blue-600 font-bold hover:text-blue-700 transition-colors flex-shrink-0 ml-0.5 text-[11px]"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {/* Search bar - Hidden on Order Again page */}
              {showSearchBar && (
                <div className="px-4 md:px-6 lg:px-8 pb-2">
                  <div className="relative max-w-2xl md:mx-auto">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search for products..."
                      className="w-full px-4 py-2 pl-10 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent md:py-3"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">🔍</span>
                  </div>
                </div>
              )}
            </header>
          )}

          {/* Scrollable Main Content */}
          <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pb-32 md:pb-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isLocationEnabled && userLocation ? 'content' : 'location-check'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-full"
                style={{ minHeight: '100%' }}
              >
                {/* Service Availability Check */}
                {
                  (() => {
                    // If we have a location but service is NOT available, show the unavailable screen
                    // We check the component state 'isServiceAvailable' which is updated by useEffect
                    if (isLocationEnabled && userLocation && !isServiceAvailable && !showLocationRequest) {
                      return <ServiceNotAvailable onChangeLocation={() => setShowLocationChangeModal(true)} />;
                    }
                    return children;
                  })()
                }
              </motion.div>
            </AnimatePresence>



            {/* Floating Cart Pill (Mobile only, hidden on cart/checkout) */}
            {!(isCartPage || isCheckoutPage) && !isProductDetailPage && (
              <FloatingCartPill />
            )}
          </main>

          {/* Location Permission Request Modal - Mandatory for all users */}
          {showLocationRequest && (
            <LocationPermissionRequest
              onLocationGranted={() => setShowLocationRequest(false)}
              skipable={false}
              title="Location Access Required"
              description="We need your location to show you products available near you and enable delivery services. Location access is required to continue."
            />
          )}

          {/* Location Change Modal */}
          {showLocationChangeModal && (
            <LocationPermissionRequest
              onLocationGranted={() => setShowLocationChangeModal(false)}
              skipable={true}
              title="Change Location"
              description="Update your location to see products available near you."
              forceOpen={true}
            />
          )}

          {/* Fixed Bottom Navigation - Mobile Only, Hidden on checkout pages */}
          {showBottomNavbar && (
            <nav
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden transition-all duration-300"
            >
              {/* Main Container with Glassmorphism */}
              <div
                className="absolute inset-0 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl border-t"
                style={{
                  background: (activeCategory === 'all' && deliveryMode === 'scheduled')
                    ? '#00796B'
                    : currentTheme.headerBg
                      ? `linear-gradient(to bottom, ${currentTheme.headerBg}ee, ${currentTheme.headerBg})`
                      : 'rgba(255, 255, 255, 0.85)',
                  borderColor: currentTheme.headerBg ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  paddingBottom: 'env(safe-area-inset-bottom, 0)'
                }}
              />
              
              <div 
                className="flex justify-around items-center h-[72px] relative z-10 px-4"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
              >
                {[
                  { id: '/', label: 'Home', to: '/', icon: (active: boolean) => (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"}>
                      <path d="M3 9.5L12 3.5L21 9.5V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V9.5Z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9 21V12H15V21" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )},
                  { id: '/order-again', label: 'Repeat', to: '/order-again', icon: (active: boolean) => (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"}>
                      <path d="M4 6H20V10H4V6Z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 10V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V10" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9 21V10H15V21" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )},
                  { id: '/categories', label: 'Items', to: '/categories', icon: (active: boolean) => (
                    <motion.svg 
                      width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"}
                      animate={{ rotate: (isActive('/categories') || location.pathname.startsWith('/category/')) ? 90 : 0 }}
                    >
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    </motion.svg>
                  )},
                  { id: '/account', label: 'Me', to: '/account', icon: (active: boolean) => (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"}>
                      <path d="M20 21C20 18.2386 16.4183 16 12 16C7.58172 16 4 18.2386 4 21" strokeLinecap="round" />
                      <circle cx="12" cy="7" r="4" strokeLinecap="round" />
                    </svg>
                  )}
                ].map((item) => {
                  const active = item.id === '/' ? isActive('/') : (item.id === '/categories' ? (isActive('/categories') || location.pathname.startsWith('/category/')) : isActive(item.to));
                  const color = currentTheme.headerBg ? '#ffffff' : (active ? currentTheme.accentColor : '#94a3b8');
                  
                  return (
                    <Link
                      key={item.id}
                      to={item.to}
                      className="relative flex flex-col items-center justify-center flex-1 h-full py-1"
                    >
                      <motion.div
                        initial={false}
                        animate={{ 
                          scale: active ? 1.1 : 1,
                          color: color
                        }}
                        className="relative z-10 flex flex-col items-center gap-1"
                      >
                        <div className="relative">
                          {item.icon(active)}
                          {active && (
                            <motion.div
                              layoutId="nav-bg"
                              className="absolute -inset-3 rounded-2xl -z-10"
                              style={{ 
                                background: currentTheme.headerBg ? 'rgba(255,255,255,0.15)' : `${currentTheme.accentColor}15`,
                              }}
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                        </div>
                        <span className={cn(
                          "text-[11px] font-bold tracking-tight transition-colors duration-300",
                          active ? "opacity-100" : "opacity-70"
                        )}>
                          {item.label}
                        </span>
                      </motion.div>

                      {active && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: color }}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

