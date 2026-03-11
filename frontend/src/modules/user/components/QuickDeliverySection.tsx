import React from 'react';
import { useQuickDelivery } from '../../../hooks/useQuickDelivery';
import ProductCard from './ProductCard';
import { useDeliveryMode } from '../../../hooks/useDeliveryMode';

interface QuickDeliverySectionProps {
    activeTab?: string;
}

const QuickDeliverySection: React.FC<QuickDeliverySectionProps> = ({ activeTab = 'all' }) => {
    const { loading, available, products, pincode } = useQuickDelivery();
    const { deliveryMode } = useDeliveryMode();

    if (deliveryMode === 'scheduled') return null;

    // No pincode detected: hide silently
    if (!pincode) return null;

    if (loading) {
        return (
            <div className="px-4 md:px-6 lg:px-8 mt-4 animate-pulse">
                <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
                <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="min-w-[150px] h-[220px] bg-gray-100 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    // No local sellers: hide silently (full-page ComingSoon in Home.tsx handles pincode-restricted tabs)
    if (!available || products.length === 0) return null;

    return (
        <div className="mt-6 md:mt-8">
            <div className="px-4 md:px-6 lg:px-8 flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="bg-yellow-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded leading-none uppercase tracking-tighter">
                        Quick
                    </div>
                    <h2 className="text-lg md:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-1.5">
                        ⚡ 15-Min Delivery
                    </h2>
                </div>
            </div>

            <div className="relative">
                <div className="flex overflow-x-auto pb-4 px-4 md:px-6 lg:px-8 gap-3 no-scrollbar scroll-smooth">
                    {products.map((product) => (
                        <div key={product._id} className="min-w-[140px] md:min-w-[180px] w-[140px] md:w-[180px]">
                            <ProductCard
                                product={product}
                                categoryStyle={true}
                                showBadge={true}
                                compact={true}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuickDeliverySection;
