import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { uploadImage, uploadImages } from "../../../services/api/uploadService";
import {
    validateImageFile,
    createImagePreview,
} from "../../../utils/imageUpload";
import {
    getProductById,
    updateProduct,
    getProducts,
    getCategories,
    getSubCategories,
    getBrands,
    getSellers,
    type Product,
    type Category,
    type SubCategory,
} from "../../../services/api/admin/adminProductService";
import { getActiveTaxes, Tax } from "../../../services/api/taxService";
import { getBrands as getBrandsPublic, Brand } from "../../../services/api/brandService";
import {
    getHeaderCategoriesAdmin,
    HeaderCategory,
} from "../../../services/api/headerCategoryService";

export default function AdminProductEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        productName: "",
        headerCategory: "",
        category: "",
        subcategory: "",
        subSubCategory: "",
        publish: "No",
        popular: "No",
        dealOfDay: "No",
        brand: "",
        tags: "",
        smallDescription: "",
        seoTitle: "",
        seoKeywords: "",
        seoImageAlt: "",
        seoDescription: "",
        manufacturer: "",
        madeIn: "",
        tax: "",
        isReturnable: "No",
        maxReturnDays: "",
        fssaiLicNo: "",
        totalAllowedQuantity: "10",
        mainImageUrl: "",
        galleryImageUrls: [] as string[],
        seller: "", // Read only in edit mode or used if admin adds a product (though this is edit only)
        sellerName: "", // Store name
    });

    const [variations, setVariations] = useState<any[]>([]);
    const [variationForm, setVariationForm] = useState({
        name: "",
        value: "",
        price: "",
        stock: "0",
        sku: "",
    });

    const [mainImageFile, setMainImageFile] = useState<File | null>(null);
    const [mainImagePreview, setMainImagePreview] = useState<string>("");
    const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
    const [galleryImagePreviews, setGalleryImagePreviews] = useState<string[]>(
        []
    );
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string>("");

    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
    const [taxes, setTaxes] = useState<Tax[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [headerCategories, setHeaderCategories] = useState<HeaderCategory[]>(
        []
    );

    useEffect(() => {
        const fetchSelectData = async () => {
            try {
                const [catRes, taxRes, brandRes, headerRes] = await Promise.all([
                    getCategories(),
                    getActiveTaxes(),
                    getBrandsPublic(),
                    getHeaderCategoriesAdmin(),
                ]);

                if (catRes.success) setCategories(catRes.data);
                if (taxRes.success) setTaxes(taxRes.data);
                if (brandRes.success) setBrands(brandRes.data);
                setHeaderCategories(headerRes);
            } catch (err) {
                console.error("Error fetching form data:", err);
            }
        };
        fetchSelectData();
    }, []);

    useEffect(() => {
        if (id) {
            const fetchProduct = async () => {
                try {
                    const response = await getProductById(id);
                    if (response.success && response.data) {
                        const product = response.data;
                        const productCategory = product.category as any;
                        const productSubcategory = product.subcategory as any;
                        const productBrand = product.brand as any;
                        const productSeller = product.seller as any;
                        const productTax = product.tax as any;

                        setFormData({
                            productName: product.productName,
                            headerCategory: product.headerCategoryId || "",
                            category: productCategory?._id || productCategory || "",
                            subcategory: productSubcategory?._id || productSubcategory || "",
                            subSubCategory: "", // Not used in this layout for now
                            publish: product.publish ? "Yes" : "No",
                            popular: product.popular ? "Yes" : "No",
                            dealOfDay: product.dealOfDay ? "Yes" : "No",
                            brand: productBrand?._id || productBrand || "",
                            tags: product.tags.join(", "),
                            smallDescription: product.smallDescription || "",
                            seoTitle: product.seoTitle || "",
                            seoKeywords: product.seoKeywords || "",
                            seoImageAlt: product.seoImageAlt || "",
                            seoDescription: product.seoDescription || "",
                            manufacturer: product.manufacturer || "",
                            madeIn: product.madeIn || "",
                            tax: productTax?._id || productTax || "",
                            isReturnable: product.isReturnable ? "Yes" : "No",
                            maxReturnDays: product.maxReturnDays?.toString() || "",
                            fssaiLicNo: product.fssaiLicNo || "",
                            totalAllowedQuantity: product.totalAllowedQuantity?.toString() || "10",
                            mainImageUrl: product.mainImage || "",
                            galleryImageUrls: product.galleryImages || [],
                            seller: productSeller?._id || productSeller || "",
                            sellerName: productSeller?.storeName || productSeller?.sellerName || "Unknown Seller",
                        });
                        setVariations(product.variations || []);
                        if (product.mainImage) {
                            setMainImagePreview(product.mainImage);
                        }
                        if (product.galleryImages) {
                            setGalleryImagePreviews(product.galleryImages);
                        }
                    }
                } catch (err) {
                    console.error("Error fetching product:", err);
                    setUploadError("Failed to fetch product details");
                }
            };
            fetchProduct();
        }
    }, [id]);

    useEffect(() => {
        const fetchSubs = async () => {
            if (formData.category) {
                try {
                    const res = await getSubCategories({ category: formData.category });
                    if (res.success) setSubcategories(res.data);
                } catch (err) {
                    console.error("Error fetching subcategories:", err);
                }
            } else {
                setSubcategories([]);
            }
        };
        fetchSubs();
    }, [formData.category]);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleMainImageChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = validateImageFile(file);
        if (!validation.valid) {
            setUploadError(validation.error || "Invalid image file");
            return;
        }

        setMainImageFile(file);
        setUploadError("");

        try {
            const preview = await createImagePreview(file);
            setMainImagePreview(preview);
        } catch (error) {
            setUploadError("Failed to create image preview");
        }
    };

    const handleGalleryImagesChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setGalleryImageFiles((prev) => [...prev, ...files]);
        setUploadError("");

        try {
            const newPreviews = await Promise.all(
                files.map((file) => createImagePreview(file))
            );
            setGalleryImagePreviews((prev) => [...prev, ...newPreviews]);
        } catch (error) {
            setUploadError("Failed to create image previews");
        }
    };

    const removeGalleryImage = (index: number) => {
        setGalleryImageFiles((prev) => prev.filter((_, i) => i !== index));
        setGalleryImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const addVariation = () => {
        if (!variationForm.name || !variationForm.value || !variationForm.price) {
            setUploadError("Please fill in variation name, value and price");
            return;
        }

        const newVariation = {
            name: variationForm.name,
            value: variationForm.value,
            price: parseFloat(variationForm.price),
            stock: parseInt(variationForm.stock || "0"),
            sku: variationForm.sku,
        };

        setVariations([...variations, newVariation]);
        setVariationForm({
            name: "",
            value: "",
            price: "",
            stock: "0",
            sku: "",
        });
    };

    const removeVariation = (index: number) => {
        setVariations((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploadError("");

        if (!formData.productName.trim()) {
            setUploadError("Please enter a product name.");
            return;
        }

        setUploading(true);

        try {
            let mainImageUrl = formData.mainImageUrl;
            let galleryImageUrls = [...formData.galleryImageUrls];

            if (mainImageFile) {
                const mainImageResult = await uploadImage(mainImageFile, "products");
                mainImageUrl = mainImageResult.secureUrl;
            }

            if (galleryImageFiles.length > 0) {
                const galleryResults = await uploadImages(galleryImageFiles, "products/gallery");
                galleryImageUrls = [...galleryImageUrls, ...galleryResults.map((r) => r.secureUrl)];
            }

            const tagsArray = formData.tags
                ? formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
                : [];

            const productData = {
                productName: formData.productName,
                headerCategoryId: formData.headerCategory || undefined,
                category: formData.category || undefined,
                subcategory: formData.subcategory || undefined,
                brand: formData.brand || undefined,
                publish: formData.publish === "Yes",
                popular: formData.popular === "Yes",
                dealOfDay: formData.dealOfDay === "Yes",
                seoTitle: formData.seoTitle,
                seoKeywords: formData.seoKeywords,
                seoImageAlt: formData.seoImageAlt,
                seoDescription: formData.seoDescription,
                smallDescription: formData.smallDescription,
                tags: tagsArray,
                manufacturer: formData.manufacturer,
                madeIn: formData.madeIn,
                tax: formData.tax || undefined,
                isReturnable: formData.isReturnable === "Yes",
                maxReturnDays: formData.maxReturnDays ? parseInt(formData.maxReturnDays) : undefined,
                totalAllowedQuantity: parseInt(formData.totalAllowedQuantity || "10"),
                fssaiLicNo: formData.fssaiLicNo,
                mainImage: mainImageUrl,
                galleryImages: galleryImageUrls,
                variations: variations,
            };

            if (id) {
                const response = await updateProduct(id, productData);
                if (response.success) {
                    setSuccessMessage("Product updated successfully!");
                    setTimeout(() => {
                        navigate("/admin/product/list");
                    }, 1500);
                } else {
                    setUploadError(response.message || "Failed to update product");
                }
            }
        } catch (error: any) {
            setUploadError(error.message || "An error occurred");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Edit Product</h1>
                <button
                    onClick={() => navigate("/admin/product/list")}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                    Back to List
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
                    <div className="bg-teal-600 text-white px-4 py-2 rounded-t-lg -m-6 mb-6">
                        <h2 className="font-semibold">Product Information</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Product Name</label>
                            <input
                                type="text"
                                name="productName"
                                value={formData.productName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-teal-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Seller (Store Name)</label>
                            <input
                                type="text"
                                value={formData.sellerName}
                                readOnly
                                className="w-full px-3 py-2 border rounded bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
                    <h2 className="text-lg font-semibold mb-4 border-b pb-2">Category Selection</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Header Category</label>
                            <select
                                name="headerCategory"
                                value={formData.headerCategory}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded">
                                <option value="">Select Header Category</option>
                                {headerCategories.map(hc => (
                                    <option key={hc._id} value={hc._id}>{hc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded">
                                <option value="">Select Category</option>
                                {categories.filter(c => c.headerCategoryId === formData.headerCategory || !formData.headerCategory).map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">SubCategory</label>
                            <select
                                name="subcategory"
                                value={formData.subcategory}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded">
                                <option value="">Select Subcategory</option>
                                {subcategories.map(s => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Images */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
                    <h2 className="text-lg font-semibold mb-4 border-b pb-2">Product Images</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Main Image</label>
                            <div className="flex items-center gap-4">
                                {mainImagePreview && (
                                    <img src={mainImagePreview} alt="Preview" className="w-24 h-32 object-cover rounded shadow" />
                                )}
                                <input type="file" onChange={handleMainImageChange} accept="image/*" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Gallery Images</label>
                            <input type="file" multiple onChange={handleGalleryImagesChange} accept="image/*" className="mb-4" />
                            <div className="flex flex-wrap gap-2">
                                {galleryImagePreviews.map((pre, idx) => (
                                    <div key={idx} className="relative group">
                                        <img src={pre} alt={`Gallery ${idx}`} className="w-20 h-24 object-cover rounded shadow" />
                                        <button
                                            type="button"
                                            onClick={() => removeGalleryImage(idx)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Variations */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
                    <h2 className="text-lg font-semibold mb-4 border-b pb-2">Product Variations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4 items-end bg-gray-50 p-4 rounded">
                        <div>
                            <label className="block text-xs font-medium mb-1">Name (e.g. Size)</label>
                            <input
                                type="text"
                                value={variationForm.name}
                                onChange={e => setVariationForm({ ...variationForm, name: e.target.value })}
                                className="w-full px-3 py-1.5 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Value (e.g. XL)</label>
                            <input
                                type="text"
                                value={variationForm.value}
                                onChange={e => setVariationForm({ ...variationForm, value: e.target.value })}
                                className="w-full px-3 py-1.5 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Price</label>
                            <input
                                type="number"
                                value={variationForm.price}
                                onChange={e => setVariationForm({ ...variationForm, price: e.target.value })}
                                className="w-full px-3 py-1.5 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Stock</label>
                            <input
                                type="number"
                                value={variationForm.stock}
                                onChange={e => setVariationForm({ ...variationForm, stock: e.target.value })}
                                className="w-full px-3 py-1.5 border rounded"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={addVariation}
                            className="bg-teal-600 text-white px-4 py-1.5 rounded hover:bg-teal-700 font-medium">
                            Add
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-50 border-b">
                                <tr>
                                    <th className="p-3 text-left">Variation</th>
                                    <th className="p-3 text-left">Price</th>
                                    <th className="p-3 text-left">Stock</th>
                                    <th className="p-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {variations.length === 0 ? (
                                    <tr><td colSpan={4} className="p-4 text-center text-neutral-400">No variations added yet.</td></tr>
                                ) : (
                                    variations.map((v, i) => (
                                        <tr key={i} className="border-b">
                                            <td className="p-3">{v.name}: {v.value}</td>
                                            <td className="p-3">₹{v.price}</td>
                                            <td className="p-3">{v.stock}</td>
                                            <td className="p-3 text-center">
                                                <button type="button" onClick={() => removeVariation(i)} className="text-red-500 hover:underline">Remove</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Status and Flags */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
                    <h2 className="text-lg font-semibold mb-4 border-b pb-2">Status & Visibility</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Publish Status</label>
                            <select name="publish" value={formData.publish} onChange={handleChange} className="w-full px-3 py-2 border rounded">
                                <option value="Yes">Published</option>
                                <option value="No">Unpublished</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Popular Product?</label>
                            <select name="popular" value={formData.popular} onChange={handleChange} className="w-full px-3 py-2 border rounded">
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Deal of the Day?</label>
                            <select name="dealOfDay" value={formData.dealOfDay} onChange={handleChange} className="w-full px-3 py-2 border rounded">
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Submit Actions */}
                <div className="flex flex-col items-end gap-3 pb-10">
                    {uploadError && <p className="text-red-500 text-sm font-medium">{uploadError}</p>}
                    {successMessage && <p className="text-teal-600 text-sm font-medium">{successMessage}</p>}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate("/admin/product/list")}
                            className="px-6 py-2 border border-neutral-300 rounded text-neutral-700 hover:bg-neutral-50 font-medium">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className={`px-10 py-2 bg-teal-600 text-white rounded font-bold transition-colors ${uploading ? "opacity-50 cursor-not-allowed" : "hover:bg-teal-700"
                                }`}>
                            {uploading ? "Saving..." : "Update Product"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
