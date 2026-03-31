import React from 'react';

const offers = [
    { label: 'Buy 1 Get 1 Free', icon: '🎁', desc: 'Boost order volume by offering every second dish for free.', active: true },
    { label: 'Flat 20% OFF', icon: '🏷️', desc: 'Attract new customers with a clear price slash across your menu.', active: false },
    { label: 'Ad Campaign', icon: '📣', desc: 'Appear at the top of customer searches and gain 3x more visibility.', active: false },
];

export default function SellerGrowth() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
        <h1 className="text-xl font-bold text-gray-800">Growth Hub</h1>
        <p className="text-sm text-gray-500">Tools to help you grow your business and reach more customers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {offers.map((offer, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200 flex flex-col items-center text-center space-y-4 hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center text-3xl">
              {offer.icon}
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-800 uppercase">{offer.label}</h3>
              <p className="text-sm text-gray-500">{offer.desc}</p>
            </div>
            <button className={`w-full py-2 rounded-lg font-bold text-sm transition-colors ${
              offer.active ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}>
              {offer.active ? 'Deactivate' : 'Activate Now'}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-teal-700 rounded-lg p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md border border-teal-800">
        <div className="space-y-3 max-w-xl">
          <h2 className="text-2xl font-bold">Exclusive Partners Program</h2>
          <p className="text-teal-50 opacity-90 text-sm">
            Join our exclusive partners program and get featured placements on the home screen during peak hours. 
            Sellers in this program see an average increase of 35% in weekend orders.
          </p>
          <button className="px-6 py-2 bg-white text-teal-700 font-bold rounded-lg hover:bg-teal-50 transition-colors shadow-sm">
            Learn More
          </button>
        </div>
        <div className="w-full max-w-xs bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex justify-between items-end gap-2 h-24">
            {[40, 70, 45, 90, 60, 100].map((h, i) => (
              <div key={i} className="flex-1 bg-white/30 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
          <p className="text-[10px] text-center mt-2 font-bold uppercase tracking-widest text-teal-100">Visibility Growth Forecast</p>
        </div>
      </div>
    </div>
  );
}
