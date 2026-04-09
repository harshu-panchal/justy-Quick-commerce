import { Request, Response } from "express";
import Product from "../../../models/Product";
import SubCategory from "../../../models/SubCategory";
import Shop from "../../../models/Shop";
import { asyncHandler } from "../../../utils/asyncHandler";
import { cache } from "../../../utils/cache";
import AppSettings from "../../../models/AppSettings";
import Seller from "../../../models/Seller";

/**
 * Create a new product
 */
export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const productData = req.body;
    console.log("DEBUG: createProduct received body:", JSON.stringify(productData, null, 2));

    // 1. Check product limits
    const settings = await AppSettings.getSettings();
    if (settings.sellerProductConfig?.isEnabled) {
      const seller = await Seller.findById(sellerId).select("freeProductsAdded paidSlotsTotal");
      if (!seller) {
        return res.status(404).json({
          success: false,
          message: "Seller not found",
        });
      }

      const maxFree = settings.sellerProductConfig.maxFreeProducts || 0;
      const paidSlots = seller.paidSlotsTotal || 0;
      const totalAllowed = maxFree + paidSlots;
      const currentCount = await Product.countDocuments({ seller: sellerId });

      if (currentCount >= totalAllowed) {
        return res.status(402).json({
          success: false,
          limitReached: true,
          message: "Product limit reached. Please purchase extra slots to add more products.",
          currentCount,
          maxFree,
          paidSlots,
          totalAllowed,
        });
      }

      // Track if we should increment freeProductsAdded
      if (currentCount < maxFree) {
        (req as any).shouldIncrementFree = true;
      }
    }

    // Ensure sellerId matches authenticated seller
    if (productData.sellerId && productData.sellerId !== sellerId) {
      return res.status(403).json({
        success: false,
        message: "You can only create products for your own account",
      });
    }

    // 2. Map fields to match Product model
    // Support both old static form (sends headerCategoryId/categoryId/brandId)
    // and new dynamic form (sends headerCategory/category/brand directly)
    const newProductData: any = {
      ...productData,
      seller: sellerId,
      headerCategoryId: productData.headerCategoryId || productData.headerCategory,
      category: productData.categoryId || productData.category,
      subcategory: productData.subcategoryId || productData.subcategory,
      subcategoryModel: "SubCategory", // Default
      brand: productData.brandId || productData.brand || undefined,
      brandName: productData.brandName,
      mainImage: productData.mainImageUrl || productData.mainImage,
      galleryImages: productData.galleryImageUrls || productData.galleryImages || [],
    };

    // Map variations: Ensure 'title' from frontend is mapped to 'value' (or name) expected by Schema
    if (newProductData.variations) {
      newProductData.variations = newProductData.variations.map((v: any) => ({
        ...v,
        value: v.value || v.title, // Map title to value
        name: v.name || "Variation", // Default name
        discPrice: v.discPrice || 0,
        status: v.status || "Available",
      }));
    }

    // 3. Set Price and Stock from Variations (only if variations exist)
    if (newProductData.variations && newProductData.variations.length > 0) {
      // Use the price of the first variation as the base price
      newProductData.price = newProductData.variations[0].price;
      newProductData.discPrice = newProductData.variations[0].discPrice || 0;

      // Calculate total stock (sum of all variations)
      newProductData.stock = newProductData.variations.reduce(
        (acc: number, curr: any) => acc + (parseInt(curr.stock) || 0),
        0
      );
    }

    // 3.5 Map Dynamic Fields back to Core Static Fields
    if (newProductData.dynamicFields && newProductData.headerCategoryId) {
      const ProductField = (await import("../../../models/ProductField")).default;
      const fields = await ProductField.find({ headerCategory: newProductData.headerCategoryId });
      
      for (const [fieldId, value] of Object.entries(newProductData.dynamicFields)) {
        const fieldDef = fields.find(f => f._id.toString() === fieldId);
        if (fieldDef) {
          const label = fieldDef.label.toLowerCase();
          if (label.includes('product name') && !newProductData.productName) newProductData.productName = value;
          if (label === 'price' && (!newProductData.price || newProductData.price === 0)) newProductData.price = Number(value);
          if (label === 'stock' && (!newProductData.stock || newProductData.stock === 0)) newProductData.stock = Number(value);
          if (label.includes('description') && !newProductData.description) newProductData.description = value;
          if (label.includes('main image') && !newProductData.mainImage) newProductData.mainImage = value;
          if ((label.includes('compare at price') || label === 'mrp') && !newProductData.compareAtPrice) newProductData.compareAtPrice = Number(value);
        }
      }
    }

    // 4. Ensure price and stock have valid defaults for dynamic forms
    if (newProductData.price === undefined || newProductData.price === null || newProductData.price === "") {
      newProductData.price = 0;
    }
    newProductData.price = Number(newProductData.price);
    if (newProductData.stock === undefined || newProductData.stock === null || newProductData.stock === "") {
      newProductData.stock = 0;
    }
    newProductData.stock = Number(newProductData.stock);

    // 5. Clean up undefined/empty fields
    if (!newProductData.headerCategoryId)
      delete newProductData.headerCategoryId;
    if (!newProductData.category)
      delete newProductData.category;
    if (!newProductData.subcategory) {
      delete newProductData.subcategory;
      delete newProductData.subcategoryModel;
    } else {
      // Determine which collection the subcategory belongs to
      // First check old SubCategory collection
      const isOldSub = await SubCategory.findById(newProductData.subcategory).lean();
      if (isOldSub) {
        // Old-style: stored in SubCategory collection
        newProductData.subcategoryModel = "SubCategory";
      } else {
        // New-style: stored in Category collection (has parentId)
        // We set "Category" regardless — if the ID doesn't exist, it's a dangling ref
        // but at least the model field is correct
        newProductData.subcategoryModel = "Category";
      }
    }
    console.log("DEBUG: newProductData before save:", JSON.stringify({
      subcategory: newProductData.subcategory,
      subcategoryModel: newProductData.subcategoryModel
    }, null, 2));
    if (!newProductData.brand) delete newProductData.brand;
    if (!newProductData.brandName) delete newProductData.brandName;
    if (newProductData.sku === "" || newProductData.sku === null) {
      delete newProductData.sku;
    } else if (newProductData.sku) {
      // Ensure SKU is truly unique by trimming and converting to uppercase if desired,
      // but at least trimming is already done by schema.
      newProductData.sku = newProductData.sku.toString().trim();
    }

    // Handle Tax: Frontend sends taxId, Model expects 'tax' (string) or something else?
    // Checking SellerAddProduct.tsx sending taxId -> formData.tax
    // Model Product.ts -> tax: { type: String }
    // Ideally we should store the Tax ID or Name. Since frontend sends ID, let's map it.
    if (productData.taxId) {
      newProductData.tax = productData.taxId;
    }

    // Validate variation prices (only if variations exist)
    if (productData.variations && Array.isArray(productData.variations)) {
      for (const variation of productData.variations) {
        if (Number(variation.discPrice) > Number(variation.price)) {
          return res.status(400).json({
            success: false,
            message: `Discounted price (${variation.discPrice}) cannot be greater than price (${variation.price}) for variation ${variation.title}`,
          });
        }
      }
    }

    // 6. Set product status - Products MUST require admin approval
    newProductData.publish = false;
    newProductData.status = "Pending";
    newProductData.requiresApproval = true;

    // Set default values for other required fields if not provided
    if (newProductData.popular === undefined) newProductData.popular = false;
    if (newProductData.dealOfDay === undefined) newProductData.dealOfDay = false;
    if (!newProductData.isReturnable) newProductData.isReturnable = false;
    if (!newProductData.rating) newProductData.rating = 0;
    if (!newProductData.reviewsCount) newProductData.reviewsCount = 0;
    if (!newProductData.discount) newProductData.discount = 0;
    if (!newProductData.tags) newProductData.tags = [];

    // Handle Shop by Store fields
    if (productData.isShopByStoreOnly !== undefined) {
      newProductData.isShopByStoreOnly = productData.isShopByStoreOnly === true || productData.isShopByStoreOnly === "true";
    }
    if (productData.shopId) {
      newProductData.shopId = productData.shopId;
    } else if (newProductData.isShopByStoreOnly) {
      // If shop by store only is true but no shopId provided, set to null
      newProductData.shopId = null;
    }

    const product = await Product.create(newProductData);

    // 7. Update seller counter if it was a free slot
    if ((req as any).shouldIncrementFree) {
      await Seller.findByIdAndUpdate(sellerId, { $inc: { freeProductsAdded: 1 } });
    }

    // Invalidate home page cache
    cache.invalidatePattern(/home-content/);

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  }
);

/**
 * Get seller's products with filters
 */
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user.userId;
  const {
    search,
    category,
    status,
    stock,
    page = "1",
    limit = "10",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build query
  const query: any = { seller: sellerId };

  // Search filter
  if (search) {
    query.$or = [
      { productName: { $regex: search, $options: "i" } },
      { smallDescription: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search as string, "i")] } },
    ];
  }

  // Category filter
  if (category) {
    query.category = category;
  }

  // Status filter (publish, popular, dealOfDay)
  if (status) {
    if (status === "published") {
      query.publish = true;
    } else if (status === "unpublished") {
      query.publish = false;
    } else if (status === "popular") {
      query.popular = true;
    } else if (status === "dealOfDay") {
      query.dealOfDay = true;
    }
  }

  // Stock filter
  if (stock === "inStock") {
    query.stock = { $gt: 0 };
  } else if (stock === "outOfStock") {
    // Check for products where total stock is 0
    // This implies all variations are out of stock
    query.stock = 0;
  }

  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Sort
  const sort: any = {};
  sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

  const products = await Product.find(query)
    .populate("category", "name")
    .populate("subcategory", "name")
    .populate("brand", "name")

    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const total = await Product.countDocuments(query);

  return res.status(200).json({
    success: true,
    message: "Products fetched successfully",
    data: products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * Get product by ID
 */
export const getProductById = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;

    // Prevent reserved route names from being treated as product IDs
    const reservedRoutes = ["shops", "brands"];
    if (reservedRoutes.includes(id)) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = await Product.findOne({ _id: id, seller: sellerId })
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("headerCategoryId", "name slug")
      .populate("brand", "name")
  ;

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: product,
    });
  }
);

/**
 * Update product
 */
export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;
    const updateData = req.body;

    // Map Dynamic Fields back to Core Static Fields if applicable
    if (updateData.dynamicFields && (updateData.headerCategoryId || updateData.headerCategory)) {
      const hcId = updateData.headerCategoryId || updateData.headerCategory;
      const ProductField = (await import("../../../models/ProductField")).default;
      const fields = await ProductField.find({ headerCategory: hcId });

      for (const [fieldId, value] of Object.entries(updateData.dynamicFields)) {
        const fieldDef = fields.find(f => f._id.toString() === fieldId);
        if (fieldDef) {
          const label = fieldDef.label.toLowerCase();
          if (label.includes('product name')) updateData.productName = value;
          if (label === 'price') updateData.price = Number(value);
          if (label === 'stock') updateData.stock = Number(value);
          if (label.includes('description')) updateData.description = value;
          if (label.includes('main image')) updateData.mainImage = value;
          if (label.includes('compare at price') || label === 'mrp') updateData.compareAtPrice = Number(value);
        }
      }
    }

    console.log("DEBUG updateProduct: sellerId from token:", sellerId);
    console.log("DEBUG updateProduct: productId:", id);

    // Remove sellerId and status fields from update data (cannot change owner or status)
    delete updateData.sellerId;
    delete updateData.publish; 
    delete updateData.status;

    // Map frontend field names to model field names (same as createProduct)
    if (updateData.headerCategoryId !== undefined) {
      // Allow null/empty to clear header category
      updateData.headerCategoryId = updateData.headerCategoryId || null;
    }
    if (updateData.categoryId) {
      updateData.category = updateData.categoryId;
      delete updateData.categoryId;
    }
    if (updateData.subcategoryId) {
      updateData.subcategory = updateData.subcategoryId;
      // Determine which collection the subcategory belongs to
      const isOldSub = await SubCategory.findById(updateData.subcategory).lean();
      updateData.subcategoryModel = isOldSub ? "SubCategory" : "Category";
      delete updateData.subcategoryId;
    }
    if (updateData.brandId !== undefined) {
      updateData.brand = updateData.brandId || null;
      delete updateData.brandId;
    }
    if (updateData.brandName !== undefined) {
      updateData.brandName = updateData.brandName || null;
    }
    if (updateData.taxId) {
      updateData.tax = updateData.taxId;
      delete updateData.taxId;
    }
    if (updateData.mainImageUrl) {
      updateData.mainImage = updateData.mainImageUrl;
      delete updateData.mainImageUrl;
    }
    if (updateData.galleryImageUrls) {
      updateData.galleryImages = updateData.galleryImageUrls;
      delete updateData.galleryImageUrls;
    }
    if (updateData.sku === "" || updateData.sku === null) {
      updateData.sku = undefined;
    } else if (updateData.sku) {
      updateData.sku = updateData.sku.toString().trim();
    }

    // Validate variations if provided
    if (updateData.variations) {
      if (updateData.variations.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Product must have at least one variation",
        });
      }

      // Map variations and validate prices
      updateData.variations = updateData.variations.map((v: any) => ({
        ...v,
        value: v.value || v.title,
        name: v.name || "Variation",
        discPrice: v.discPrice || 0,
        status: v.status || "Available",
      }));

      for (const variation of updateData.variations) {
        if (Number(variation.discPrice) > Number(variation.price)) {
          return res.status(400).json({
            success: false,
            message: `Discounted price cannot be greater than price for variation ${variation.title || variation.value
              }`,
          });
        }
      }

      // Sync top-level price and stock from variations (same as createProduct)
      updateData.price = updateData.variations[0].price;
      updateData.discPrice = updateData.variations[0].discPrice || 0;
      updateData.stock = updateData.variations.reduce(
        (acc: number, curr: any) => acc + (parseInt(curr.stock) || 0),
        0
      );
    }

    // Handle Shop by Store fields
    if (updateData.isShopByStoreOnly !== undefined) {
      updateData.isShopByStoreOnly = updateData.isShopByStoreOnly === true || updateData.isShopByStoreOnly === "true";
    }
    if (updateData.shopId !== undefined) {
      // Allow null to clear shopId
      updateData.shopId = updateData.shopId || null;
    } else if (updateData.isShopByStoreOnly === false) {
      // If shop by store only is false, clear shopId
      updateData.shopId = null;
    }

    // Use findOne and then save to trigger pre-save hooks
    const product = await Product.findOne({ _id: id, seller: sellerId });

    if (!product) {
      // Check if product exists at all
      const existingProduct = await Product.findById(id).select("seller");
      if (existingProduct) {
        console.log(
          "DEBUG updateProduct: product exists but owned by:",
          existingProduct.seller
        );
      }
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Clean up empty strings for ObjectId ref fields to prevent BSONError
    const objectIdFields = ["subcategory", "brand", "category", "headerCategoryId", "tax", "shopId"];
    for (const field of objectIdFields) {
      if (updateData[field] === "" || updateData[field] === null) {
        delete updateData[field];
      }
    }

    // Apply updates
    Object.assign(product, updateData);

    // If variations were updated, mark as modified
    if (updateData.variations) {
      product.markModified("variations");
    }

    await product.save();

    // Invalidate home page cache
    cache.invalidatePattern(/home-content/);

    // Re-populate for response
    const populatedProduct = await Product.findById(product._id)
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("headerCategoryId", "name slug")
      .populate("brand", "name")
  ;

    console.log("DEBUG updateProduct: product updated successfully");

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: populatedProduct,
    });
  }
);

/**
 * Delete product
 */
export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;

    console.log("DEBUG deleteProduct: sellerId from token:", sellerId);
    console.log("DEBUG deleteProduct: productId:", id);

    const product = await Product.findOneAndDelete({
      _id: id,
      seller: sellerId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Invalidate home page cache
    cache.invalidatePattern(/home-content/);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  }
);

/**
 * Update stock for a product variation
 */
export const updateStock = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user.userId;
  const { id } = req.params;
  const variationId = req.params.variationId || req.body.variationId;
  const { stock, status } = req.body;

  const product = await Product.findOne({ _id: id, seller: sellerId });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  const variation: any = product.variations?.find(
    (v: any) => v._id?.toString() === variationId
  );
  if (!variation) {
    return res.status(404).json({
      success: false,
      message: "Variation not found",
    });
  }

  if (stock !== undefined) {
    variation.stock = stock;
    // Automatically update status based on stock
    if (stock === 0) {
      variation.status = "Sold out";
    } else if (stock > 0 && variation.status === "Sold out") {
      variation.status = "Available";
    }
  }
  if (status) {
    variation.status = status;
  }

  // Mark variations as modified since we updated a sub-document field
  product.markModified("variations");
  await product.save();

  return res.status(200).json({
    success: true,
    message: "Stock updated successfully",
    data: product,
  });
});

/**
 * Update product status (publish, popular, dealOfDay)
 */
export const updateProductStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;
    const { publish, popular, dealOfDay } = req.body;

    const updateData: any = {};
    // Sellers CANNOT publish their own products; only admin can.
    // However, they can toggle popular/dealOfDay if permitted, or we can restrict that too.
    if (popular !== undefined) updateData.popular = popular;
    if (dealOfDay !== undefined) updateData.dealOfDay = dealOfDay;
    
    // If they attempt to publish, return forbidden or just ignore it.
    if (publish !== undefined) {
      return res.status(403).json({
        success: false,
        message: "Only administrators can publish products. Your update will remain pending approval."
      });
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, seller: sellerId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product status updated successfully",
      data: product,
    });
  }
);

/**
 * Bulk update stock for multiple products/variations
 */
export const bulkUpdateStock = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { updates } = req.body; // Array of { productId, variationId, stock }

    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: "Updates must be an array",
      });
    }

    const results = [];
    for (const update of updates) {
      const { productId, variationId, stock } = update;

      const product = await Product.findOne({
        _id: productId,
        seller: sellerId,
      });
      if (product) {
        const variation: any = product.variations?.find(
          (v: any) => v._id?.toString() === variationId
        );
        if (variation) {
          variation.stock = stock;
          if (stock === 0) variation.status = "Sold out";
          else if (stock > 0 && variation.status === "Sold out")
            variation.status = "In stock";

          await product.save();
          results.push({ productId, variationId, success: true });
        } else {
          results.push({
            productId,
            variationId,
            success: false,
            message: "Variation not found",
          });
        }
      } else {
        results.push({
          productId,
          variationId,
          success: false,
          message: "Product not found",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Bulk stock update processed",
      data: results,
    });
  }
);

/**
 * Get all active shops (for seller to select when creating shop-by-store-only products)
 */
export const getShops = asyncHandler(async (_req: Request, res: Response) => {
  const shops = await Shop.find({ isActive: true })
    .select("_id name storeId image")
    .sort({ order: 1, name: 1 })
    .lean();

  return res.status(200).json({
    success: true,
    message: "Shops fetched successfully",
    data: shops || [],
  });
});
