import { Request, Response } from "express";
import Category from "../../../models/Category";
import SubCategory from "../../../models/SubCategory";
import HeaderCategory from "../../../models/HeaderCategory";
import Product from "../../../models/Product";
import mongoose from "mongoose";
import { cache } from "../../../utils/cache";

// Get all categories (public) - with caching
export const getCategories = async (_req: Request, res: Response) => {
  try {
    const cacheKey = "customer-categories-list";

    // Try cache first
    let categories = cache.get(cacheKey);

    if (!categories) {
      categories = await Category.find({
        status: "Active", // Only return active categories
      })
        .sort({ order: 1 })
        .select("name image icon description color slug _id")
        .lean(); // Use lean() for better performance

      // Cache for 10 minutes
      cache.set(cacheKey, categories, 10 * 60 * 1000);
    }

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

// Get all categories with their subcategories (for menu/sidebar) - with caching
export const getCategoriesWithSubs = async (_req: Request, res: Response) => {
  try {
    const cacheKey = "customer-categories-tree";

    // Try cache first
    let categoriesWithSubs = cache.get(cacheKey);

    if (categoriesWithSubs) {
      return res.status(200).json({
        success: true,
        data: categoriesWithSubs,
      });
    }

    const [headerCategories, categories, subcategoriesFromModel] = await Promise.all([
      HeaderCategory.find({ status: "Published" }).sort({ order: 1 }).lean(),
      Category.find({ status: "Active" }).sort({ order: 1 }).lean(),
      SubCategory.find().sort({ order: 1 }).lean(),
    ]);

    // Build product count maps
    const activeProductMatch = { status: "Active", publish: true };
    const [categoryCounts, subcategoryCounts] = await Promise.all([
      Product.aggregate([
        { $match: activeProductMatch },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      Product.aggregate([
        { $match: activeProductMatch },
        { $group: { _id: "$subcategory", count: { $sum: 1 } } },
      ]),
    ]);

    const categoryCountMap = new Map<string, number>();
    categoryCounts.forEach((item) => {
      if (item._id) categoryCountMap.set(item._id.toString(), item.count);
    });

    const subcategoryCountMap = new Map<string, number>();
    subcategoryCounts.forEach((item) => {
      if (item._id) subcategoryCountMap.set(item._id.toString(), item.count);
    });

    // Build the tree
    categoriesWithSubs = headerCategories.map((header) => {
      // Find categories belonging to this header
      const headerChildCategories = categories.filter(
        (cat) => cat.headerCategoryId?.toString() === header._id.toString() && !cat.parentId
      );

      const mappedCategories = headerChildCategories.map((cat) => {
        // Find subcategories for this category (from both models)
        // 1. From Category model (parentId)
        const subCatsFromCategory = categories.filter(
          (sub) => sub.parentId?.toString() === cat._id.toString()
        ).map(sub => ({
          _id: sub._id,
          name: sub.name,
          image: sub.image,
          order: sub.order,
          slug: sub.slug,
          count: categoryCountMap.get(sub._id.toString()) || 0
        }));

        // 2. From SubCategory model (category)
        const subCatsFromSub = subcategoriesFromModel.filter(
          (sub) => sub.category?.toString() === cat._id.toString()
        ).map(sub => ({
          _id: sub._id,
          name: sub.name,
          image: sub.image,
          order: sub.order,
          slug: sub.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          count: subcategoryCountMap.get(sub._id.toString()) || 0
        }));

        const allSubs = [...subCatsFromCategory, ...subCatsFromSub]
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        // Filter out subcategories with no products
        const filteredSubs = allSubs.filter(sub => sub.count > 0);

        const directCategoryCount = categoryCountMap.get(cat._id.toString()) || 0;
        const totalProducts = directCategoryCount + filteredSubs.reduce((acc, s) => acc + s.count, 0);

        return {
          ...cat,
          subcategories: filteredSubs,
          totalProducts
        };
      }).filter(cat => cat.totalProducts > 0);

      const totalHeaderProducts = mappedCategories.reduce((acc, cat) => acc + cat.totalProducts, 0);

      return {
        ...header,
        categories: mappedCategories,
        totalProducts: totalHeaderProducts
      };
    }).filter(header => header.totalProducts > 0);

    // Cache for 10 minutes
    cache.set(cacheKey, categoriesWithSubs, 10 * 60 * 1000);

    return res.status(200).json({
      success: true,
      data: categoriesWithSubs,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching categories tree",
      error: error.message,
    });
  }
};

// Get single category details with subcategories - with caching
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cacheKey = `customer-category-${id}`;

    // Try cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached,
      });
    }

    console.log(`[getCategoryById] Looking for category with id/slug: ${id}`);
    let category;

    // Try to find by ObjectId first (only active categories for public endpoint)
    if (mongoose.Types.ObjectId.isValid(id)) {
      category = await Category.findOne({
        _id: id,
        status: "Active",
      }).lean();
    }

    // If not found by ID, try by slug (case-insensitive, only active categories)
    if (!category) {
      // Try exact slug match first
      category = await Category.findOne({
        slug: id,
        status: "Active",
      }).lean();

      // Try case-insensitive slug match
      if (!category) {
        category = await Category.findOne({
          slug: { $regex: new RegExp(`^${id}$`, "i") },
          status: "Active",
        }).lean();
      }

      // Try name match as fallback (case-insensitive)
      if (!category) {
        // First try standard replacement
        let namePattern = id.replace(/[-_]/g, " ");
        category = await Category.findOne({
          name: { $regex: new RegExp(`^${namePattern}$`, "i") },
          status: "Active",
        }).lean();

        // If not found, try replacing " and " with " & " specifically for categories like "Vegetables & Fruits"
        if (!category && id.includes("and")) {
          const withAmpersand = id.replace(/-and-/g, " & ").replace(/-/g, " ");
          category = await Category.findOne({
            name: { $regex: new RegExp(`^${withAmpersand}$`, "i") },
            status: "Active",
          }).lean();
        }
      }
    }

    if (!category) {
      // Check if it's a subcategory
      if (mongoose.Types.ObjectId.isValid(id)) {
        const subcategory = await SubCategory.findById(id).lean();
        if (subcategory) {
          // Find the parent category
          category = await Category.findById(subcategory.category).lean();
          if (category) {
            // Return both for the frontend to decide
            const subcategories = await SubCategory.find({
              category: category._id,
            })
              .select("name image order category")
              .sort({
                order: 1,
              });
            return res.status(200).json({
              success: true,
              data: {
                category,
                subcategories,
                currentSubcategory: subcategory,
              },
            });
          }
        }
      }

      console.log(`[getCategoryById] Category not found: ${id}`);
      return res.status(404).json({
        success: false,
        message: `Category not found: ${id}`,
      });
    }

    console.log(
      `[getCategoryById] Found category: ${category.name} (${category._id})`
    );

    // Ensure category._id is treated as ObjectId for the query
    let catId = category._id;
    if (typeof catId === 'string') {
      try {
        catId = new mongoose.Types.ObjectId(catId);
      } catch (e) {
        console.error("Failed to cast category ID to ObjectId:", e);
      }
    }

    // Query for BOTH ObjectId and String representation to be safe against legacy data references
    // Use Category model to find subcategories (children) instead of separate SubCategory model
    // Using parentId to find children
    const subcategories = await Category.find({
      parentId: { $in: [catId, catId.toString()] },
      status: "Active"
    })
      .select("name image order slug icon")
      .sort({
        order: 1,
      });

    console.log(`[getCategoryById] Found ${subcategories.length} subcategories for ${category.name}`);

    const responseData = {
      category,
      subcategories,
      currentSubcategory: null,
    };

    // Cache for 10 minutes
    cache.set(cacheKey, responseData, 10 * 60 * 1000);

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching category details",
      error: error.message,
    });
  }
};
