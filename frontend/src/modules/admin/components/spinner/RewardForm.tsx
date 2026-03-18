import React, { useState, useEffect } from 'react';

export interface Reward {
  id: string;
  label: string;
  type: 'coin' | 'discount';
  value: number;
  color: string;
  icon?: string;
  probability?: number;
}

interface RewardFormProps {
  onSave: (reward: Reward) => void;
  onCancel: () => void;
  initialData?: Reward | null;
}

const RewardForm: React.FC<RewardFormProps> = ({ onSave, onCancel, initialData }) => {
  const [formData, setFormData] = useState<Reward>({
    id: '',
    label: '',
    type: 'coin',
    value: 0,
    color: '#FFD700',
    probability: 10,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        id: Math.random().toString(36).substr(2, 9),
        label: '',
        type: 'coin',
        value: 0,
        color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
        probability: 10,
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
      <h3 className="text-lg font-bold text-neutral-900 mb-4">
        {initialData ? 'Edit Reward' : 'Add New Reward'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Label</label>
          <input
            type="text"
            required
            placeholder="e.g., 50 Coins, 10% OFF"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'coin' | 'discount' })}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
            >
              <option value="coin">Coin</option>
              <option value="discount">Discount</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Value</label>
            <input
              type="number"
              required
              min="0"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-12 border border-neutral-300 rounded cursor-pointer p-1"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Probability (Weight)</label>
            <input
              type="number"
              required
              min="1"
              max="100"
              value={formData.probability}
              onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-lg transition-all shadow-md"
          >
            {initialData ? 'Update' : 'Add Reward'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-2 rounded-lg transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default RewardForm;
