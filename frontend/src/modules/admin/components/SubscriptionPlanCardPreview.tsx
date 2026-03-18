import React from 'react';

interface SubscriptionPlanCardPreviewProps {
  name: string;
  price: number;
  interval: string;
  description: string;
  features: string[];
  cardColor: string;
  type?: string;
}

const SubscriptionPlanCardPreview: React.FC<SubscriptionPlanCardPreviewProps> = ({
  name,
  price,
  interval,
  description,
  features,
  cardColor,
  type
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Live Customer Preview</p>
      <h3 className="text-2xl font-bold text-gray-800 mb-8">Review Your Plan Design</h3>
      
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-blue-100">
        {/* Header Section */}
        <div 
          className="relative p-8 text-white flex flex-col items-center justify-center min-h-[220px]"
          style={{ background: cardColor }}
        >
          {type && (
            <span className="absolute top-4 right-6 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight">
              {type} PRO
            </span>
          )}
          
          <h4 className="text-xl font-semibold mb-4">{name || 'Plan Name'}</h4>
          
          <div className="flex items-baseline mb-4">
            <span className="text-2xl font-medium self-start mt-1">₹</span>
            <span className="text-6xl font-bold tracking-tighter">{price || '0'}</span>
            <span className="text-sm opacity-80 ml-1">/{interval === 'monthly' ? 'month' : 'year'}</span>
          </div>
          
          <p className="text-sm text-center opacity-90 max-w-[240px] leading-relaxed">
            {description || 'Perfect for scaling your digital store with premium tools.'}
          </p>
        </div>

        {/* Features Section */}
        <div className="p-8 bg-white">
          <ul className="space-y-4 mb-8">
            {features.length > 0 ? (
              features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-green-600">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">{feature}</span>
                  {index === 1 && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300 mt-1 cursor-help">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  )}
                </li>
              ))
            ) : (
              <>
                <li className="flex items-start gap-3 opacity-50">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-green-600">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">Feature one...</span>
                </li>
                <li className="flex items-start gap-3 opacity-50">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-green-600">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">Feature two...</span>
                </li>
              </>
            )}
          </ul>

          <button className="w-full py-4 bg-[#1a202c] text-white font-bold rounded-xl transition-all duration-300 hover:bg-black hover:shadow-lg active:scale-95 mb-4">
            Get Started Now
          </button>
          
          <p className="text-[10px] text-center text-gray-400">
            Cancel anytime. No hidden fees.
          </p>
        </div>
      </div>
      
      <p className="mt-8 text-xs text-center text-gray-400 italic">
        Preview adjustments can be made in the Plan Settings panel.
      </p>
    </div>
  );
};

export default SubscriptionPlanCardPreview;
