import React from 'react';

const helpCategories = [
    { label: 'SUPPORT TICKETS', icon: '🆘', desc: 'Raise a problem with your order or payment and track status.', color: 'from-blue-500 to-blue-600' },
    { label: 'CHAT WITH US', icon: '💬', desc: 'Need quick answers? Our support agents are available 24/7.', color: 'from-teal-500 to-teal-600' },
    { label: 'GUIDES & TRAINING', icon: '📚', desc: 'Learn how to use the partner portal and grow your sales.', color: 'from-green-500 to-green-600' },
];

export default function SellerHelp() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
        <h1 className="text-xl font-bold text-gray-800 tracking-tight uppercase leading-none">HELP & SUPPORT</h1>
        <p className="text-gray-500 text-sm mt-1">We are here to ensure your business runs smoothly. Find answers and get assistance whenever you need it.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {helpCategories.map((category, index) => (
             <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200 flex flex-col items-center text-center space-y-4 hover:shadow-md transition-shadow">
                 <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-3xl shadow-sm bg-neutral-50 text-teal-600 border border-neutral-100`}>
                    {category.icon}
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-base font-black text-neutral-900 uppercase tracking-tight leading-tight">{category.label}</h3>
                    <p className="text-neutral-500 font-bold text-[10px] leading-relaxed uppercase tracking-widest">{category.desc}</p>
                 </div>
                 <button className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-lg transition-all shadow-sm uppercase tracking-widest active:scale-95 outline-none">
                     START NOW
                 </button>
             </div>
           ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200 space-y-8 group overflow-hidden relative">
          <div className="flex items-center gap-4 relative z-10">
              <div className="w-1.5 h-10 bg-teal-600 rounded-full shadow-lg shadow-teal-200" />
              <h2 className="text-xl font-black text-neutral-900 tracking-tight uppercase">FREQUENTLY ASKED</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 relative z-10 px-6">
             {[
                'How do I update the price of a dish?',
                'When will I receive my daily payout?',
                'How to mark a dish as out of stock?',
                'What to do if a delivery partner is late?',
             ].map((q, i) => (
                <div key={i} className="flex gap-4 group/item cursor-pointer hover:bg-neutral-50 transition-colors p-3 rounded-lg border border-transparent hover:border-neutral-100">
                    <span className="text-lg font-black text-teal-600 opacity-30 group-hover/item:opacity-100 transition-opacity">0{i+1}</span>
                    <div className="space-y-1">
                        <p className="text-sm font-black text-neutral-800 uppercase tracking-tight group-hover/item:text-teal-600 transition-colors">{q}</p>
                        <p className="text-[10px] font-bold text-neutral-400 group-hover/item:text-neutral-500 transition-colors uppercase leading-none mt-1">6 min read • 248 helpful</p>
                    </div>
                </div>
             ))}
          </div>
          
          <div className="flex justify-center pt-4 relative z-10 border-t border-neutral-50">
              <button className="flex items-center gap-2 text-[10px] font-black text-neutral-400 hover:text-neutral-900 transition-colors uppercase tracking-widest underline underline-offset-4 decoration-2">
                  View full knowledge base
              </button>
          </div>
      </div>
    </div>
  );
}
