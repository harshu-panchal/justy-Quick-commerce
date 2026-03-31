import React from 'react';

const ratings = [
    { name: 'Sameer Singh', stars: 5, date: 'Oct 15, 2026', comment: 'Wonderful quality and hot packaging! Every piece of paneer was so soft and fresh. Highly recommended.', dishes: 'Special Paneer Tikka' },
    { name: 'Kavita Mishra', stars: 5, date: 'Oct 14, 2026', comment: 'Very timely delivery and authentic taste. The butter naan was still soft when it arrived. Amazing job!', dishes: 'Butter Naan, Special Thali' },
    { name: 'Nalin Shah', stars: 4, date: 'Oct 12, 2026', comment: 'Loved the food but could use just a bit more spice level. Still better than most places I\'ve tried.', dishes: 'Veg Manchurian' },
];

export default function SellerRatings() {
  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Header & Overall Score */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white p-8 rounded-lg shadow-sm border border-neutral-200">
        <div className="space-y-2">
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight uppercase">STORE RATINGS</h1>
            <p className="text-neutral-500 font-bold max-w-sm">Every rating tells a story. Use customer feedback to refine your craft.</p>
        </div>
        
        <div className="flex items-center gap-10 flex-wrap">
            <div className="text-center space-y-1">
                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1 leading-none transition-all">OVERALL RATING</p>
                <div className="flex flex-col items-center">
                    <span className="text-6xl font-black tracking-tight leading-none text-neutral-900">4.8</span>
                    <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map(s => (
                            <svg key={s} className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        ))}
                    </div>
                </div>
            </div>
            <div className="w-px h-16 bg-neutral-100 hidden sm:block" />
            <div className="flex-1 min-w-[200px] space-y-2">
                {[5, 4, 3, 2, 1].map((s, i) => (
                    <div key={s} className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-neutral-400 w-4">{s}★</span>
                        <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${90 - i * 15}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Reviews Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {ratings.map((rating, index) => (
             <div key={index} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 space-y-6 hover:shadow-md transition-shadow">
                 <div className="flex justify-between items-start">
                     <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-neutral-50 border border-neutral-100 rounded-full flex items-center justify-center text-lg font-black text-teal-600">
                             {rating.name.charAt(0)}
                         </div>
                         <div className="space-y-0.5">
                             <h3 className="text-base font-black text-neutral-900 uppercase leading-none">{rating.name}</h3>
                             <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{rating.date}</p>
                         </div>
                     </div>
                     <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100 text-yellow-600 text-xs font-black">
                         {rating.stars}★
                     </div>
                 </div>
                 
                 <div className="space-y-3">
                     <p className="text-neutral-600 font-bold text-sm leading-relaxed italic">"{rating.comment}"</p>
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">DISHES:</span>
                        <span className="text-xs font-black text-teal-600 uppercase">{rating.dishes}</span>
                     </div>
                 </div>
                 
                 <div className="pt-2 border-t border-neutral-50 flex justify-end">
                    <button className="flex items-center gap-1 text-[10px] font-black text-neutral-400 hover:text-teal-600 transition-colors uppercase tracking-widest">
                       Post Reply
                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                       </svg>
                    </button>
                 </div>
             </div>
           ))}
      </div>
    </div>
  );
}
