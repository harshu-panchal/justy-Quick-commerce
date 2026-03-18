import { Request, Response } from "express";
import Product from "../../../models/Product";
import Category from "../../../models/Category";
import SubCategory from "../../../models/SubCategory";
import mongoose from "mongoose";
import Seller from "../../../models/Seller";
import HeaderCategory from "../../../models/HeaderCategory";
import { findSellersWithinRange } from "../../../utils/locationHelper";

// Get products with filtering options (public)
export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      category,
      subcategory,
      search,
      page = 1,
      limit = 20,
      sort,
      minPrice,
      maxPrice,
      brand,
      minDiscount,
      latitude, // User location latitude
      longitude, // User location longitude
    } = req.query;

    const query: any = {
      status: "Active",
      publish: true,
      // Exclude shop-by-store-only products from category pages
      $or: [
        { isShopByStoreOnly: { $ne: true } },
        { isShopByStoreOnly: { $exists: false } },
      ],
    };

    // Location-based filtering: Only show products from sellers within user's range
    const userLat = latitude ? parseFloat(latitude as string) : null;
    const userLng = longitude ? parseFloat(longitude as string) : null;

    // Identify scheduled versus quick delivery header categories
    const scheduledHeaders = await HeaderCategory.find({ deliveryType: 'scheduled' }).select('_id').lean();
    const scheduledIds = scheduledHeaders.map(h => h._id);

    if (userLat && userLng && !isNaN(userLat) && !isNaN(userLng)) {
      // Find sellers within user's location range
      const nearbySellerIds = await findSellersWithinRange(userLat, userLng);

      // We allow products that are either:
      // 1. In a scheduled delivery category (visible from any seller)
      // 2. From a seller within range (standard for quick delivery)
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { headerCategoryId: { $in: scheduledIds } },
          { seller: { $in: nearbySellerIds } }
        ]
      });
    } else {
      // If no location provided, all approved sellers are eligible (frontend handles selection)
      const allApprovedSellers = await Seller.find({ status: "Approved" }).select("_id").lean();
      const approvedSellerIds = allApprovedSellers.map(s => s._id);
      
      query.$and = query.$and || [];
      query.$and.push({
        seller: { $in: approvedSellerIds }
      });
    }

    // Helper to resolve category/subcategory ID from slug or ID
    const resolveId = async (
      model: any,
      value: string,
      modelName: string = ""
    ) => {
      if (mongoose.Types.ObjectId.isValid(value)) return value;

      // Build query - only check status if model has status field (Category has it, SubCategory might not)
      const baseQuery: any = {};
      if (modelName === "Category") {
        baseQuery.status = "Active";
      }

      // Try exact slug match first
      let item = await model
        .findOne({ ...baseQuery, slug: value })
        .select("_id")
        .lean();
      if (item) return item._id;

      // Try case-insensitive slug match
      item = await model
        .findOne({
          ...baseQuery,
          slug: { $regex: new RegExp(`^${value}$`, "i") },
        })
        .select("_id")
        .lean();
      if (item) return item._id;

      // Try name match as fallback (case-insensitive) - replace hyphens/underscores with spaces
      let namePattern = value.replace(/[-_]/g, " ");
      item = await model
        .findOne({
          ...baseQuery,
          name: { $regex: new RegExp(`^${namePattern}$`, "i") },
        })
        .select("_id")
        .lean();
      if (item) return item._id;

      // Special handling for Category and "and" -> "&"
      if (modelName === "Category" && value.includes("and")) {
        const withAmpersand = value.replace(/-and-/g, " & ").replace(/-/g, " ");
        item = await model
          .findOne({
            ...baseQuery,
            name: { $regex: new RegExp(`^${withAmpersand}$`, "i") },
          })
          .select("_id")
          .lean();
        if (item) return item._id;
      }

      return null;
    };

    if (category) {
      const categoryId = await resolveId(
        Category,
        category as string,
        "Category"
      );

      if (categoryId) {
        if (!subcategory) {
          // If no specific subcategory is requested, fetch all products (including from subcategories)
          const newHierarchySubs = await Category.find({ parentId: categoryId, status: "Active" }).select("_id").lean();
          const oldHierarchySubs = await SubCategory.find({ category: categoryId }).select("_id").lean();

          const subIds = [
            ...newHierarchySubs.map(s => s._id),
            ...oldHierarchySubs.map(s => s._id)
          ];

          query.$and = query.$and || [];
          if (subIds.length > 0) {
            query.$and.push({
              $or: [
                { category: categoryId },
                { subcategory: { $in: subIds } },
                { category: { $in: subIds } } // In case legacy products mapped subcategory to category field
              ]
            });
          } else {
            query.$and.push({ category: categoryId });
          }
        }
        // If subcategory is present, we let the subcategory block below handle the query
      }
    }

    if (subcategory) {
      // Try to resolve from Category model first (new structure where subcategories are categories with parentId)
      let subcategoryId = await resolveId(
        Category,
        subcategory as string,
        "Category"
      );
      // If not found in Category, try old SubCategory model (backward compatibility)
      if (!subcategoryId) {
        subcategoryId = await resolveId(
          SubCategory,
          subcategory as string,
          "SubCategory"
        );
      }

      if (subcategoryId) {
        // Find if any subcategories exist for this subcategoryId (in case it's used as a category)
        const childSubs = await Category.find({ parentId: subcategoryId, status: "Active" }).select("_id").lean();
        const childSubIds = childSubs.map(s => s._id);

        if (childSubIds.length > 0) {
          query.$or = [
            { subcategory: subcategoryId },
            { category: subcategoryId },
            { subcategory: { $in: childSubIds } },
            { category: { $in: childSubIds } }
          ];
        } else {
          query.$or = [
            { subcategory: subcategoryId },
            { category: subcategoryId }
          ];
        }
      }
    }

    if (brand) {
      query.brand = brand;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (minDiscount) {
      query.discount = { $gte: Number(minDiscount) };
    }

    if (search) {
      // Use text search for broad matching
      query.$text = { $search: search as string };
    }

    // Calculate skip for pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build sort object
    let sortOptions: any = { createdAt: -1 }; // Default new to old
    if (sort === "price_asc") sortOptions = { price: 1 };
    if (sort === "price_desc") sortOptions = { price: -1 };
    if (sort === "discount") sortOptions = { discount: -1 };
    if (sort === "popular") sortOptions = { popular: -1, dealOfDay: -1 };

    const products = await Product.find(query)
      .populate("category", "name icon image")
      .populate("subcategory", "name")
      .populate("brand", "name")
      .populate("seller", "storeName")
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

/**
 * Get products by subcategory slug with delivery mode logic (Public)
 * Rules:
 * 1. Quick Delivery Categories: Vegetables, Pan Corner, Bakery, Grocery, etc.
 *    - Filter by user's pincode.
 * 2. Scheduled Delivery Categories: Electronics, Beauty, Fashion, etc.
 *    - Visible to all users.
 */
export const getProductsBySubcategory = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { pincode } = req.query;

    console.log(`[getProductsBySubcategory] slug: ${slug}, pincode: ${pincode}`);

    // 1. Resolve subcategory and its parent to determine delivery mode
    // We check Category model (new hierarchy: subcategories have parentId)
    let subcategory = await Category.findOne({
      slug: { $regex: new RegExp(`^${slug}$`, "i") },
      status: "Active",
    }).populate("parentId").lean();

    // Fallback to old SubCategory model if not found in new structure
    if (!subcategory) {
      const oldSub = await SubCategory.findOne({
        slug: { $regex: new RegExp(`^${slug}$`, "i") }
      }).populate("category").lean();

      if (oldSub) {
        subcategory = {
          _id: oldSub._id,
          name: oldSub.name,
          slug: slug,
          parentId: (oldSub as any).category,
          status: "Active"
        } as any;
      }
    }

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    // Fix: Properly determine isScheduled from HeaderCategory, not keywords
    const isScheduled =
      (subcategory.headerCategoryId as any)?.deliveryType === 'scheduled' ||
      (subcategory.parentId as any)?.headerCategoryId?.deliveryType === 'scheduled';

    // 3. Seller Filtering (only for quick delivery products if pincode is provided)
    let eligibleSellerIds: mongoose.Types.ObjectId[] = [];
    if (!isScheduled && pincode) {
      const sellersInPincode = await Seller.find({
        pincode: pincode,
        status: "Approved"
      }).select("_id").lean();
      eligibleSellerIds = sellersInPincode.map(s => s._id);
    } else {
      // For scheduled delivery or if no pincode, all approved sellers are eligible
      const allApprovedSellers = await Seller.find({ status: "Approved" }).select("_id").lean();
      eligibleSellerIds = allApprovedSellers.map(s => s._id);
    }

    if (eligibleSellerIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        deliveryMode: isScheduled ? "Scheduled" : "Quick",
        message: isScheduled
          ? "No sellers found for this subcategory."
          : "No quick delivery sellers found in your area for this subcategory."
      });
    }

    // 4. Product Query
    const productQuery: any = {
      $or: [
        { subcategory: subcategory._id },
        { subcategory: subcategory._id.toString() },
        { category: subcategory._id },
        { category: subcategory._id.toString() }
      ],
      status: "Active",
      publish: true,
      seller: { $in: eligibleSellerIds } // Filter by eligible sellers
    };

    const products = await Product.find(productQuery)
      .populate({
        path: "category",
        select: "name slug headerCategoryId",
        populate: {
          path: "headerCategoryId",
          select: "deliveryType"
        }
      })
      .populate({
        path: "subcategory",
        select: "name slug headerCategoryId",
        populate: {
          path: "headerCategoryId",
          select: "deliveryType"
        }
      })
      .populate("seller", "storeName pincode logo deliveryTimeMin deliveryTimeMax")
      .populate("headerCategoryId", "deliveryType")
      .sort({ createdAt: -1 })
      .lean();

    const formattedProducts = products.map((p: any) => {
      const isProdScheduled =
        p.headerCategoryId?.deliveryType === 'scheduled' ||
        (p.category as any)?.headerCategoryId?.deliveryType === 'scheduled' ||
        (p.subcategory as any)?.headerCategoryId?.deliveryType === 'scheduled';

      return {
        ...p,
        id: p._id.toString(),
        price: p.variations?.[0]?.price || p.price,
        mrp: p.variations?.[0]?.discPrice || p.compareAtPrice || p.price,
        image: p.mainImage,
        name: p.productName,
        isAvailable: isProdScheduled ? true : (pincode ? (p.seller?.pincode === pincode) : false)
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedProducts,
      deliveryMode: isScheduled ? "Scheduled" : "Quick",
      subcategoryName: subcategory.name,
      parentName: (subcategory.parentId as any)?.name
    });

  } catch (error: any) {
    console.error("Error in getProductsBySubcategory:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching subcategory products",
      error: error.message
    });
  }
};

// Get single product by ID (public)
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.query; // User location

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findOne({
      _id: id,
    })
      .populate({
        path: "category",
        select: "name headerCategoryId",
        populate: {
          path: "headerCategoryId",
          select: "deliveryType"
        }
      })
      .populate({
        path: "subcategory",
        select: "name headerCategoryId",
        populate: {
          path: "headerCategoryId",
          select: "deliveryType"
        }
      })
      .populate("brand", "name")
      .populate(
        "seller",
        "storeName city fssaiLicNo address location serviceRadiusKm"
      )
      .populate("headerCategoryId", "deliveryType");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unavailable",
      });
    }

    // Parse location
    const userLat = latitude ? parseFloat(latitude as string) : null;
    const userLng = longitude ? parseFloat(longitude as string) : null;
    const seller = product.seller as any;

    // Initialize availability flag
    let isAvailableAtLocation = false;

    // Safely get seller ID - handle both populated and unpopulated cases
    let sellerId: mongoose.Types.ObjectId | null = null;
    if (seller) {
      if (typeof seller === "object" && seller._id) {
        // Seller is populated
        sellerId = seller._id;
      } else if (seller instanceof mongoose.Types.ObjectId) {
        // Seller is an ObjectId (not populated)
        sellerId = seller;
      } else if (typeof seller === "string") {
        // Seller is a string ID
        sellerId = new mongoose.Types.ObjectId(seller);
      }
    }

    // Check location availability if coordinates are provided
    const isScheduled = 
      (product.headerCategoryId as any)?.deliveryType === "scheduled" ||
      (product.category as any)?.headerCategoryId?.deliveryType === "scheduled" ||
      (product.subcategory as any)?.headerCategoryId?.deliveryType === "scheduled";

    if (isScheduled) {
      isAvailableAtLocation = true;
    } else if (
      userLat &&
      userLng &&
      !isNaN(userLat) &&
      !isNaN(userLng) &&
      sellerId &&
      seller?.location
    ) {
      const nearbySellerIds = await findSellersWithinRange(userLat, userLng);
      isAvailableAtLocation = nearbySellerIds.some(
        (id) => id.toString() === sellerId!.toString()
      );
    } else if (!userLat || !userLng) {
      // If no location provided, quick delivery products are not available
      isAvailableAtLocation = false;
    }

    // Find similar products (by category)
    // Filter by location
    const similarProductsQuery: any = {
      _id: { $ne: product._id },
      status: "Active",
      publish: true,
      // Exclude shop-by-store-only products from similar products
      $or: [
        { isShopByStoreOnly: { $ne: true } },
        { isShopByStoreOnly: { $exists: false } },
      ],
    };

    // Safely get category ID - handle both populated and unpopulated cases
    let categoryId: mongoose.Types.ObjectId | null = null;
    if (product.category) {
      if (
        typeof product.category === "object" &&
        (product.category as any)._id
      ) {
        // Category is populated
        categoryId = (product.category as any)._id;
      } else if (product.category instanceof mongoose.Types.ObjectId) {
        // Category is an ObjectId (not populated)
        categoryId = product.category;
      } else if (typeof product.category === "string") {
        // Category is a string ID
        categoryId = new mongoose.Types.ObjectId(product.category);
      }
    }

    // Only add category filter if we have a valid category ID
    if (categoryId) {
      similarProductsQuery.category = categoryId;
    }

    // Filter similar products by location (only for quick delivery)
    if (userLat && userLng && !isNaN(userLat) && !isNaN(userLng)) {
      const nearbySellerIds = await findSellersWithinRange(userLat, userLng);
      const scheduledHeaders = await HeaderCategory.find({ deliveryType: 'scheduled' }).select('_id').lean();
      const scheduledIds = scheduledHeaders.map(h => h._id);

      similarProductsQuery.$and = similarProductsQuery.$and || [];
      similarProductsQuery.$and.push({
        $or: [
          { headerCategoryId: { $in: scheduledIds } },
          { seller: { $in: nearbySellerIds } }
        ]
      });
    } else {
      // If no location, only show scheduled similar products
      const scheduledHeaders = await HeaderCategory.find({ deliveryType: 'scheduled' }).select('_id').lean();
      const scheduledIds = scheduledHeaders.map(h => h._id);
      similarProductsQuery.headerCategoryId = { $in: scheduledIds };
    }

    const similarProducts = await Product.find(similarProductsQuery)
      .limit(6)
      .select(
        "productName price mrp variations mainImage pack discount _id rating reviewsCount"
      );

    return res.status(200).json({
      success: true,
      data: {
        ...product.toObject(),
        similarProducts,
        isAvailableAtLocation, // Add availability flag to response
      },
    });
  } catch (error: any) {
    console.error("Error in getProductById:", {
      productId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Error fetching product details",
      error: error.message,
    });
  }
};
