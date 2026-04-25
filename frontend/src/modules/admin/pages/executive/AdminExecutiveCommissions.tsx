import { useState, useEffect } from 'react';
import { getCategoryCommissions, updateCategoryCommission } from '../../services/adminExecutiveService';
import { getHeaderCategoriesAdmin, HeaderCategory } from '../../../../services/api/headerCategoryService';
import toast from 'react-hot-toast';

export default function AdminExecutiveCommissions() {
    const [commissions, setCommissions] = useState<any[]>([]);
    const [categories, setCategories] = useState<HeaderCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<{ name: string, amount: number } | null>(null);

    const fetchCommissions = async () => {
        try {
            const [commData, catData] = await Promise.all([
                getCategoryCommissions(),
                getHeaderCategoriesAdmin()
            ]);
            setCommissions(commData.data);
            setCategories(catData);
        } catch (error) {
            toast.error('Failed to fetch commissions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCommissions();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;

        try {
            await updateCategoryCommission({
                categoryName: editing.name,
                amount: editing.amount
            });
            toast.success('Commission updated successfully');
            setEditing(null);
            fetchCommissions();
        } catch (error) {
            toast.error('Failed to update commission');
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-black text-neutral-900">Category Commissions</h1>
                <p className="text-neutral-500 font-medium">Set fixed commission amounts for each seller category</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50/50 border-b border-neutral-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Category Name</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Commission (₹)</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-10 text-center text-neutral-400 font-bold">Loading commissions...</td>
                                </tr>
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-10 text-center text-neutral-400 font-bold">No categories found</td>
                                </tr>
                            ) : (
                                categories.map((cat) => {
                                    const comm = commissions.find(c => c.categoryName === cat.name);
                                    const amount = comm ? comm.amount : 100;
                                    const isDefault = !comm;

                                    return (
                                        <tr key={cat._id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-black text-neutral-900">{cat.name}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-emerald-600 text-lg">₹{amount}</p>
                                                    {isDefault && (
                                                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-[9px] font-black uppercase tracking-widest rounded-lg">Default</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => setEditing({ name: cat.name, amount })}
                                                    className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-black hover:bg-neutral-800 transition-all active:scale-95"
                                                >
                                                    {isDefault ? 'Set Commission' : 'Edit Amount'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-6">
                    <div className="bg-emerald-900 rounded-lg p-6 text-white shadow-lg">
                        <h3 className="text-lg font-black tracking-tight mb-2">Update Commission</h3>
                        <p className="text-emerald-100/60 text-xs font-medium mb-6">Select a category from the list to update its commission amount.</p>
                        
                        {editing ? (
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-emerald-100/50 uppercase tracking-widest ml-1">Category</label>
                                    <div className="px-4 py-3 bg-white/10 rounded-lg text-white font-black text-sm border border-white/10">
                                        {editing.name}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-emerald-100/50 uppercase tracking-widest ml-1">New Amount (₹)</label>
                                    <input 
                                        type="number"
                                        value={editing.amount}
                                        onChange={(e) => setEditing({...editing, amount: Number(e.target.value)})}
                                        className="w-full px-4 py-3 bg-white/10 rounded-lg text-white font-black text-lg border border-white/10 focus:border-white/30 outline-none transition-all"
                                        placeholder="e.g. 100"
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button 
                                        type="button"
                                        onClick={() => setEditing(null)}
                                        className="flex-1 py-3 bg-white/10 text-white rounded-lg text-xs font-black hover:bg-white/20 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-[2] py-3 bg-white text-emerald-900 rounded-lg text-xs font-black hover:bg-emerald-50 transition-all shadow-lg"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="py-10 text-center">
                                <button
                                    onClick={() => {
                                        const unconfiguredCat = categories.find(cat => !commissions.some(c => c.categoryName === cat.name));
                                        if (unconfiguredCat) {
                                            setEditing({ name: unconfiguredCat.name, amount: 100 });
                                        } else {
                                            toast.error("All categories already have custom commissions.");
                                        }
                                    }}
                                    className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 hover:bg-white/20 transition-all active:scale-95 cursor-pointer"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                </button>
                                <p className="text-emerald-100/40 text-xs font-bold">Select a category to edit</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
                        <h4 className="text-sm font-black text-neutral-900 uppercase tracking-widest mb-4">How it works?</h4>
                        <ul className="space-y-3">
                            <li className="flex gap-3 items-start">
                                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-[10px] font-black">1</span>
                                </div>
                                <p className="text-xs text-neutral-500 font-medium">Commissions are credited to executives only after a seller is Approved and pays the Security Deposit.</p>
                            </li>
                            <li className="flex gap-3 items-start">
                                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-[10px] font-black">2</span>
                                </div>
                                <p className="text-xs text-neutral-500 font-medium">Changing the amount here will only affect new commissions. Existing wallet balances won't be affected.</p>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
