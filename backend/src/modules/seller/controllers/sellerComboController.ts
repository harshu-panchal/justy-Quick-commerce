import { Request, Response } from "express";
import { ComboOffer, Product } from "../../../models";

/**
 * Seller creates a new combo offer
 * Requires admin approval before becoming live (isApproved=false)
 */
export const createSellerCombo = async (req: Request, res: Response) => {
  try {
    const { name, description, mainProduct, comboProducts, comboPrice, image, startDate, endDate } = req.body;
    const sellerId = (req as any).user?.userId;

    if (!sellerId) {
      return res.status(401).json({ success: false, message: "Seller session invalid" });
    }

    // Validate main product
    const mainProd = await Product.findById(mainProduct);
    if (!mainProd) {
      return res.status(400).json({ success: false, message: "Main product not found" });
    }

    if (mainProd.seller.toString() !== sellerId.toString()) {
      return res.status(403).json({ success: false, message: "You can only create combos with your own products" });
    }

    // Validate combo products
    if (!comboProducts || !Array.isArray(comboProducts) || comboProducts.length === 0) {
      return res.status(400).json({ success: false, message: "At least one combo product is required" });
    }

    const comboProds = await Product.find({ _id: { $in: comboProducts } });
    if (comboProds.length !== comboProducts.length) {
      return res.status(400).json({ success: false, message: "One or more combo products not found" });
    }

    for (const cp of comboProds) {
      if (cp.seller.toString() !== sellerId.toString()) {
        return res.status(400).json({ success: false, message: "All products in a combo must belong to you" });
      }
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
      createdBy: (req as any).user?.userId,
      creatorType: "seller",
      isApproved: false, // Must be approved by admin
      isActive: true,
      startDate,
      endDate,
    });

    await newComboOffer.save();

    return res.status(201).json({
      success: true,
      message: "Combo offer submitted for admin approval",
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

/**
 * Get all combo offers belonging to the authenticated seller
 */
export const getMyComboOffers = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).user?.userId;
    if (!sellerId) {
      return res.status(401).json({ success: false, message: "Seller session invalid" });
    }

    const combos = await ComboOffer.find({ sellerId })
      .populate("mainProduct", "productName price mainImage")
      .populate("comboProducts", "productName price mainImage")
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

/**
 * Delete a combo offer (seller can delete their own)
 */
export const deleteMyComboOffer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sellerId = (req as any).user?.userId;

    if (!sellerId) {
      return res.status(401).json({ success: false, message: "Seller session invalid" });
    }

    const comboOffer = await ComboOffer.findById(id);
    if (!comboOffer) {
      return res.status(404).json({ success: false, message: "Combo offer not found" });
    }

    if (comboOffer.sellerId.toString() !== sellerId.toString()) {
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
