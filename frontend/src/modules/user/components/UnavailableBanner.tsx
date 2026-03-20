import React, { useState } from 'react';

interface UnavailableBannerProps {
    pincode: string;
    context?: 'section' | 'page';
}

const UnavailableBanner: React.FC<UnavailableBannerProps> = ({ pincode, context = 'section' }) => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;
 
    return (
        <div className={`mx-4 md:mx-6 lg:mx-8 mb-6 animate-in fade-in slide-in-from-top-4 duration-500`}>
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 md:p-6 shadow-sm relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-200/20 rounded-full blur-2xl"></div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-start gap-4">
                        <div className="bg-white p-2.5 rounded-xl shadow-sm text-2xl flex-shrink-0">
                            📍
                        </div>
                        <div>
                            <h3 className="text-emerald-900 font-bold text-lg leading-tight">
                                Quick Delivery is coming soon to {pincode}!
                            </h3>
                            <p className="text-emerald-700/80 text-sm mt-1">
                                We've recorded your demand for this area! We'll notify you as soon as we're live.
                            </p>
                        </div>
                    </div>
 
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsVisible(false)}
                            className="p-2.5 text-emerald-800/40 hover:text-emerald-800 hover:bg-emerald-100 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnavailableBanner;
