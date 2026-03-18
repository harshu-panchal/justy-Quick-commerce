import React, { useState } from 'react';
import SubscriptionPlanCardPreview from './SubscriptionPlanCardPreview';

interface SubscriptionPlanFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const SubscriptionPlanForm: React.FC<SubscriptionPlanFormProps> = ({
  initialData,
  onSubmit,
  onClose,
  isLoading
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'Customer',
    price: 0,
    interval: 'monthly',
    features: [''],
    cardColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    status: true,
    ...initialData
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData((prev: any) => ({ ...prev, features: newFeatures }));
  };

  const addFeature = () => {
    setFormData((prev: any) => ({ ...prev, features: [...prev.features, ''] }));
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_: string, i: number) => i !== index);
    setFormData((prev: any) => ({ ...prev, features: newFeatures.length > 0 ? newFeatures : [''] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const colorOptions = [
    { label: 'Indigo Night', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { label: 'Royal Blue', value: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' },
    { label: 'Sunset Glow', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { label: 'Sea Breeze', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { label: 'Forest Deep', value: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)' },
    { label: 'Midnight', value: 'linear-gradient(135deg, #232526 0%, #414345 100%)' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        {/* Form Section */}
        <div className="flex-1 p-8 overflow-y-auto border-r border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
              {initialData ? 'Edit Subscription Plan' : 'Create New Plan'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Plan Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Premium Pro"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Target User Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="Customer">User / Customer</option>
                  <option value="Seller">Seller / Merchant</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Price (₹)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Billing Interval</label>
                <select
                  name="interval"
                  value={formData.interval}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder="Brief summary of the plan benefits..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700 font-bold">Plan Features</label>
                <button
                  type="button"
                  onClick={addFeature}
                  className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Feature
                </button>
              </div>
              <div className="space-y-3">
                {formData.features.map((feature: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      placeholder={`Feature #${index + 1}`}
                      className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {formData.features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                </svg> Card Style & Color
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {colorOptions.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setFormData({ ...formData, cardColor: opt.value })}
                    className={`h-10 rounded-lg border-2 transition-all ${
                      formData.cardColor === opt.value ? 'border-blue-500 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{ background: opt.value }}
                    title={opt.label}
                  />
                ))}
              </div>
              <div className="mt-2 text-[10px] text-gray-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: formData.cardColor }} />
                Selected: {colorOptions.find(o => o.value === formData.cardColor)?.label || 'Custom'}
              </div>
            </div>

            <div className="pt-6 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : initialData ? 'Update Plan' : 'Publish Plan'}
              </button>
            </div>
          </form>
        </div>

        {/* Preview Section */}
        <div className="hidden lg:flex w-[460px] bg-gray-100 p-8 items-center justify-center">
            <SubscriptionPlanCardPreview 
                name={formData.name}
                price={formData.price}
                interval={formData.interval}
                description={formData.description}
                features={formData.features.filter((f: string) => f.trim() !== '')}
                cardColor={formData.cardColor}
                type={formData.type}
            />
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlanForm;
