import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getPublicOrderDetails } from '../../../services/api/orderService';
import IconLoader from '../../../components/loaders/IconLoader';

interface PublicOrderData {
  orderNumber: string;
  status: string;
  sellerName: string;
  items: Array<{
    productName: string;
    quantity: number;
    image?: string;
  }>;
  orderDate: string;
}

const PublicOrderView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const type = (searchParams.get('type') as 'ORDER' | 'EQUIPMENT') || 'ORDER';

  const [order, setOrder] = useState<PublicOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!id) return;
        const response = await getPublicOrderDetails(id, type);
        if (response.success) {
          setOrder(response.data);
        } else {
          setError(response.message || 'Failed to load order details');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, type]);

  if (loading) return <IconLoader forceShow />;

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-500 mb-8">{error || 'We couldn\'t find this order.'}</p>
          <Link to="/" className="inline-block bg-teal-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('deliver')) return 'text-green-600 bg-green-50';
    if (s.includes('cancel') || s.includes('reject')) return 'text-red-600 bg-red-50';
    if (s.includes('way') || s.includes('pick')) return 'text-teal-600 bg-teal-50';
    return 'text-orange-600 bg-orange-50';
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-12">
      {/* Premium Header */}
      <div className="bg-teal-600 pt-12 pb-24 px-6">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-white text-3xl font-black tracking-tighter">ORDER STATUS</h1>
            <p className="text-teal-100 text-sm font-bold opacity-80 uppercase tracking-widest mt-1">
              #{order.orderNumber}
            </p>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content Card */}
      <div className="px-6 -mt-16">
        <div className="max-w-md mx-auto bg-white rounded-[32px] shadow-2xl shadow-teal-900/5 overflow-hidden border border-gray-100">
          <div className="p-8">
            {/* Status Badge */}
            <div className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 ${getStatusColor(order.status)}`}>
              {order.status}
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Store / Merchant</p>
                <p className="text-xl font-black text-gray-900">{order.sellerName}</p>
              </div>

              <div className="h-px bg-gray-50 w-full"></div>

              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Package Contents</p>
                <div className="space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 group">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                        {item.image ? (
                          <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 leading-tight">{item.productName}</p>
                        <p className="text-sm text-gray-500 mt-0.5">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-gray-50 w-full"></div>

              <div className="flex justify-between items-center text-sm">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Order Date</p>
                  <p className="font-bold text-gray-700 mt-0.5">{new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Support</p>
                  <p className="font-bold text-teal-600 mt-0.5">Contact Help</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50/50 p-6 text-center border-t border-gray-50">
             <p className="text-[10px] text-gray-400 font-medium">This is a real-time status update provided by JYASTI Logistics.</p>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center px-6">
        <p className="text-gray-400 text-sm italic font-medium">"Builds Trust in 10 Minutes"</p>
        <div className="mt-4 flex justify-center gap-4 grayscale opacity-40">
           {/* Simple placeholders as logos */}
           <div className="font-black text-lg tracking-tighter text-gray-900">JYASTI</div>
        </div>
      </div>
    </div>
  );
};

export default PublicOrderView;
