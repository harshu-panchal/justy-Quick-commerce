import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getProducts } from '../../../services/api/customerProductService';
import { useDeliveryMode } from '../../../hooks/useDeliveryMode';

interface FeaturedCard {
  id: string;
  type: 'newly-launched' | 'price-drop' | 'plum-cakes' | 'featured';
  title?: string;
  categoryId?: string;
  bgColor: string;
  borderColor: string;
}

const featuredCards: FeaturedCard[] = [
  {
    id: 'newly-launched',
    type: 'newly-launched',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  {
    id: 'price-drop',
    type: 'price-drop',
    title: 'PRICE DROP',
    bgColor: 'bg-blue-900',
    borderColor: 'border-blue-500',
  },
  {
    id: 'plum-cakes',
    type: 'plum-cakes',
    title: 'Plum Cakes',
    bgColor: 'bg-red-900',
    borderColor: 'border-white',
  },
  {
    id: 'fresh-arrivals',
    type: 'featured',
    title: 'Fresh Arrivals',
    categoryId: 'fruits-veg',
    bgColor: 'bg-green-600',
    borderColor: 'border-green-400',
  },
];

export default function FeaturedThisWeek() {
  const { deliveryMode } = useDeliveryMode();
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [newlyLaunchedProducts, setNewlyLaunchedProducts] = useState<any[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await getProducts({ limit: 12 });
        if (res.success && res.data) {
          const forbidden = ['non veg', 'meat', 'fish', 'chicken', 'egg', 'pharma', 'pet', 'baby', 'cleaning', 'office'];
          const filtered = res.data.filter((product: any) => {
            const name = (product.name || '').toLowerCase();
            const desc = (product.description || '').toLowerCase();
            return !forbidden.some(word => name.includes(word) || desc.includes(word));
          });
          setNewlyLaunchedProducts(filtered.slice(0, 6));
        }
      } catch (e) {
        console.error(e);
        const fruitList = [
          { id: '1', name: 'Papaya', emoji: '🥭' },
          { id: '2', name: 'Apple', emoji: '🍎' },
          { id: '3', name: 'Banana', emoji: '🍌' },
          { id: '4', name: 'Mango', emoji: '🥭' },
          { id: '5', name: 'Orange', emoji: '🍊' },
          { id: '6', name: 'Guava', emoji: '🍈' },
        ];
        setNewlyLaunchedProducts(fruitList);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (newlyLaunchedProducts.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentProductIndex((prev) => (prev + 1) % newlyLaunchedProducts.length);
      }, 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [newlyLaunchedProducts.length]);

  return (
    <div className="mb-6 mt-6">
      <h2 className="text-lg font-semibold text-neutral-900 mb-3 px-4 tracking-tight">
        Featured this week
      </h2>
      <div className="px-4">
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-4 px-4 scroll-smooth">
          {deliveryMode === 'quick' ? (
            <>
              <div className="flex-shrink-0 w-[110px]">
                {/* Newly Launched Card */}
                <div className="bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-50 border-2 border-yellow-300 rounded-2xl overflow-hidden relative h-48 shadow-lg hover:shadow-xl transition-shadow">
                  {/* ... contents ... */}
                  <div className="absolute top-0 left-0 right-0 z-20">
                    <div className="bg-gradient-to-r from-red-600 via-orange-500 to-red-600 rounded-b-3xl px-3 py-2 text-center shadow-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                      <div className="text-white text-[9px] font-black uppercase leading-tight tracking-wider relative z-10">
                        <div>NEWLY</div>
                        <div>LAUNCHED</div>
                      </div>
                    </div>
                  </div>
                  <div className="relative h-32 mt-10 overflow-hidden bg-yellow-50">
                    {newlyLaunchedProducts.map((product, idx) => (
                      <div
                        key={`${product.id || idx}`}
                        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${idx === currentProductIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                      >
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-2" />
                        ) : (
                          <div className="text-5xl">{('emoji' in product && product.emoji) || '🍎'}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 w-[110px]">
                <Link to="/category/snacks" className="block bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 border-2 border-blue-400 rounded-2xl overflow-hidden relative h-48 shadow-lg group">
                  <div className="flex items-center justify-center h-full text-center">
                    <div className="text-yellow-400 text-2xl font-black">PRICE DROP</div>
                  </div>
                </Link>
              </div>

              <div className="flex-shrink-0 w-[110px]">
                <Link to="/category/biscuits-bakery" className="block bg-gradient-to-br from-red-900 via-red-800 to-red-900 border-2 border-white/30 rounded-2xl overflow-hidden relative h-48 shadow-lg group">
                  <div className="flex items-center justify-center h-full text-center">
                    <div className="text-white text-xl font-black">Plum Cakes</div>
                  </div>
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Scheduled Mode Featured items */}
              <div className="flex-shrink-0 w-[110px]">
                <Link to="/category/fashion" className="block bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 border-2 border-purple-400 rounded-2xl overflow-hidden relative h-48 shadow-lg group">
                  <div className="flex flex-col items-center justify-center h-full text-center px-2">
                    <div className="text-3xl mb-2">👕</div>
                    <div className="text-white text-sm font-black">Fashion Picks</div>
                  </div>
                </Link>
              </div>
              <div className="flex-shrink-0 w-[110px]">
                <Link to="/category/electronics" className="block bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-gray-400 rounded-2xl overflow-hidden relative h-48 shadow-lg group">
                  <div className="flex flex-col items-center justify-center h-full text-center px-2">
                    <div className="text-3xl mb-2">🎧</div>
                    <div className="text-white text-sm font-black">Electronics Deals</div>
                  </div>
                </Link>
              </div>
              <div className="flex-shrink-0 w-[110px]">
                <Link to="/category/beauty" className="block bg-gradient-to-br from-pink-900 via-pink-800 to-pink-900 border-2 border-pink-400 rounded-2xl overflow-hidden relative h-48 shadow-lg group">
                  <div className="flex flex-col items-center justify-center h-full text-center px-2">
                    <div className="text-3xl mb-2">💄</div>
                    <div className="text-white text-sm font-black">Beauty Products</div>
                  </div>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
