import { Request, Response } from "express";
import { ComboOffer, Product } from "../../../models";

// GET all combo offers (admin can see all, seller sees their own)
export const getAllComboOffers = async (req: Request, res: Response) => {
  try {
    const userType = req.user?.userType;
    const sellerId = req.user?.sellerId; // Extracted from auth middleware if seller
    const { status } = req.query; // live, pending, rejected, all

    const query: any = {};
    if (userType === "Seller" && sellerId) {
      query.sellerId = sellerId;
    }

    if (status === "pending") {
      query.isApproved = false;
      query.isActive = true;
    } else if (status === "live") {
      query.isApproved = true;
      query.isActive = true;
    }

    const combos = await ComboOffer.find(query)
      .populate("mainProduct", "productName price mainImage")
      .populate("comboProducts", "productName price mainImage")
      .populate("sellerId", "storeName sellerName")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: combos,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching combo offers",
      error: error.message,
    });
  }
};

// GET all pending seller combos for admin review
export const getPendingSellerCombos = async (_req: Request, res: Response) => {
  try {
    const combos = await ComboOffer.find({ creatorType: "seller", isApproved: false })
      .populate("mainProduct", "productName price mainImage")
      .populate("comboProducts", "productName price mainImage")
      .populate("sellerId", "storeName sellerName")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: combos,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching pending combos",
      error: error.message,
    });
  }
};

// Admin approves a combo
export const approveSellerCombo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const combo = await ComboOffer.findByIdAndUpdate(id, { isApproved: true }, { new: true });

    if (!combo) {
      return res.status(404).json({ success: false, message: "Combo Offer not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Combo offer approved successfully",
      data: combo,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error approving combo",
      error: error.message,
    });
  }
};

// Admin rejects a combo
export const rejectSellerCombo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // We can either delete it or mark it as rejected/inactive.
    // The requirement says "Approve / Reject". Let's just delete it for now or set isActive=false.
    // Deleting is cleaner if it's rejected.
    const combo = await ComboOffer.findByIdAndDelete(id);

    if (!combo) {
      return res.status(404).json({ success: false, message: "Combo Offer not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Combo offer rejected and removed",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error rejecting combo",
      error: error.message,
    });
  }
};

// GET single combo offer
export const getComboOfferById = async (req: Request, res: Response) => {
// ... (rest of the functions)
  try {
    const { id } = req.params;
    const combo = await ComboOffer.findById(id)
      .populate("mainProduct", "productName price mainImage")
      .populate("comboProducts", "productName price mainImage")
      .populate("sellerId", "storeName sellerName");

    if (!combo) {
      return res.status(404).json({ success: false, message: "Combo Offer not found" });
    }

    return res.status(200).json({
      success: true,
      data: combo,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching combo offer",
      error: error.message,
    });
  }
};

// POST create combo offer
export const createComboOffer = async (req: Request, res: Response) => {
  try {
    const { name, description, mainProduct, comboProducts, comboPrice, image, isActive, startDate, endDate } = req.body;

    // Validate main product
    const mainProd = await Product.findById(mainProduct);
    if (!mainProd) {
      return res.status(400).json({ success: false, message: "Main product not found" });
    }

    // Validate combo products
    if (!comboProducts || !Array.isArray(comboProducts) || comboProducts.length === 0) {
      return res.status(400).json({ success: false, message: "At least one combo product is required" });
    }

    const comboProds = await Product.find({ _id: { $in: comboProducts } });
    if (comboProds.length !== comboProducts.length) {
      return res.status(400).json({ success: false, message: "One or more combo products not found" });
    }

    // Ensure all products belong to the same seller
    const sellerId = mainProd.seller;
    for (const cp of comboProds) {
      if (cp.seller.toString() !== sellerId.toString()) {
        return res.status(400).json({ success: false, message: "All products in a combo must belong to the same seller" });
      }
    }

    // Authorization check for sellers
    if (req.user?.userType === "Seller" && req.user.sellerId !== sellerId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to create combo for this seller" });
    }

    // Calculate original price
    const originalPrice = mainProd.price + comboProds.reduce((sum, p) => sum + p.price, 0);

    if (comboPrice >= originalPrice) {
      return res.status(400).json({ success: false, message: "Combo price must be less than original price" });
    }

    const newComboOffer = new ComboOffer({
      name,
      description,
      mainProduct,
      comboProducts,
      comboPrice,
      originalPrice,
      image,
      sellerId,
      createdBy: req.user?.userId,
      creatorType: "admin",
      isApproved: true,
      isActive: isActive !== undefined ? isActive : true,
      startDate,
      endDate,
    });

    await newComboOffer.save();

    return res.status(201).json({
      success: true,
      message: "Combo offer created successfully",
      data: newComboOffer,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error creating combo offer",
      error: error.message,
    });
  }
};

// PUT update combo offer
export const updateComboOffer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const comboOffer = await ComboOffer.findById(id);
    if (!comboOffer) {
      return res.status(404).json({ success: false, message: "Combo offer not found" });
    }

    // Authorization check for sellers
    if (req.user?.userType === "Seller" && req.user.sellerId !== comboOffer.sellerId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to update this combo" });
    }

    // If products are changing, re-validate and recalculate original price
    if (updates.mainProduct || updates.comboProducts) {
      const mainProdId = updates.mainProduct || comboOffer.mainProduct;
      const comboProdIds = updates.comboProducts || comboOffer.comboProducts;

      const mainProd = await Product.findById(mainProdId);
      if (!mainProd) return res.status(400).json({ success: false, message: "Main product not found" });

      const comboProds = await Product.find({ _id: { $in: comboProdIds } });
      if (comboProds.length !== comboProdIds.length) return res.status(400).json({ success: false, message: "Combo products not found" });

      const sellerId = mainProd.seller;
      for (const cp of comboProds) {
        if (cp.seller.toString() !== sellerId.toString()) {
          return res.status(400).json({ success: false, message: "All products must belong to the same seller" });
        }
      }

      updates.originalPrice = mainProd.price + comboProds.reduce((sum, p) => sum + p.price, 0);
      updates.sellerId = sellerId;
      
      const priceToCheck = updates.comboPrice || comboOffer.comboPrice;
      if (priceToCheck >= updates.originalPrice) {
        return res.status(400).json({ success: false, message: "Combo price must be less than original price" });
      }
    } else if (updates.comboPrice && updates.comboPrice >= comboOffer.originalPrice) {
       return res.status(400).json({ success: false, message: "Combo price must be less than original price" });
    }

    const updatedComboOffer = await ComboOffer.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    return res.status(200).json({
      success: true,
      message: "Combo offer updated successfully",
      data: updatedComboOffer,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error updating combo offer",
      error: error.message,
    });
  }
};

// DELETE combo offer
export const deleteComboOffer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const comboOffer = await ComboOffer.findById(id);
    if (!comboOffer) {
      return res.status(404).json({ success: false, message: "Combo offer not found" });
    }

     // Authorization check for sellers
    if (req.user?.userType === "Seller" && req.user.sellerId !== comboOffer.sellerId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this combo" });
    }

    await ComboOffer.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Combo offer deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error deleting combo offer",
      error: error.message,
    });
  }
};
