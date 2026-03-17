import React, { useState, useEffect } from 'react';
import { 
  getSubscriptionPlans, 
  createSubscriptionPlan, 
  updateSubscriptionPlan, 
  deleteSubscriptionPlan, 
  toggleSubscriptionPlanStatus,
  SubscriptionPlan
} from '../../../services/api/admin/adminSubscriptionService';
import SubscriptionPlanForm from '../components/SubscriptionPlanForm';
import { useToast } from '../../../context/ToastContext';

const AdminSubscriptionPlan = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const { showToast } = useToast();

  const tabs = ['All', 'User', 'Seller'];

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await getSubscriptionPlans();
      if (res.success) {
        setPlans(res.data);
      }
    } catch (error) {
      showToast('Failed to fetch subscription plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (data: any) => {
    try {
      setLoading(true);
      if (editingPlan) {
        await updateSubscriptionPlan(editingPlan._id, data);
        showToast('Plan updated successfully');
      } else {
        await createSubscriptionPlan(data);
        showToast('Plan created successfully');
      }
      setIsModalOpen(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (error) {
      showToast('Operation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await deleteSubscriptionPlan(id);
      showToast('Plan deleted successfully');
      fetchPlans();
    } catch (error) {
      showToast('Failed to delete plan', 'error');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleSubscriptionPlanStatus(id, !currentStatus);
      showToast(`Plan ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchPlans();
    } catch (error) {
      showToast('Failed to update status', 'error');
    }
  };

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase());
    const targetType = activeTab === 'User' ? 'Customer' : activeTab;
    const matchesTab = activeTab === 'All' || plan.type === targetType;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-500 mt-1">Manage and configure your marketplace subscription tiers.</p>
        </div>
        <button
          onClick={() => { setEditingPlan(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add New Plan
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters Header */}
        <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            />
          </div>

          <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="text-sm text-gray-500 font-medium flex items-center gap-2 px-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Showing {filteredPlans.length} Plans
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-bold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Plan Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">Loading subscription plans...</td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">No plans found</td>
                </tr>
              ) : (
                filteredPlans.map((plan: SubscriptionPlan) => (
                  <tr key={plan._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ background: plan.cardColor }}
                        >
                          <div className="w-4 h-4 border-2 border-white rounded-sm opacity-50" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{plan.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{plan.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                        plan.type === 'Customer' ? 'bg-green-50 text-green-600' :
                        plan.type === 'Seller' ? 'bg-purple-50 text-purple-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {plan.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      ₹{plan.price}<span className="text-[10px] text-gray-400 ml-1">/{plan.interval === 'monthly' ? 'mo' : 'yr'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(plan._id, plan.status)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          plan.status ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            plan.status ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingPlan(plan); setIsModalOpen(true); }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(plan._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between text-xs font-medium text-gray-500">
          <div>Showing 1 to {filteredPlans.length} of {plans.length} results</div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-200 rounded-lg bg-white opacity-50 cursor-not-allowed text-xs">Previous</button>
            <button className="px-4 py-2 border border-gray-200 rounded-lg bg-white opacity-50 cursor-not-allowed text-xs">Next</button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <SubscriptionPlanForm
          initialData={editingPlan}
          onSubmit={handleCreateOrUpdate}
          onClose={() => { setIsModalOpen(false); setEditingPlan(null); }}
          isLoading={loading}
        />
      )}
    </div>
  );
};

export default AdminSubscriptionPlan;
