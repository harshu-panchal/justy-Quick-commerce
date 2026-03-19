import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { uploadImage, uploadImages } from "../../../services/api/uploadService";
import {
  validateImageFile,
  createImagePreview,
} from "../../../utils/imageUpload";
import {
  createProduct,
  getCategories,
  getSubCategories,
  getBrands,
  getSellers,
  type Category,
  type SubCategory,
  type Brand,
  type Seller,
} from "../../../services/api/admin/adminProductService";
import { getActiveTaxes, Tax } from "../../../services/api/taxService";
import { generateProductDescriptionAI } from "../../../services/api/productService";
import {
  getHeaderCategoriesAdmin,
  type HeaderCategory,
} from "../../../services/api/headerCategoryService";

interface ProductVariation {
  title: string;
  price: number;
  discPrice: number;
  stock: number;
  status: "Available" | "Sold out";
}

export default function AdminAddProduct() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    productName: "",
    headerCategory: "",
    category: "",
    subcategory: "",
    publish: "No",
    popular: "No",
    dealOfDay: "No",
    brand: "",
    seller: "",
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
  });

  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [variationForm, setVariationForm] = useState({
    title: "",
    price: "",
    discPrice: "0",
    stock: "0",
    status: "Available" as "Available" | "Sold out",
  });

  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>("");
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
  const [galleryImagePreviews, setGalleryImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [headerCategories, setHeaderCategories] = useState<HeaderCategory[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          getCategories(),
          getActiveTaxes(),
          getBrands(),
          getHeaderCategoriesAdmin(),
          getSellers(),
        ]);

        if (results[0].status === "fulfilled" && results[0].value.success) {
          setCategories(results[0].value.data);
        }
        if (results[1].status === "fulfilled" && results[1].value.success) {
          setTaxes(results[1].value.data);
        }
        if (results[2].status === "fulfilled" && results[2].value.success) {
          setBrands(results[2].value.data);
        }
        if (results[3].status === "fulfilled") {
          const headerCatRes = results[3].value;
          if (headerCatRes && Array.isArray(headerCatRes)) {
            const published = headerCatRes.filter(
              (hc: HeaderCategory) => hc.status === "Published"
            );
            const unique = published.filter(
              (hc, idx, self) => idx === self.findIndex((t) => t.name === hc.name)
            );
            setHeaderCategories(unique);
          }
        }
        if (results[4].status === "fulfilled" && results[4].value.success) {
          setSellers(results[4].value.data);
        }
      } catch (err) {
        console.error("Error fetching form data:", err);
      }
    };
    fetchData();
  }, []);

  // Load subcategories when category changes
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
        setFormData((prev) => ({ ...prev, subcategory: "" }));
      }
    };
    if (formData.category) fetchSubs();
  }, [formData.category]);

  // Clear category when header category changes
  useEffect(() => {
    if (formData.headerCategory) {
      const currentCategory = categories.find(
        (cat: any) => (cat._id || cat.id) === formData.category
      );
      if (currentCategory) {
        const catHeaderId =
          typeof currentCategory.headerCategoryId === "string"
            ? currentCategory.headerCategoryId
            : (currentCategory.headerCategoryId as any)?._id;
        if (catHeaderId !== formData.headerCategory) {
          setFormData((prev) => ({ ...prev, category: "", subcategory: "" }));
          setSubcategories([]);
        }
      }
    } else {
      setFormData((prev) => ({ ...prev, category: "", subcategory: "" }));
      setSubcategories([]);
    }
  }, [formData.headerCategory, categories]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    } catch {
      setUploadError("Failed to create image preview");
    }
  };

  const handleGalleryImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const invalidFiles = files.filter((file) => !validateImageFile(file).valid);
    if (invalidFiles.length > 0) {
      setUploadError("Some files are invalid. Please check file types and sizes.");
      return;
    }
    setGalleryImageFiles((prev) => [...prev, ...files]);
    setUploadError("");
    try {
      const newPreviews = await Promise.all(files.map((file) => createImagePreview(file)));
      setGalleryImagePreviews((prev) => [...prev, ...newPreviews]);
    } catch {
      setUploadError("Failed to create image previews");
    }
    e.target.value = "";
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImageFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const addVariation = () => {
    if (!variationForm.title || !variationForm.price) {
      setUploadError("Please fill in variation title and price");
      return;
    }
    const price = parseFloat(variationForm.price);
    const discPrice = parseFloat(variationForm.discPrice || "0");
    const stock = parseInt(variationForm.stock || "0");
    if (discPrice > price) {
      setUploadError("Discounted price cannot be greater than price");
      return;
    }
    setVariations([...variations, { title: variationForm.title, price, discPrice, stock, status: variationForm.status }]);
    setVariationForm({ title: "", price: "", discPrice: "0", stock: "0", status: "Available" });
    setUploadError("");
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
    if (!formData.headerCategory) {
      setUploadError("Please select a header category.");
      return;
    }
    if (!formData.category) {
      setUploadError("Please select a category.");
      return;
    }
    if (variations.length === 0) {
      setUploadError("Please add at least one product variation.");
      return;
    }

    setUploading(true);
    try {
      let mainImageUrl = formData.mainImageUrl;
      let galleryImageUrls = [...formData.galleryImageUrls];

      if (mainImageFile) {
        const mainImageResult = await uploadImage(mainImageFile, "dhakadsnazzy/products");
        mainImageUrl = mainImageResult.secureUrl;
        setFormData((prev) => ({ ...prev, mainImageUrl }));
      }
      if (galleryImageFiles.length > 0) {
        const galleryResults = await uploadImages(galleryImageFiles, "dhakadsnazzy/products/gallery");
        galleryImageUrls = galleryResults.map((result) => result.secureUrl);
        setFormData((prev) => ({ ...prev, galleryImageUrls }));
      }

      const tagsArray = formData.tags
        ? formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [];

      // Map variations to admin API format (using title as value, price as price)
      const mappedVariations = variations.map((v) => ({
        name: "Size",
        value: v.title,
        price: v.price,
        stock: v.stock,
        sku: "",
      }));

      // Use first variation price as the product price
      const basePrice = variations[0]?.price || 0;
      const baseStock = variations[0]?.stock || 0;

      const productData: any = {
        productName: formData.productName,
        headerCategoryId: formData.headerCategory || undefined,
        category: formData.category || undefined,
        subcategory: formData.subcategory || undefined,
        brand: formData.brand || undefined,
        seller: formData.seller || undefined,
        publish: formData.publish === "Yes",
        popular: formData.popular === "Yes",
        dealOfDay: formData.dealOfDay === "Yes",
        price: basePrice,
        stock: baseStock,
        seoTitle: formData.seoTitle || undefined,
        seoKeywords: formData.seoKeywords || undefined,
        seoImageAlt: formData.seoImageAlt || undefined,
        seoDescription: formData.seoDescription || undefined,
        smallDescription: formData.smallDescription || undefined,
        tags: tagsArray,
        manufacturer: formData.manufacturer || undefined,
        madeIn: formData.madeIn || undefined,
        tax: formData.tax || undefined,
        isReturnable: formData.isReturnable === "Yes",
        maxReturnDays: formData.maxReturnDays ? parseInt(formData.maxReturnDays) : undefined,
        totalAllowedQuantity: parseInt(formData.totalAllowedQuantity || "10"),
        fssaiLicNo: formData.fssaiLicNo || undefined,
        mainImage: mainImageUrl || undefined,
        galleryImages: galleryImageUrls,
        variations: mappedVariations,
      };

      const response = await createProduct(productData);
      if (response.success) {
        setSuccessMessage("Product added successfully!");
        setTimeout(() => {
          setFormData({
            productName: "", headerCategory: "", category: "", subcategory: "",
            publish: "No", popular: "No", dealOfDay: "No", brand: "", seller: "",
            tags: "", smallDescription: "", seoTitle: "", seoKeywords: "",
            seoImageAlt: "", seoDescription: "", manufacturer: "", madeIn: "",
            tax: "", isReturnable: "No", maxReturnDays: "", fssaiLicNo: "",
            totalAllowedQuantity: "10", mainImageUrl: "", galleryImageUrls: [],
          });
          setVariations([]);
          setMainImageFile(null);
          setMainImagePreview("");
          setGalleryImageFiles([]);
          setGalleryImagePreviews([]);
          setSuccessMessage("");
          navigate("/admin/product/list");
        }, 1500);
      } else {
        setUploadError((response as any).message || "Failed to create product");
      }
    } catch (error: any) {
      setUploadError(
        error.response?.data?.message || error.message || "Failed to upload images. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Product Section */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <div className="bg-teal-600 text-white px-4 sm:px-6 py-3">
              <h2 className="text-lg font-semibold">Product</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    placeholder="Enter Product Name"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select Header Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="headerCategory"
                    value={formData.headerCategory}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white">
                    <option value="">Select Header Category</option>
                    {headerCategories.map((hc) => (
                      <option key={hc._id} value={hc._id}>{hc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select Category
                    {!formData.headerCategory && (
                      <span className="text-xs text-neutral-500 ml-1">(Select header category first)</span>
                    )}
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={!formData.headerCategory}
                    className={`w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${!formData.headerCategory ? "bg-neutral-100 cursor-not-allowed text-neutral-500" : "bg-white"}`}>
                    <option value="">{formData.headerCategory ? "Select Category" : "Select Header Category First"}</option>
                    {categories
                      .filter((cat: any) => {
                        if (formData.headerCategory) {
                          const catHeaderId =
                            typeof cat.headerCategoryId === "string"
                              ? cat.headerCategoryId
                              : cat.headerCategoryId?._id;
                          return catHeaderId === formData.headerCategory;
                        }
                        return true;
                      })
                      .map((cat: any) => (
                        <option key={cat._id || cat.id} value={cat._id || cat.id}>{cat.name}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select SubCategory
                    {!formData.category && (
                      <span className="text-xs text-neutral-500 ml-1">(Select category first)</span>
                    )}
                  </label>
                  <select
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleChange}
                    disabled={!formData.category}
                    className={`w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${!formData.category ? "bg-neutral-100 cursor-not-allowed text-neutral-500" : "bg-white"}`}>
                    <option value="">{formData.category ? "Select Subcategory" : "Select Category First"}</option>
                    {subcategories.map((sub: any) => (
                      <option key={sub._id} value={sub._id}>{sub.subcategoryName || sub.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Product Publish Or Unpublish?</label>
                  <select name="publish" value={formData.publish} onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Make Product Popular?</label>
                  <select name="popular" value={formData.popular} onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Insert to Deal of the day?</label>
                  <select name="dealOfDay" value={formData.dealOfDay} onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Select Brand</label>
                  <select name="brand" value={formData.brand} onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white">
                    <option value="">Select Brand</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Assign to Seller
                    <span className="text-xs text-neutral-400 ml-1">(blank = Admin Store)</span>
                  </label>
                  <select name="seller" value={formData.seller} onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white">
                    <option value="">Admin Store (default)</option>
                    {sellers
                      .filter((s) => s.status === "Approved")
                      .map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.storeName} ({s.sellerName})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Select Tags</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="Select or create tags"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <p className="text-xs text-red-500 mt-1">This will help for search</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Product Small Description</label>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <p className="text-xs text-neutral-500">Write a short summary, or let AI suggest one.</p>
                  <button
                    type="button"
                    disabled={aiLoading || !formData.productName}
                    onClick={async () => {
                      setUploadError("");
                      if (!formData.productName) {
                        setUploadError("Enter product name before using AI description.");
                        return;
                      }
                      try {
                        setAiLoading(true);
                        const tags = formData.tags?.split(",").map((t) => t.trim()).filter(Boolean) || [];
                        const res = await generateProductDescriptionAI({
                          name: formData.productName,
                          category: formData.category || undefined,
                          tags,
                          existingDescription: formData.smallDescription || undefined,
                        });
                        if (res.success && res.data?.description) {
                          setFormData((prev) => ({ ...prev, smallDescription: res.data!.description }));
                        } else {
                          setUploadError(res.message || "Failed to generate AI description.");
                        }
                      } catch (err: any) {
                        setUploadError(err?.response?.data?.message || err?.message || "AI description failed.");
                      } finally {
                        setAiLoading(false);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                      aiLoading || !formData.productName
                        ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
                        : "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
                    }`}>
                    {aiLoading ? "Generating…" : "Generate with AI"}
                  </button>
                </div>
                <textarea
                  name="smallDescription"
                  value={formData.smallDescription}
                  onChange={handleChange}
                  placeholder="Enter Product Small Description"
                  rows={4}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* SEO Content Section */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <div className="bg-teal-600 text-white px-4 sm:px-6 py-3">
              <h2 className="text-lg font-semibold">SEO Content</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Title</label>
                <input type="text" name="seoTitle" value={formData.seoTitle} onChange={handleChange}
                  placeholder="Enter SEO Title"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">SEO Keywords</label>
                <input type="text" name="seoKeywords" value={formData.seoKeywords} onChange={handleChange}
                  placeholder="Enter SEO Keywords"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">SEO Image Alt Text</label>
                <input type="text" name="seoImageAlt" value={formData.seoImageAlt} onChange={handleChange}
                  placeholder="Enter SEO Image Alt Text"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">SEO Description</label>
                <textarea name="seoDescription" value={formData.seoDescription} onChange={handleChange}
                  placeholder="Enter SEO Description" rows={4}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none" />
              </div>
            </div>
          </div>

          {/* Add Variation Section */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <div className="bg-teal-600 text-white px-4 sm:px-6 py-3">
              <h2 className="text-lg font-semibold">Add Variation</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-neutral-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Title (e.g., 100g)</label>
                  <input
                    type="text"
                    value={variationForm.title}
                    onChange={(e) => setVariationForm({ ...variationForm, title: e.target.value })}
                    placeholder="100g"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Price *</label>
                  <input
                    type="number"
                    value={variationForm.price}
                    onChange={(e) => setVariationForm({ ...variationForm, price: e.target.value })}
                    placeholder="100"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Discounted Price</label>
                  <input
                    type="number"
                    value={variationForm.discPrice}
                    onChange={(e) => setVariationForm({ ...variationForm, discPrice: e.target.value })}
                    placeholder="80"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Stock (0 = Unlimited)</label>
                  <input
                    type="number"
                    value={variationForm.stock}
                    onChange={(e) => setVariationForm({ ...variationForm, stock: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={addVariation}
                    className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium">
                    Add Variation
                  </button>
                </div>
              </div>

              {variations.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-neutral-700 mb-2">Added Variations:</h3>
                  <div className="space-y-2">
                    {variations.map((variation, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-lg">
                        <div className="flex-1">
                          <span className="font-medium">{variation.title}</span>{" "}
                          - ₹{variation.price}
                          {variation.discPrice > 0 && (
                            <span className="text-green-600 ml-2">(₹{variation.discPrice})</span>
                          )}
                          <span className="ml-4 text-sm text-neutral-600">
                            Stock: {variation.stock === 0 ? "Unlimited" : variation.stock}{" "}
                            | Status: {variation.status}
                          </span>
                        </div>
                        <button type="button" onClick={() => removeVariation(index)}
                          className="text-red-600 hover:text-red-700 ml-4">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add Other Details Section */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <div className="bg-teal-600 text-white px-4 sm:px-6 py-3">
              <h2 className="text-lg font-semibold">Add Other Details</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Manufacturer</label>
                  <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange}
                    placeholder="Enter Manufacturer"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Made In</label>
                  <input type="text" name="madeIn" value={formData.madeIn} onChange={handleChange}
                    placeholder="Enter Made In"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Select Tax</label>
                  <select name="tax" value={formData.tax} onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white">
                    <option value="">Select Tax</option>
                    {taxes.map((tax) => (
                      <option key={tax._id} value={tax._id}>{tax.name} ({tax.percentage}%)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">is Returnable?</label>
                  <select name="isReturnable" value={formData.isReturnable} onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Max Return Days</label>
                  <input type="number" name="maxReturnDays" value={formData.maxReturnDays} onChange={handleChange}
                    placeholder="Enter Max Return Days"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">FSSAI Lic. No.</label>
                  <input type="text" name="fssaiLicNo" value={formData.fssaiLicNo} onChange={handleChange}
                    placeholder="Enter FSSAI Lic. No."
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Total allowed quantity</label>
                  <input type="number" name="totalAllowedQuantity" value={formData.totalAllowedQuantity} onChange={handleChange}
                    placeholder="Enter Total allowed quantity"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
                  <p className="text-xs text-neutral-500 mt-1">Keep blank if no such limit</p>
                </div>
              </div>
            </div>
          </div>

          {/* Add Images Section */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <div className="bg-teal-600 text-white px-4 sm:px-6 py-3">
              <h2 className="text-lg font-semibold">Add Images</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
              {uploadError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {uploadError}
                </div>
              )}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {successMessage}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Product Main Image <span className="text-red-500">*</span>
                </label>
                <label className="block border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors cursor-pointer">
                  {mainImagePreview ? (
                    <div className="space-y-2">
                      <img src={mainImagePreview} alt="Main product preview"
                        className="max-h-48 mx-auto rounded-lg object-cover" />
                      <p className="text-sm text-neutral-600">{mainImageFile?.name}</p>
                      <button type="button"
                        onClick={(e) => { e.preventDefault(); setMainImageFile(null); setMainImagePreview(""); }}
                        className="text-sm text-red-600 hover:text-red-700">Remove</button>
                    </div>
                  ) : (
                    <div>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-neutral-400">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      <p className="text-sm text-neutral-600 font-medium">Upload Main Image</p>
                      <p className="text-xs text-neutral-500 mt-1">Max 5MB, JPG/PNG/WEBP</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleMainImageChange}
                    className="hidden" disabled={uploading} />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Product Gallery Images (Optional)
                </label>
                <div className="block border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center bg-white">
                  {galleryImagePreviews.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {galleryImagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img src={preview} alt={`Gallery ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg shadow-sm" />
                            <button type="button" onClick={() => removeGalleryImage(index)}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 shadow-md transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                              title="Remove image">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                        ))}
                        <label htmlFor="gallery-image-upload-admin"
                          className="w-full h-32 border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center text-neutral-400 hover:text-teal-600 hover:border-teal-500 hover:bg-teal-50 transition-all bg-neutral-50 cursor-pointer">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                          <span className="text-xs font-semibold">Add Image</span>
                        </label>
                      </div>
                      <p className="text-sm text-neutral-600">{galleryImageFiles.length} image(s) selected</p>
                    </div>
                  ) : (
                    <label htmlFor="gallery-image-upload-admin" className="cursor-pointer block w-full h-full">
                      <div className="flex flex-col items-center justify-center">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          className="mx-auto mb-2 text-neutral-400">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <p className="text-sm text-neutral-600 font-medium">Upload Other Product Images Here</p>
                        <p className="text-xs text-neutral-500 mt-1">Max 5MB per image, up to 10 images</p>
                      </div>
                    </label>
                  )}
                  <input id="gallery-image-upload-admin" type="file" accept="image/*" multiple
                    onChange={handleGalleryImagesChange} className="hidden" disabled={uploading} />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pb-6">
            <button
              type="submit"
              disabled={uploading}
              className={`px-8 py-3 rounded-lg font-medium text-lg transition-colors shadow-sm ${uploading
                ? "bg-neutral-400 cursor-not-allowed text-white"
                : "bg-teal-600 hover:bg-teal-700 text-white"
              }`}>
              {uploading ? "Processing..." : "Add Product"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
