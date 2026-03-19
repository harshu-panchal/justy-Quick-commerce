import { ReactNode, useEffect, useRef, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingCartPill from './FloatingCartPill';
import Header from './header/Header';
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
  const showFooter = !isCheckoutPage && !isProductDetailPage;

  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden">
      {/* Desktop Container Wrapper */}
      <div className="md:w-full md:bg-white md:min-h-screen overflow-x-hidden">
        <div className="md:w-full md:min-h-screen md:flex md:flex-col overflow-x-hidden">
          {/* Desktop Header */}
          <Header />

          {/* Sticky Header - Show on search page and other non-home pages, excluding account page - Mobile Only */}
          {(showHeader || isSearchPage) && (
            <header className="sticky top-0 z-50 bg-white shadow-sm md:hidden">
              {/* Delivery info line */}
              <div className="px-4 md:px-6 lg:px-8 py-1.5 bg-green-50 text-xs text-green-700 text-center">
                Delivering in 10–15 mins
              </div>

              {/* Location line - only show if user has provided location */}
              {userLocation && (userLocation.address || userLocation.city) && (
                <div className="px-4 md:px-6 lg:px-8 py-2 flex items-center justify-between text-sm">
                  <span className="text-neutral-700 line-clamp-1" title={userLocation?.address || ''}>
                    {userLocation?.address
                      ? userLocation.address.length > 50
                        ? `${userLocation.address.substring(0, 50)}...`
                        : userLocation.address
                      : userLocation?.city && userLocation?.state
                        ? `${userLocation.city}, ${userLocation.state}`
                        : userLocation?.city || ''}
                  </span>
                  <button
                    onClick={() => setShowLocationChangeModal(true)}
                    className="text-blue-600 font-medium hover:text-blue-700 transition-colors flex-shrink-0 ml-2"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Search bar - Hidden on Order Again page */}
              {showSearchBar && (
                <div className="px-4 md:px-6 lg:px-8 pb-3">
                  <div className="relative max-w-2xl md:mx-auto">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search for products..."
                      className="w-full px-4 py-2.5 pl-10 bg-neutral-50 border border-neutral-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent md:py-3"
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
          </main>

          {/* Floating Cart Pill */}
          <FloatingCartPill />

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
          {showFooter && (
            <nav
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-[env(safe-area-inset-bottom,0)] transition-all duration-300"
            >
              <div
                className="absolute inset-0 border-t transition-all duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.15)]"
                style={{
                  background: (activeCategory === 'all' && deliveryMode === 'scheduled')
                    ? '#00796B'
                    : currentTheme.headerBg
                      ? `linear-gradient(to right, ${currentTheme.headerBg}, ${currentTheme.searchBarBg || currentTheme.headerBg})`
                      : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: currentTheme.headerBg ? 'none' : 'blur(20px)',
                  borderColor: currentTheme.headerBg ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                }}
              />
              <div className="flex justify-around items-center h-16 relative z-10 px-2">
                {/* Home */}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex-1 h-full"
                >
                  <Link
                    to="/"
                    className="flex flex-col items-center justify-center h-full gap-1"
                  >
                    <motion.svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {isActive('/') ? (
                        <>
                          <path d="M2.25 12L12 3.25L21.75 12" stroke={currentTheme.headerBg ? '#ffffff' : currentTheme.accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M4.75 11.25V19.75C4.75 20.3 5.2 20.75 5.75 20.75H18.25C18.8 20.75 19.25 20.3 19.25 19.75V11.25" stroke={currentTheme.headerBg ? '#ffffff' : currentTheme.accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill={currentTheme.headerBg ? '#ffffff' : currentTheme.primary[0]} fillOpacity={currentTheme.headerBg ? 0.3 : 0.2} />
                          <path d="M9.75 20.75V14.75H14.25V20.75" stroke={currentTheme.headerBg ? '#ffffff' : currentTheme.accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </>
                      ) : (
                        <>
                          <path d="M2.25 12L12 3.25L21.75 12" stroke={currentTheme.headerBg ? '#ffffff' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity={currentTheme.headerBg ? 0.8 : 1} />
                          <path d="M4.75 11.25V19.75C4.75 20.3 5.2 20.75 5.75 20.75H18.25C18.8 20.75 19.25 20.3 19.25 19.75V11.25" stroke={currentTheme.headerBg ? '#ffffff' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity={currentTheme.headerBg ? 0.8 : 1} />
                        </>
                      )}
                    </motion.svg>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold ${isActive('/') ? '' : (currentTheme.headerBg ? 'text-white/60' : 'text-neutral-500')}`}
                      style={{ color: isActive('/') ? (currentTheme.headerBg ? '#ffffff' : currentTheme.accentColor) : '' }}
                    >
                      Home
                    </span>
                    {isActive('/') && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: currentTheme.headerBg ? '#ffffff' : currentTheme.accentColor }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.div>

                {/* Order Again */}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex-1 h-full"
                >
                  <Link
                    to="/order-again"
                    className="flex flex-col items-center justify-center h-full gap-1"
                  >
                    <motion.svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {isActive('/order-again') ? (
                        <>
                          <path d="M4.5 9.5V6C4.5 4.34 5.84 3 7.5 3H16.5C18.16 3 19.5 4.34 19.5 6V9.5H21.5C21.91 9.5 22.25 9.84 22.25 10.25V20.75C22.25 21.16 21.91 21.5 21.5 21.5H2.5C2.09 21.5 1.75 21.16 1.75 20.75V10.25C1.75 9.84 2.09 9.5 2.5 9.5H4.5Z" stroke={currentTheme.headerBg ? '#ffffff' : currentTheme.accentColor} strokeWidth="2.5" strokeLinejoin="round" fill={currentTheme.headerBg ? '#ffffff' : currentTheme.primary[0]} fillOpacity={currentTheme.headerBg ? 0.3 : 0.2} />
                          <path d="M7.75 9.5V6C7.75 5.59 8.09 5.25 8.5 5.25H15.5C15.91 5.25 16.25 5.59 16.25 6V9.5" stroke={currentTheme.headerBg ? '#ffffff' : currentTheme.accentColor} strokeWidth="2.5" strokeLinecap="round" />
                          <path d="M10 13L12 15L16 11" stroke={currentTheme.headerBg ? '#ffffff' : currentTheme.accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </>
                      ) : (
                        <>
                          <path d="M4.5 9.5V6C4.5 4.34 5.84 3 7.5 3H16.5C18.16 3 19.5 4.34 19.5 6V9.5H21.5C21.91 9.5 22.25 9.84 22.25 10.25V20.75C22.25 21.16 21.91 21.5 21.5 21.5H2.5C2.09 21.5 1.75 21.16 1.75 20.75V10.25C1.75 9.84 2.09 9.5 2.5 9.5H4.5Z" stroke={currentTheme.headerBg ? '#ffffff' : '#6b7280'} strokeWidth="2" strokeLinejoin="round" strokeOpacity={currentTheme.headerBg ? 0.7 : 1} />
                          <path d="M7.75 9.5V6C7.75 5.59 8.09 5.25 8.5 5.25H15.5C15.91 5.25 16.25 5.59 16.25 6V9.5" stroke={currentTheme.headerBg ? '#ffffff' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeOpacity={currentTheme.headerBg ? 0.7 : 1} />
                        </>
                      )}
                    </motion.svg>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold ${isActive('/order-again') ? '' : (currentTheme.headerBg ? 'text-white/60' : 'text-neutral-500')}`}
                      style={{ color: isActive('/order-again') ? (currentTheme.headerBg ? '#ffffff' : currentTheme.accentColor) : '' }}
                    >
                      Repeat
                    </span>
                    {isActive('/order-again') && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: currentTheme.headerBg ? '#ffffff' : currentTheme.accentColor }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.div>

                {/* Categories */}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex-1 h-full"
                >
                  <Link
                    to="/categories"
                    className="flex flex-col items-center justify-center h-full gap-1"
                  >
                    <motion.svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      animate={{
                        rotate: categoriesRotation
                      }}
                      transition={{
                        duration: 0.6,
                        ease: [0.34, 1.56, 0.64, 1]
                      }}
                    >
                      {isActive('/categories') || location.pathname.startsWith('/category/') ? (
                        <>
                          <rect x="3.25" y="3.25" width="7.5" height="7.5" rx="2" stroke={currentTheme.headerBg ? '#ffffff' : currentTheme.accentColor} strokeWidth="2.5" fill={currentTheme.headerBg ? '#ffffff' : currentTheme.primary[0]} fillOpacity={currentTheme.headerBg ? 0.3 : 1} />
                          <rect x="13.25" y="3.25" width="7.5" height="7.5" rx="2" stroke={currentTheme.headerBg ? '#ffffff' : currentTheme.accentColor} strokeWidth="2.5" />
                          <rect x="3.25" y="13.25" width="7.5" height="7.5" rx="2" stroke={currentTheme.headerBg ? '#ffffff' : currentTheme.accentColor} strokeWidth="2.5" />
                          <rect x="13.25" y="13.25" width="7.5" height="7.5" rx="2" stroke={currentTheme.headerBg ? '#ffffff' : currentTheme.accentColor} strokeWidth="2.5" fill={currentTheme.headerBg ? '#ffffff' : currentTheme.primary[0]} fillOpacity={currentTheme.headerBg ? 0.3 : 1} />
                        </>
                      ) : (
                        <>
                          <rect x="3" y="3" width="8" height="8" rx="2" stroke={currentTheme.headerBg ? '#ffffff' : '#6b7280'} strokeWidth="2" strokeOpacity={currentTheme.headerBg ? 0.7 : 1} />
                          <rect x="13" y="3" width="8" height="8" rx="2" stroke={currentTheme.headerBg ? '#ffffff' : '#6b7280'} strokeWidth="2" strokeOpacity={currentTheme.headerBg ? 0.7 : 1} />
                          <rect x="3" y="13" width="8" height="8" rx="2" stroke={currentTheme.headerBg ? '#ffffff' : '#6b7280'} strokeWidth="2" strokeOpacity={currentTheme.headerBg ? 0.7 : 1} />
                          <rect x="13" y="13" width="8" height="8" rx="2" stroke={currentTheme.headerBg ? '#ffffff' : '#6b7280'} strokeWidth="2" strokeOpacity={currentTheme.headerBg ? 0.7 : 1} />
                        </>
                      )}
                    </motion.svg>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold ${(isActive('/categories') || location.pathname.startsWith('/category/')) ? '' : (currentTheme.headerBg ? 'text-white/60' : 'text-neutral-500')}`}
                      style={{ color: (isActive('/categories') || location.pathname.startsWith('/category/')) ? (currentTheme.headerBg ? '#ffffff' : currentTheme.accentColor) : '' }}
                    >
                      Items
                    </span>
                    {(isActive('/categories') || location.pathname.startsWith('/category/')) && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: currentTheme.headerBg ? '#ffffff' : currentTheme.accentColor }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.div>

                {/* Profile */}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex-1 h-full"
                >
                  <Link
                    to="/account"
                    className="flex flex-col items-center justify-center h-full gap-1"
                  >
                    <motion.svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {isActive('/account') ? (
                        <>
                          <circle cx="12" cy="7.25" r="4.25" stroke={currentTheme.headerBg ? '#ffffff' : currentTheme.accentColor} strokeWidth="2.5" fill={currentTheme.headerBg ? '#ffffff' : currentTheme.primary[0]} fillOpacity={currentTheme.headerBg ? 0.3 : 0.2} />
                          <path d="M4.25 20.25C4.25 16.384 7.71904 13.25 12 13.25C16.281 13.25 19.75 16.384 19.75 20.25" stroke={currentTheme.headerBg ? '#ffffff' : currentTheme.accentColor} strokeWidth="2.5" strokeLinecap="round" />
                        </>
                      ) : (
                        <>
                          <circle cx="12" cy="7.25" r="4.25" stroke={currentTheme.headerBg ? '#ffffff' : '#6b7280'} strokeWidth="2" strokeOpacity={currentTheme.headerBg ? 0.7 : 1} />
                          <path d="M4.25 20.25C4.25 16.384 7.71904 13.25 12 13.25C16.281 13.25 19.75 16.384 19.75 20.25" stroke={currentTheme.headerBg ? '#ffffff' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeOpacity={currentTheme.headerBg ? 0.7 : 1} />
                        </>
                      )}
                    </motion.svg>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold ${isActive('/account') ? '' : (currentTheme.headerBg ? 'text-white/60' : 'text-neutral-500')}`}
                      style={{ color: isActive('/account') ? (currentTheme.headerBg ? '#ffffff' : currentTheme.accentColor) : '' }}
                    >
                      Me
                    </span>
                    {isActive('/account') && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: currentTheme.headerBg ? '#ffffff' : currentTheme.accentColor }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.div>
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

