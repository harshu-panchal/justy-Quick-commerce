import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import HomeHero from "./components/HomeHero";
import HomeHeroCarousel from "./components/HomeHeroCarousel";
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

import { useThemeContext } from "../../context/ThemeContext";
import { useDeliveryMode } from "../../hooks/useDeliveryMode";

export default function Home() {
  const navigate = useNavigate();
  const { location } = useLocation();
  const { activeCategory, setActiveCategory, currentTheme } = useThemeContext();
  const { deliveryMode } = useDeliveryMode();
  const { startRouteLoading, stopRouteLoading } = useLoading();
  const activeTab = activeCategory;
  const setActiveTab = setActiveCategory;
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollHandledRef = useRef(false);
  const SCROLL_POSITION_KEY = 'home-scroll-position';

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
  });

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
          location?.latitude,
          location?.longitude
        );
        if (response.success && response.data) {
          setHomeData(response.data);
          if (response.data.bestsellers) {
            setProducts(response.data.bestsellers);
          }
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
  }, [location?.latitude, location?.longitude, activeTab]);

  useEffect(() => {
    const preloadHeaderCategories = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const headerCategories = await getHeaderCategoriesPublic(true);
        const slugsToPreload = ['all', ...headerCategories.map(cat => cat.slug)];
        const batchSize = 2;
        for (let i = 0; i < slugsToPreload.length; i += batchSize) {
          const batch = slugsToPreload.slice(i, i + batchSize);
          await Promise.all(
            batch.map(slug =>
              getHomeContent(
                slug,
                location?.latitude,
                location?.longitude,
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
  }, [location?.latitude, location?.longitude]);

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
  const isCategoryUnavailable = activeTab !== "all" && selectedPincode && !isCategoryAvailable(activeTab, selectedPincode);

  return (
    <div className="bg-white min-h-screen pb-20 md:pb-0" ref={contentRef}>
      <HomeHero activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="w-full relative z-10 mt-2">
        <HomeHeroCarousel />
      </div>

      {/* Quick Delivery Section — hidden for universal categories (electronics, beauty, fashion) */}
      <QuickDeliverySection activeTab={activeTab} />

      {isCategoryUnavailable ? (
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

                  // Known scheduled keywords
                  const scheduledKeywords = ['fashion', 'electronics', 'beauty', 'makeup', 'cosmetic', 'wedding', 'sports', 'lux', 'home-decor', 'mobile'];
                  const isScheduled = scheduledKeywords.some(word => title.includes(word) || slug.includes(word));

                  if (deliveryMode === 'quick') {
                    if (isScheduled) return false;
                  } else if (deliveryMode === 'scheduled') {
                    if (!isScheduled) return false;
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
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-4">
                    {(homeData.shops || [])
                      .filter((tile: any) => !['pharma', 'pet', 'gift', 'spiritual', 'sport', 'book', 'toy', 'meat', 'chicken', 'fish', 'egg', 'non veg', 'baby', 'wellness', 'fitness'].some(w => (tile.name || '').toLowerCase().includes(w)))
                      .map((tile: any) => {
                        const hasImages = tile.image || (tile.productImages && tile.productImages.filter(Boolean).length > 0);
                        return (
                          <div key={tile.id} className="flex flex-col">
                            <div
                              onClick={() => { const slug = tile.slug || tile.id.replace("-store", ""); saveScrollPosition(); navigate(`/store/${slug}`); }}
                              className="block bg-white rounded-full shadow-sm border border-neutral-200 hover:shadow-md transition-all cursor-pointer overflow-hidden aspect-square p-1.5"
                            >
                              {hasImages ? (
                                <img
                                  src={tile.image || tile.productImages?.[0] || ""}
                                  alt={tile.name}
                                  className="w-full h-full object-contain rounded-full"
                                />
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center text-2xl text-neutral-300 ${tile.bgColor || "bg-neutral-50"}`}>
                                  {tile.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="mt-1.5 text-center">
                              <span className="text-xs font-semibold text-neutral-900 line-clamp-2 leading-tight">{tile.name}</span>
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
    </div>
  );
}
