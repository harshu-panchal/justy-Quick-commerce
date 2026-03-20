import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import HomeHero from "./components/HomeHero";
import BannerCarousel from "../../components/banners/BannerCarousel";
import PromoStrip from "./components/PromoStrip";
import CategoryTileSection from "./components/CategoryTileSection";
import ProductCard from "./components/ProductCard";
import QuickDeliverySection from "./components/QuickDeliverySection";
import { getHomeContent } from "../../services/api/customerHomeService";
import { getHeaderCategoriesPublic } from "../../services/api/headerCategoryService";
import { useLocation } from "../../hooks/useLocation";
import { useLoading } from "../../context/LoadingContext";
import PageLoader from "../../components/PageLoader";
import ComingSoon from "../../components/ComingSoon";
import { isCategoryAvailable } from "../../config/pincodeService";
import { getStoredPincode } from "../../components/PincodeSelector";
import LuckySpin from "../../components/LuckySpin";

import { useThemeContext } from "../../context/ThemeContext";
import { useDeliveryMode } from "../../hooks/useDeliveryMode";
import { useSpinner } from "../../hooks/useSpinner";
import { useAuth } from "../../context/AuthContext";
import { getSpinWheelCampaign } from "../../services/api/customerSpinWheelService";

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { location: userLocation } = useLocation();
  const { activeCategory, setActiveCategory, currentTheme } = useThemeContext();
  const { deliveryMode } = useDeliveryMode();
  const { startRouteLoading, stopRouteLoading } = useLoading();
  const activeTab = activeCategory;
  const setActiveTab = setActiveCategory;
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollHandledRef = useRef(false);
  const SCROLL_POSITION_KEY = 'home-scroll-position';

  useEffect(() => {
    if (!isAuthenticated) return;
    if (user?.userType && user.userType !== "Customer") return;

    const key = `spin-wheel-auto-customer-${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    getSpinWheelCampaign()
      .then((res) => {
        if (res?.success && res?.data?.campaign && !res?.data?.mySpin) {
          navigate("/spin-wheel");
        }
      })
      .catch(() => {});
  }, [isAuthenticated, navigate, user?.userType]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homeData, setHomeData] = useState<any>({
    bestsellers: [],
    categories: [],
    homeSections: [],
    shops: [],
    promoBanners: [],
    trending: [],
    cookingIdeas: [],
    promoCards: [],
    promoStrip: null,
    lowestPrices: [],
  });
  const [headerCategories, setHeaderCategories] = useState<any[]>([]);

  const [products, setProducts] = useState<any[]>([]);


  const saveScrollPosition = () => {
    const mainElement = document.querySelector('main');
    const scrollPos = Math.max(
      mainElement ? mainElement.scrollTop : 0,
      window.scrollY || 0,
      document.documentElement.scrollTop || 0
    );
    if (scrollPos > 0) {
      sessionStorage.setItem(SCROLL_POSITION_KEY, scrollPos.toString());
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        startRouteLoading();
        setLoading(true);
        setError(null);
        const slug = activeTab === "all" ? undefined : activeTab;

        const response = await getHomeContent(
          slug,
          userLocation?.latitude,
          userLocation?.longitude
        );
        if (response.success && response.data) {
          setHomeData(response.data);
          
          let allProducts: any[] = [];
          
          // Add bestsellers
          if (response.data.bestsellers) {
            allProducts = [...response.data.bestsellers];
          }
          
          // If in a specific category tab, also aggregate products from all dynamic sections
          if (slug && response.data.homeSections) {
            response.data.homeSections.forEach((section: any) => {
              if (section.displayType === "products" && section.data) {
                // Add unique products to the list
                section.data.forEach((p: any) => {
                  if (!allProducts.some(existing => (existing._id || existing.id) === (p._id || p.id))) {
                    allProducts.push(p);
                  }
                });
              }
            });
          }
          
          setProducts(allProducts);
        } else {
          setError("Failed to load content. Please try again.");
        }
      } catch (error) {
        console.error("Failed to fetch home content", error);
        setError("Network error. Please check your connection.");
      } finally {
        setLoading(false);
        stopRouteLoading();
      }
    };

    fetchData();
  }, [userLocation?.latitude, userLocation?.longitude, activeTab]);

  const { showLuckySpin, setShowLuckySpin, triggerSpinner, config: spinnerConfig } = useSpinner(homeData.spinnerSettings);

  useEffect(() => {
    triggerSpinner('onLogin', 3000);
  }, [triggerSpinner]);

  useEffect(() => {
    const preloadHeaderCategories = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const cats = await getHeaderCategoriesPublic(true);
        setHeaderCategories(cats);
        const slugsToPreload = ['all', ...cats.map(cat => cat.slug)];
        const batchSize = 2;
        for (let i = 0; i < slugsToPreload.length; i += batchSize) {
          const batch = slugsToPreload.slice(i, i + batchSize);
          await Promise.all(
            batch.map(slug =>
              getHomeContent(
                slug,
                userLocation?.latitude,
                userLocation?.longitude,
                true,
                5 * 60 * 1000,
                true
              ).catch(err => {
                console.debug(`Failed to preload data for ${slug}:`, err);
              })
            )
          );
          if (i + batchSize < slugsToPreload.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      } catch (error) {
        console.debug("Failed to preload header categories:", error);
      }
    };
    preloadHeaderCategories();
  }, [userLocation?.latitude, userLocation?.longitude]);

  useEffect(() => {
    if (!loading && homeData.shops) {
      if (scrollHandledRef.current) return;
      scrollHandledRef.current = true;
      const savedScrollPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
      if (savedScrollPosition) {
        const scrollY = parseInt(savedScrollPosition, 10);
        const performScroll = () => {
          const mainElement = document.querySelector('main');
          if (mainElement) mainElement.scrollTop = scrollY;
          window.scrollTo(0, scrollY);
        };
        requestAnimationFrame(() => {
          performScroll();
          requestAnimationFrame(() => {
            performScroll();
            setTimeout(performScroll, 100);
            setTimeout(performScroll, 300);
          });
        });
        setTimeout(() => {
          sessionStorage.removeItem(SCROLL_POSITION_KEY);
        }, 1000);
      } else {
        const performReset = () => {
          const mainElement = document.querySelector('main');
          if (mainElement) mainElement.scrollTop = 0;
          window.scrollTo(0, 0);
        };
        requestAnimationFrame(performReset);
        setTimeout(performReset, 100);
      }
    }
  }, [loading, homeData.shops]);

  useEffect(() => {
    const handleNavigationEvent = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a') || target.closest('button') || target.closest('[role="button"]') || target.closest('.cursor-pointer')) {
        saveScrollPosition();
      }
    };
    window.addEventListener('click', handleNavigationEvent, { capture: true });
    window.addEventListener('touchstart', handleNavigationEvent, { capture: true, passive: true });
    return () => {
      window.removeEventListener('click', handleNavigationEvent, { capture: true });
      window.removeEventListener('touchstart', handleNavigationEvent, { capture: true });
    };
  }, []);

  const getFilteredProducts = (tabId: string) => {
    if (tabId === "all") return products;
    return products.filter(
      (p) => p.categoryId === tabId || (p.category && (p.category._id === tabId || p.category.slug === tabId))
    );
  };

  const filteredProducts = useMemo(() => getFilteredProducts(activeTab), [activeTab, products]);

  if (loading && !products.length) return <PageLoader />;

  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
        <p className="text-gray-600 mb-6 max-w-xs">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors">Try Refreshing</button>
      </div>
    );
  }

  const selectedPincode = getStoredPincode();
  // We no longer hide entire categories based on pincode, 
  // because we want global visibility for all categories.
  const isCategoryUnavailable = false; 

  return (
    <div className="bg-white min-h-screen pb-20 md:pb-0" ref={contentRef}>
      <HomeHero activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="w-full relative z-10 mt-2">
        <BannerCarousel mode={deliveryMode} />
      </div>

      {/* Quick Delivery Section — hidden for universal categories (electronics, beauty, fashion) */}
      <QuickDeliverySection activeTab={activeTab} />

      {/* isCategoryUnavailable is now always false to allow global browsing */}
      {false ? (
        <ComingSoon />
      ) : (
        <div
          className={`bg-neutral-50 space-y-5 md:space-y-8 transition-colors duration-500 ${deliveryMode === 'scheduled' ? 'mt-4 pt-4 md:mt-6 md:pt-6' : '-mt-2 pt-1 md:pt-4'
            }`}
          style={{ backgroundColor: currentTheme.pageBg || '' }}
        >

          {homeData.homeSections && homeData.homeSections.length > 0 && (
            <>
              {homeData.homeSections
                .filter((section: any) => {
                  const title = section.title?.toLowerCase() || '';
                  const slug = section.categorySlug?.toLowerCase() || '';

                  // Determine deliveryType: use section field if present, fallback to keyword heuristic
                  const scheduledKeywords = ['fashion', 'electronics', 'beauty', 'makeup', 'cosmetic', 'wedding', 'sports', 'lux', 'home-decor', 'mobile'];
                  const isScheduledByKeyword = scheduledKeywords.some(word => title.includes(word) || slug.includes(word));

                  const sectionDeliveryType = section.deliveryType || (isScheduledByKeyword ? 'scheduled' : 'quick');

                  if (deliveryMode === 'quick') {
                    if (sectionDeliveryType === 'scheduled') return false;
                  } else if (deliveryMode === 'scheduled') {
                    if (sectionDeliveryType !== 'scheduled') return false;
                  }
                  const forbidden = ['non veg', 'meat', 'fish', 'chicken', 'egg', 'pet care', 'pharma', 'wellness', 'cleaning', 'office', 'baby care', 'personal care', 'wash', 'sanitary'];
                  if (forbidden.some(word => title.includes(word) || slug.includes(word))) return false;

                  return true;
                })
                .map((section: any) => {
                  const filteredData = (section.data || []).filter((tile: any) => {
                    const name = (tile.name || '').toLowerCase();
                    const forbidden = ['non veg', 'meat', 'fish', 'chicken', 'egg', 'pharma', 'pet care', 'baby care', 'cleaning', 'office', 'wellness', 'personal care', 'wash', 'sanitary'];
                    return !forbidden.some(word => name.includes(word));
                  });
                  if (filteredData.length === 0) return null;
                  const cols = Number(section.columns) || 4;
                  if (section.displayType === "products") {
                    const gridClass = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 6: "grid-cols-6", 8: "grid-cols-8" }[cols] || "grid-cols-4";
                    const gapClass = deliveryMode === 'scheduled' ? (cols >= 4 ? "gap-4 md:gap-5" : "gap-6 md:gap-8") : (cols >= 4 ? "gap-2" : "gap-3 md:gap-4");
                    return (
                      <div key={section.id} className="mt-6 mb-6 md:mt-8 md:mb-8">
                        {section.title && <h2 className="text-lg md:text-2xl font-semibold text-neutral-900 mb-3 md:mb-6 px-4 md:px-6 lg:px-8 tracking-tight capitalize">{section.title}</h2>}
                        <div className="px-4 md:px-6 lg:px-8">
                          <div className={`grid ${gridClass} ${gapClass}`}>
                            {filteredData.map((p: any) => (
                              <ProductCard key={p.id || p._id} product={p} categoryStyle={true} showBadge={true} showPackBadge={false} showStockInfo={false} compact={cols >= 4} />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return <CategoryTileSection key={section.id} title={section.title} tiles={filteredData} columns={cols as 2 | 3 | 4 | 6 | 8} showProductCount={false} />;
                })}
            </>
          )}

          {activeTab !== "all" && filteredProducts.length > 0 && (
            <div className="mt-6 mb-6 md:mt-8 md:mb-8">
              <h2 className="text-lg md:text-2xl font-semibold text-neutral-900 mb-3 md:mb-6 px-4 md:px-6 lg:px-8 tracking-tight capitalize">{activeTab === "grocery" ? "Grocery Items" : activeTab}</h2>
              <div className="px-4 md:px-6 lg:px-8">
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                  {filteredProducts
                    .filter(p => !['non veg', 'meat', 'fish', 'chicken', 'egg'].some(w => (p.name || '').toLowerCase().includes(w)))
                    .map((p) => <ProductCard key={p.id} product={p} categoryStyle={true} showBadge={true} showPackBadge={false} showStockInfo={true} />)}
                </div>
              </div>
            </div>
          )}

          {activeTab === "all" && (
            <>
              <div className="mb-6 mt-6 md:mb-8 md:mt-8">
                <h2 className="text-lg md:text-2xl font-semibold text-neutral-900 mb-3 md:mb-6 px-4 md:px-6 lg:px-8 tracking-tight">Shop by Store</h2>
                <div className="px-4 md:px-6 lg:px-8">
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 md:gap-4">
                    {(homeData.shops || [])
                      .filter((tile: any) => !['pharma', 'pet', 'gift', 'spiritual', 'sport', 'book', 'toy', 'meat', 'chicken', 'fish', 'egg', 'non veg', 'baby', 'wellness', 'fitness'].some(w => (tile.name || '').toLowerCase().includes(w)))
                      .map((tile: any) => {
                        const hasImages = tile.image || (tile.productImages && tile.productImages.filter(Boolean).length > 0);
                        return (
                          <div key={tile.id} className="flex flex-col">
                            <div
                              onClick={() => { const slug = tile.slug || tile.id.replace("-store", ""); saveScrollPosition(); navigate(`/store/${slug}`); }}
                              className="block bg-[#F2F7FF] rounded-2xl shadow-sm border border-neutral-100 hover:shadow-md transition-all cursor-pointer overflow-hidden aspect-square p-0"
                            >
                              {hasImages ? (
                                <img
                                  src={tile.image || tile.productImages?.[0] || ""}
                                  alt={tile.name}
                                  className="w-full h-full object-contain rounded-2xl"
                                />
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center text-2xl text-neutral-300 ${tile.bgColor || "bg-neutral-50"}`}>
                                  {tile.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="mt-1.5 text-center px-0.5">
                              <span className="text-[10px] md:text-[11px] font-semibold text-neutral-900 line-clamp-2 leading-tight">{tile.name}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      <LuckySpin 
        isOpen={showLuckySpin} 
        onClose={() => setShowLuckySpin(false)} 
        autoOpened={true}
        config={spinnerConfig}
      />

      <button
        type="button"
        onClick={() => navigate("/spin-wheel")}
        className="fixed bottom-24 right-4 sm:right-6 z-[60] flex items-center gap-2 rounded-full bg-emerald-600 text-white px-4 py-3 shadow-lg hover:bg-emerald-700 active:bg-emerald-800"
        aria-label="Open Spin & Win"
      >
        <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/15">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3v3" />
            <path d="M21 12h-3" />
            <path d="M12 21v-3" />
            <path d="M3 12h3" />
          </svg>
        </span>
        <span className="text-sm font-semibold leading-none">Spin &amp; Win</span>
      </button>

      {/* Refer & Earn floating button */}
      <button
        type="button"
        onClick={() => navigate("/refer-earn")}
        className="fixed bottom-40 right-4 sm:right-6 z-[60] flex items-center gap-2 rounded-full bg-teal-600 text-white px-4 py-3 shadow-lg hover:bg-teal-700 active:bg-teal-800"
        aria-label="Refer & Earn"
      >
        <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/15 text-lg">🎁</span>
        <span className="text-sm font-semibold leading-none">Refer &amp; Earn</span>
      </button>
    </div>
  );
}
