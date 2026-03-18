import React, { useState, useEffect } from 'react';
import RewardForm, { Reward } from '../components/spinner/RewardForm';
import RewardList from '../components/spinner/RewardList';
import SpinnerPreview from '../components/spinner/SpinnerPreview';
import { useToast } from '../../../context/ToastContext';
import { getSpinnerSettings, updateSpinnerSettings, SpinnerSettings } from '../../../services/api/admin/adminSettingsService';
import { useAuth } from '../../../context/AuthContext';

interface SpinnerReward {
  id: string;
  label: string;
  value: number;
  icon?: string;
  color: string;
  type: 'coin' | 'discount';
  probability?: number;
}

const SpinnerManagement: React.FC = () => {
  const { showToast } = useToast();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SpinnerSettings>({
    enabled: true,
    trigger: 'onLogin',
    frequency: 'daily',
    rewards: [],
  });

  const [isAddingReward, setIsAddingReward] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  // Load configuration from API
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await getSpinnerSettings();
      if (response.success && response.data) {
        setConfig(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch spinner configuration', err);
      showToast('Failed to load configuration from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      const response = await updateSpinnerSettings({ spinnerSettings: config });
      if (response.success) {
        showToast('Spinner configuration saved successfully!', 'success');
      }
    } catch (err) {
      console.error('Failed to save spinner configuration', err);
      showToast('Failed to save configuration to server', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddReward = (reward: Reward) => {
    if (editingReward) {
      setConfig({
        ...config,
        rewards: config.rewards.map((r) => (r.id === editingReward.id ? reward : r)),
      });
      setEditingReward(null);
    } else {
      setConfig({
        ...config,
        rewards: [...config.rewards, reward],
      });
      setIsAddingReward(false);
    }
  };

  const handleDeleteReward = (id: string) => {
    if (window.confirm('Are you sure you want to delete this reward?')) {
      setConfig({
        ...config,
        rewards: config.rewards.filter((r) => r.id !== id),
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Spinner Configuration</h1>
          <p className="text-neutral-500">Manage lucky spin rewards and display settings</p>
        </div>
        <button
          onClick={saveConfiguration}
          disabled={saving || loading}
          className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-neutral-200 shadow-sm">
          <div className="w-12 h-12 border-4 border-teal-600/20 border-t-teal-600 rounded-full animate-spin mb-4"></div>
          <p className="text-neutral-500 font-medium">Loading settings...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Settings Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
            <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Spinner Settings
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <div>
                  <p className="font-semibold text-neutral-900">Enable Spinner</p>
                  <p className="text-xs text-neutral-500">Show/Hide the spinner for users</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={config.enabled} 
                    onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Show Trigger</label>
                <select 
                  value={config.trigger}
                  onChange={(e) => setConfig({ ...config, trigger: e.target.value as any })}
                  className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                >
                  <option value="onLogin">On First Login/Visit</option>
                  <option value="afterOrder">After Successful Order</option>
                  <option value="manual">Manual Trigger Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Show Frequency</label>
                <select 
                  value={config.frequency}
                  onChange={(e) => setConfig({ ...config, frequency: e.target.value as any })}
                  className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                >
                  <option value="once">Once per User (Forever)</option>
                  <option value="daily">Once per Day</option>
                  <option value="always">Every Time (Always Show)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reward Management Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Reward Management
              </h2>
              <button
                onClick={() => { setIsAddingReward(true); setEditingReward(null); }}
                className="px-4 py-2 bg-neutral-900 text-white text-sm font-bold rounded-lg hover:bg-neutral-800 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Reward
              </button>
            </div>

            {(isAddingReward || editingReward) && (
              <RewardForm 
                onSave={handleAddReward} 
                onCancel={() => { setIsAddingReward(false); setEditingReward(null); }} 
                initialData={editingReward}
              />
            )}

            <RewardList 
              rewards={config.rewards} 
              onEdit={setEditingReward} 
              onDelete={handleDeleteReward} 
            />
          </div>
        </div>

        {/* Preview Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 sticky top-24">
            <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Live Preview
            </h2>
            <SpinnerPreview rewards={config.rewards} />
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpinnerManagement;
