import React from 'react';

const transactions = [
    { id: 'TXN-9823', date: 'Oct 14, 2026', amount: '₹1,240', status: 'Settled', type: 'Payout' },
    { id: 'TXN-9824', date: 'Oct 15, 2026', amount: '₹850', status: 'Processing', type: 'Order Credit' },
    { id: 'TXN-9825', date: 'Oct 16, 2026', amount: '₹4,500', status: 'Settled', type: 'Payout' },
    { id: 'TXN-9826', date: 'Oct 17, 2026', amount: '₹1,120', status: 'Settled', type: 'Order Credit' },
];

export default function SellerFinance() {
  return (
    <div className="space-y-6">
      {/* Balance Summary Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-teal-700 p-8 rounded-lg text-white shadow-md border border-teal-800 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
            <h1 className="text-xl font-bold tracking-tight uppercase">Finance Dashboard</h1>
            <p className="text-teal-50 opacity-80 text-sm max-w-sm">Track your earnings, payouts, and commission settlements in real-time.</p>
        </div>
        
        <div className="text-right space-y-1 relative z-10 w-full md:w-auto">
            <p className="text-[10px] font-black text-teal-200 uppercase tracking-widest mb-1 leading-none">CURRENT BALANCE</p>
            <div className="text-4xl font-black tracking-tight leading-none text-white mb-4">₹12,450.00</div>
            <button className="px-8 py-3 bg-white text-teal-700 font-bold text-sm rounded-lg hover:bg-teal-50 transition-all shadow-sm active:scale-95 uppercase tracking-widest">
                WITHDRAW NOW
            </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-2xl">💰</div>
              <div className="space-y-0.5">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">Gross Sales (Month)</p>
                  <h3 className="text-xl font-bold text-neutral-900 leading-none">₹84,500.00</h3>
              </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-2xl">📉</div>
              <div className="space-y-0.5">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">Deductions</p>
                  <h3 className="text-xl font-bold text-neutral-900 leading-none">₹6,420.00</h3>
              </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-2xl">🏪</div>
              <div className="space-y-0.5">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">Next Settlement</p>
                  <h3 className="text-xl font-bold text-neutral-900 leading-none uppercase">OCT 24</h3>
              </div>
          </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          <div className="bg-teal-600 px-6 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-tight uppercase">TRANSACTION HISTORY</h2>
              <button className="text-[10px] font-black text-teal-100 hover:text-white uppercase tracking-widest">Download Statement</button>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200">
                          <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">DATES</th>
                          <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">TXN ID</th>
                          <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">DETAILS</th>
                          <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-right">AMOUNTS</th>
                      </tr>
                  </thead>
                  <tbody>
                      {transactions.map((txn, index) => (
                          <tr key={index} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                              <td className="px-6 py-4 text-xs font-bold text-neutral-800 uppercase tracking-tight">{txn.date}</td>
                              <td className="px-6 py-4 text-xs font-black text-teal-600 uppercase">{txn.id}</td>
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                      <p className="text-xs font-black text-neutral-800 uppercase leading-none">{txn.type}</p>
                                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase border ${
                                          txn.status === 'Settled' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                                      }`}>
                                          {txn.status}
                                      </span>
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-right text-base font-black text-neutral-900 leading-none">{txn.amount}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
          <div className="p-4 bg-white border-t border-neutral-100 text-center">
              <button className="text-xs font-black text-teal-600 hover:underline uppercase tracking-widest">Load More Transactions</button>
          </div>
      </div>
    </div>
  );
}
