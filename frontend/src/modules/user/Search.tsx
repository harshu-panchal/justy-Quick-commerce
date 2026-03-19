import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductCard from './components/ProductCard';
import CategoryTileSection from './components/CategoryTileSection';
import { getProducts } from '../../services/api/customerProductService';
import { getHomeContent } from '../../services/api/customerHomeService';
import { getCategories } from '../../services/api/categoryService';
import { Product } from '../../types/domain';
import { useLocation } from '../../hooks/useLocation';
import { useDeliveryMode } from '../../hooks/useDeliveryMode';
import EmptyState from '../../components/EmptyState';

export default function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { location } = useLocation();
  const { deliveryMode } = useDeliveryMode();
  const searchQuery = searchParams.get('q') || '';
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [trendingItems, setTrendingItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cookingIdeas, setCookingIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(true);

  // Fetch products based on search query
  useEffect(() => {
    const fetchProducts = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const params: any = { search: searchQuery };
        // Include user location for seller service radius filtering
        if (location?.latitude && location?.longitude) {
          params.latitude = location.latitude;
          params.longitude = location.longitude;
        }
        const response = await getProducts(params);
        setSearchResults(response.data as unknown as Product[]);
      } catch (error) {
        console.error('Error searching products:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery, location]);

  // Fetch trending/home content and categories for initial view
  useEffect(() => {
    const fetchInitialContent = async () => {
      try {
        const [homeResponse, categoryResponse] = await Promise.all([
          getHomeContent(undefined, location?.latitude, location?.longitude),
          getCategories()
        ]);

        if (homeResponse.success && homeResponse.data) {
          setTrendingItems(homeResponse.data.trending || []);
          setCookingIdeas(homeResponse.data.cookingIdeas || []);
        }

        if (categoryResponse.success && categoryResponse.data) {
          // Filter categories by delivery mode if needed, or show all
          setCategories(categoryResponse.data.filter(c => !c.parentId));
        }
      } catch (error) {
        console.error("Error fetching search initial content", error);
      } finally {
        setContentLoading(false);
      }
    };

    if (!searchQuery.trim()) {
      fetchInitialContent();
    }
  }, [searchQuery, location?.latitude, location?.longitude]);

  // Format trending items for CategoryTileSection
  const trendingTiles = useMemo(() => {
    return trendingItems.map(item => ({
      id: item.id || item._id,
      name: item.name || item.title,
      image: item.image || item.imageUrl,
      type: item.type === 'category' ? 'category' as const : 'product' as const,
      productId: item.type === 'product' ? (item.id || item._id) : undefined,
      categoryId: item.type === 'category' ? (item.id || item._id) : undefined,
    }));
  }, [trendingItems]);

  // Format categories for CategoryTileSection
  const categoryTiles = useMemo(() => {
    return categories.map(cat => ({
      id: cat._id,
      name: cat.name,
      image: cat.image,
      type: 'category' as const,
      categoryId: cat._id,
      slug: cat.slug || cat._id
    }));
  }, [categories]);

  return (
    <div className="pb-24 md:pb-12 bg-white min-h-screen font-outfit">

      {/* Search Results */}
      {searchQuery.trim() && (
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-10 py-4 md:py-8">
          <div className="flex items-center justify-between mb-4 md:mb-8">
            <h2 className="text-xl md:text-3xl font-bold text-neutral-900 tracking-tight">
              Search Results {searchResults.length > 0 && <span className="text-neutral-400 font-medium ml-2">({searchResults.length})</span>}
            </h2>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
              <p className="text-neutral-500 font-medium animate-pulse">Searching for "{searchQuery}"...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-6">
              {searchResults.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  categoryStyle={true}
                  showBadge={true}
                  showPackBadge={false}
                  showStockInfo={true}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-16">
              <EmptyState 
                title="No products found"
                description={`We couldn't find any products matching "${searchQuery}". Please try a different search term or browse our categories.`}
                buttonText="Browse Categories"
                onButtonClick={() => navigate("/category/all")}
              />
            </div>
          )}
        </div>
      )}

      {/* Initial View: Categories & Trending */}
      {!searchQuery.trim() && (
        <div className="max-w-[1440px] mx-auto py-4 md:py-8 space-y-8 md:space-y-12">
          {contentLoading ? (
            <div className="flex justify-center py-24">
              <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Shop by Category - New prominent section */}
              {categoryTiles.length > 0 && (
                <CategoryTileSection 
                  title="Shop by Category" 
                  tiles={categoryTiles} 
                  columns={4} // This will be 4 on mobile, 10 on desktop via getGridCols refactor in CategoryTileSection
                />
              )}

              {/* Trending in your city - Refined compact grid */}
              {trendingTiles.length > 0 && (
                <div className="space-y-4 md:space-y-6">
                   <h2 className="text-lg md:text-2xl font-bold text-neutral-900 px-4 md:px-6 lg:px-8 tracking-tight">
                    Trending in your city
                  </h2>
                  <div className="px-4 md:px-6 lg:px-8">
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 md:gap-4">
                      {trendingTiles.map((tile) => (
                        <div 
                          key={tile.id} 
                          className="flex flex-col items-center gap-1.5 cursor-pointer group"
                          onClick={() => navigate(tile.type === 'category' ? `/category/${tile.categoryId}` : `/product/${tile.productId}`)}
                        >
                          <div className="aspect-square w-full rounded-2xl bg-neutral-50 border border-neutral-100 p-2 flex items-center justify-center overflow-hidden group-hover:shadow-md transition-all group-hover:scale-105 active:scale-95">
                            {tile.image ? (
                              <img src={tile.image} alt={tile.name} className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-2xl">🔥</span>
                            )}
                          </div>
                          <span className="text-[10px] md:text-[11px] font-semibold text-neutral-800 text-center line-clamp-2 leading-tight">
                            {tile.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Cooking ideas - Premium layout */}
              {cookingIdeas.length > 0 && (
                <div className="space-y-4 md:space-y-6">
                  <h2 className="text-lg md:text-2xl font-bold text-neutral-900 px-4 md:px-6 lg:px-8 tracking-tight">
                    Cooking ideas
                  </h2>
                  <div className="px-4 md:px-6 lg:px-8 pb-8">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                      {cookingIdeas.map((idea, idx) => (
                        <div 
                          key={idea.id || idx} 
                          className="relative group rounded-2xl overflow-hidden aspect-[4/3] bg-neutral-100 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500"
                          onClick={() => navigate(`/product/${idea.productId || idea.id}`)}
                        >
                          {idea.image && <img src={idea.image} alt={idea.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                          <div className="absolute bottom-3 left-3 right-3 text-white">
                            <h3 className="text-sm md:text-base font-bold line-clamp-2 leading-tight group-hover:text-emerald-300 transition-colors">{idea.title}</h3>
                          </div>
                          <button className="absolute top-3 right-3 w-9 h-9 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
