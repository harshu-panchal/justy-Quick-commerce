import React from 'react';
import { Reward } from './RewardForm';

interface RewardListProps {
  rewards: Reward[];
  onEdit: (reward: Reward) => void;
  onDelete: (id: string) => void;
}

const RewardList: React.FC<RewardListProps> = ({ rewards, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-neutral-700">Reward</th>
              <th className="px-6 py-4 text-sm font-semibold text-neutral-700">Type</th>
              <th className="px-6 py-4 text-sm font-semibold text-neutral-700">Value</th>
              <th className="px-6 py-4 text-sm font-semibold text-neutral-700">Probability</th>
              <th className="px-6 py-4 text-sm font-semibold text-neutral-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {rewards.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-neutral-500 italic">
                  No rewards configured yet.
                </td>
              </tr>
            ) : (
              rewards.map((reward) => (
                <tr key={reward.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full border border-neutral-200"
                        style={{ backgroundColor: reward.color }}
                      />
                      <span className="font-medium text-neutral-900">{reward.label}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 capitalize text-sm text-neutral-600">
                    {reward.type}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-900 font-semibold">
                    {reward.value}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {reward.probability}%
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => onEdit(reward)}
                      className="text-teal-600 hover:text-teal-800 font-medium text-sm transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(reward.id)}
                      className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RewardList;
