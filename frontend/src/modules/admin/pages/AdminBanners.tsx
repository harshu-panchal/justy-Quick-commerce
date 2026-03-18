import React, { useState, useEffect } from "react";
import { bannerService } from "../../../services/bannerService";
import { Banner, CreateBannerInput } from "../../../components/banners/banner.types";
import { uploadImage } from "../../../services/api/uploadService";
import { validateImageFile, createImagePreview } from "../../../utils/imageUpload";
import { getCategories, Category } from "../../../services/api/categoryService";

const AdminBanners: React.FC = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [categories, setCategories] = useState<Category[]>([]);
    
    const [formData, setFormData] = useState<CreateBannerInput>({
        title: "",
        imageUrl: "",
        type: "quick",
        isActive: true,
        linkType: "none",
        linkValue: "",
    });

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const data = await bannerService.getBanners();
            setBanners(data);
        } catch (error) {
            console.error("Failed to load banners:", error);
        }
        setLoading(false);
    };

    const fetchCategories = async () => {
        try {
            const response = await getCategories();
            if (response.success) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    useEffect(() => {
        fetchBanners();
        fetchCategories();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
        setFormData((prev) => ({ ...prev, [name]: val }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = validateImageFile(file);
        if (!validation.valid) {
            alert(validation.error || "Invalid image file");
            return;
        }

        setImageFile(file);
        try {
            const preview = await createImagePreview(file);
            setImagePreview(preview);
        } catch (error) {
            console.error("Failed to create preview:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setUploading(true);
            let finalImageUrl = formData.imageUrl;

            if (imageFile) {
                const uploadResult = await uploadImage(imageFile, "banners");
                finalImageUrl = uploadResult.secureUrl;
            }

            const bannerData: CreateBannerInput = { ...formData, imageUrl: finalImageUrl };

            await bannerService.createBanner(bannerData);
            
            setShowForm(false);
            setImageFile(null);
            setImagePreview("");
            setFormData({
                title: "",
                imageUrl: "",
                type: "quick",
                isActive: true,
                linkType: "none",
                linkValue: "",
            });
            fetchBanners();
            window.dispatchEvent(new CustomEvent("bannersUpdated"));
        } catch (error) {
            console.error("Error saving banner:", error);
            alert("Failed to save banner");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this banner?")) {
            await bannerService.deleteBanner(id);
            fetchBanners();
            window.dispatchEvent(new CustomEvent("bannersUpdated"));
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-neutral-50">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 leading-tight">Banner Management</h1>
                    <p className="text-neutral-500 mt-1">Manage promotional banners for Quick and Scheduled modes</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); }}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold shadow-sm hover:bg-green-700 transition-all flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Banner
                </button>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="px-8 py-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                            <h2 className="text-xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
                                Create New Banner
                            </h2>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                                <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-hide">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-neutral-700 ml-1">Banner Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Weekend Mega Sale"
                                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-neutral-400"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-neutral-700 ml-1">Banner Mode</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-green-500 outline-none transition-all appearance-none bg-white"
                                    >
                                        <option value="quick">Quick (10-20 min)</option>
                                        <option value="scheduled">Scheduled (Same/Next Day)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-neutral-700 ml-1">Redirect To (Link Type)</label>
                                    <select
                                        name="linkType"
                                        value={formData.linkType}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-green-500 outline-none transition-all appearance-none bg-white"
                                    >
                                        <option value="none">None (No Redirection)</option>
                                        <option value="category">Category (Offer Page)</option>
                                        <option value="product">Specific Product</option>
                                        <option value="external">External URL</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-neutral-700 ml-1">Redirect Value</label>
                                    {formData.linkType === 'category' ? (
                                        <select
                                            name="linkValue"
                                            value={formData.linkValue}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-green-500 outline-none transition-all appearance-none bg-white"
                                            required
                                        >
                                            <option value="">Select a Category</option>
                                            {categories.map(cat => (
                                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            name="linkValue"
                                            value={formData.linkValue}
                                            onChange={handleInputChange}
                                            placeholder={
                                                formData.linkType === 'external' 
                                                ? "https://example.com" 
                                                : formData.linkType === 'product'
                                                ? "Product ID"
                                                : "No redirection"
                                            }
                                            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder:text-neutral-400"
                                            disabled={formData.linkType === 'none'}
                                            required={formData.linkType !== 'none'}
                                        />
                                    )}
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-semibold text-neutral-700 ml-1">Banner Image</label>
                                    <label className="block border-2 border-dashed border-neutral-200 rounded-2xl p-6 text-center cursor-pointer hover:border-green-500 hover:bg-green-50/30 transition-all group relative overflow-hidden">
                                        {imagePreview ? (
                                            <div className="space-y-3">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="max-h-48 mx-auto rounded-xl object-cover shadow-md"
                                                />
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-xs font-medium text-neutral-500 bg-white px-2 py-1 rounded-md border border-neutral-100">
                                                        {imageFile ? imageFile.name : "Current Image"}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setImageFile(null);
                                                            setImagePreview("");
                                                            setFormData(prev => ({ ...prev, imageUrl: "" }));
                                                        }}
                                                        className="p-1 px-2 bg-red-50 text-red-600 rounded-md text-[10px] font-bold uppercase hover:bg-red-100 transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-4">
                                                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                                    <svg className="w-6 h-6 text-neutral-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-medium text-neutral-600">Click to upload or drag and drop</p>
                                                <p className="text-xs text-neutral-400 mt-1">PNG, JPG or WEBP (Max 5MB)</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            disabled={uploading}
                                        />
                                        {uploading && (
                                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center flex-col gap-2">
                                                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                                <p className="text-sm font-bold text-green-700">Uploading...</p>
                                            </div>
                                        )}
                                    </label>
                                    <input
                                        type="url"
                                        name="imageUrl"
                                        value={formData.imageUrl}
                                        onChange={handleInputChange}
                                        placeholder="Or paste image URL here..."
                                        className="w-full px-4 py-2 text-sm rounded-xl border border-neutral-200 focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder:text-neutral-400"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pt-4">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                                <span className="text-sm font-medium text-neutral-700">Display this banner on Home page</span>
                            </div>
                            <div className="flex justify-end gap-3 pt-8 mt-4 border-t border-neutral-100">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-6 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 font-semibold hover:bg-neutral-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className={`px-8 py-2.5 rounded-xl text-white font-bold shadow-lg transition-all focus:scale-95 ${uploading ? "bg-neutral-400 cursor-not-allowed" : "bg-green-600 shadow-green-200 hover:bg-green-700"}`}
                                >
                                    {uploading ? "Uploading..." : "Create Banner"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-3xl p-6 h-64 animate-pulse space-y-4 shadow-sm border border-neutral-100">
                            <div className="w-full h-32 bg-neutral-100 rounded-2xl" />
                            <div className="h-4 bg-neutral-100 rounded w-3/4" />
                            <div className="h-4 bg-neutral-100 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {banners.map((banner) => (
                        <div key={banner._id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-100 flex flex-col h-full">
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={banner.imageUrl}
                                    alt={banner.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${banner.type === "quick" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                                        } backdrop-blur-md bg-opacity-90`}>
                                        {banner.type}
                                    </span>
                                    {!banner.isActive && (
                                        <span className="px-3 py-1 rounded-full bg-neutral-900/80 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                                            Inactive
                                        </span>
                                    )}
                                </div>
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleDelete(banner._id)}
                                        className="p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-full hover:bg-white shadow-lg transition-all transform hover:scale-110"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col justify-between">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-neutral-900 group-hover:text-green-600 transition-colors line-clamp-1">{banner.title}</h3>
                                    {banner.linkType !== 'none' && (
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
                                            </svg>
                                            Links to {banner.linkType}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-6 flex items-center justify-between pt-4 border-t border-neutral-50">
                                    <div className="text-[10px] text-neutral-400 font-medium">
                                        {new Date(banner.createdAt).toLocaleDateString()}
                                    </div>
                                    <div
                                        className={`text-xs font-bold uppercase tracking-widest ${banner.isActive ? "text-green-600" : "text-neutral-400"}`}
                                    >
                                        {banner.isActive ? "Enabled" : "Disabled"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && banners.length === 0 && (
                <div className="text-center py-24 bg-white rounded-3xl border border-neutral-100 shadow-sm">
                    <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-neutral-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900">No Banners Found</h3>
                    <p className="text-neutral-500 mt-2 max-w-sm mx-auto">Start by adding your first promotional banner for the home page.</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="mt-6 px-8 py-3 bg-neutral-900 text-white rounded-xl font-bold hover:bg-neutral-800 transition-all"
                    >
                        Create Banner
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminBanners;
