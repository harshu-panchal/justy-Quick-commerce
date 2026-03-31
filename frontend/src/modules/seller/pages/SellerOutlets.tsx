import React from 'react';

const outlets = [
    { name: 'Jyasti Kitchen - Gurgaon 45', address: 'Plot 120, Sector 45, Gurgaon', status: 'Online', phone: '98765 43210', active: true },
    { name: 'Jyasti Kitchen - DLF Phase 3', address: 'Opp. Cyber Hub, Gurugram', status: 'Closed', phone: '98765 43211', active: false },
];

export default function SellerOutlets() {
  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div className="space-y-2">
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight uppercase leading-none">OUTLET MANAGEMENT</h1>
            <p className="text-neutral-500 font-bold max-w-sm">Manage multiple restaurant outlets and your dedicated staff from a single centralized dashboard.</p>
        </div>
        <div className="flex bg-white p-4 rounded-lg shadow-sm border border-neutral-200 items-center divide-x divide-neutral-100 gap-6">
            <div className="flex flex-col items-end px-3">
                 <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">OPERATIONAL</p>
                 <p className="text-xl font-black text-green-600 leading-none">01 OUTLET</p>
            </div>
            <div className="flex flex-col items-end px-3">
                 <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">TOTAL STAFF</p>
                 <p className="text-xl font-black text-neutral-900 leading-none">12 MEMBERS</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {outlets.map((outlet, index) => (
             <div key={index} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 flex flex-col gap-6 hover:shadow-md transition-shadow relative group">
                 
                 <div className="flex justify-between items-start w-full">
                     <div className="flex gap-4 items-center">
                         <div className={`w-14 h-14 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-center text-3xl shadow-inner group-hover:bg-teal-600 group-hover:text-white transition-all transform group-hover:rotate-6`}>
                            🏪
                         </div>
                         <div className="space-y-1">
                             <h3 className="text-lg font-black text-neutral-900 uppercase tracking-tight leading-none">{outlet.name}</h3>
                             <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{outlet.address}</p>
                         </div>
                     </div>
                     <div className={`px-2 py-1 rounded-full text-[8px] font-black tracking-widest uppercase shadow-sm border border-transparent flex items-center gap-1.5
                         ${outlet.status === 'Online' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}
                     `}>
                        <div className={`w-1 h-1 rounded-full ${outlet.status === 'Online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        {outlet.status}
                     </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                     <div className="space-y-1">
                         <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">STAFF MEMBERS</p>
                         <p className="text-lg font-black text-neutral-800 leading-none">08 ACTIVE</p>
                     </div>
                     <div className="space-y-1">
                         <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">TODAY SALES</p>
                         <p className="text-lg font-black text-neutral-800 leading-none">₹8,450.00</p>
                     </div>
                 </div>
                 
                 <div className="flex gap-3 pt-4 border-t border-neutral-50">
                    <button className="flex-1 py-3 bg-teal-600 text-white font-black text-xs rounded-lg hover:bg-teal-700 transition-all shadow-md uppercase tracking-widest">
                        MANAGE OUTLET
                    </button>
                    <button className="px-6 py-3 bg-white text-neutral-800 font-black text-xs rounded-lg hover:border-teal-600 border border-neutral-200 transition-all shadow-sm uppercase tracking-widest flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4.354l-4 4-4-4M16.243 12h-8.486m0 0L12 8.354" />
                        </svg>
                        STAFF
                    </button>
                 </div>
             </div>
           ))}
           
           <div className="bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200 p-8 flex flex-col items-center justify-center text-center space-y-4 hover:bg-white hover:border-teal-600 transition-all cursor-pointer group">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-xl font-black text-neutral-300 shadow-md group-hover:bg-teal-600 group-hover:text-white transition-all transform group-hover:rotate-12">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                   </svg>
                </div>
                <div className="space-y-1">
                    <h3 className="text-base font-black text-neutral-800 uppercase tracking-tight group-hover:text-teal-600 transition-colors">ADD NEW OUTLET</h3>
                    <p className="text-[10px] font-bold text-neutral-400 group-hover:text-neutral-500 transition-colors uppercase mt-1">Scale your business across multiple locations</p>
                </div>
           </div>
      </div>
    </div>
  );
}
