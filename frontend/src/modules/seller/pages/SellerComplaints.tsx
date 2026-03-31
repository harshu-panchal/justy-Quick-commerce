import React from 'react';

export default function SellerComplaints() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
        <h1 className="text-xl font-bold text-gray-800">Complaints</h1>
        <p className="text-sm text-gray-500">View and resolve issues raised by your customers.</p>
      </div>

      <div className="bg-white py-20 flex flex-col items-center justify-center text-center space-y-4 rounded-lg shadow-sm border border-neutral-200">
        <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-4xl shadow-inner animate-pulse">
            🎉
        </div>
        <div className="space-y-2 max-w-sm px-6">
            <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">No Pending Complaints</h2>
            <p className="text-gray-500 text-sm italic">
                Excellent! You have zero pending customer complaints. Your dedication to quality and service is clearly showing!
            </p>
        </div>
        <button className="px-8 py-3 bg-teal-600 font-bold text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm uppercase tracking-widest text-sm">
            View Resolved History
        </button>
      </div>
    </div>
  );
}
