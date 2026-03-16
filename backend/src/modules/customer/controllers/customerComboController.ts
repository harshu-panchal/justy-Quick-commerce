import { Request, Response } from "express";
import { ComboOffer } from "../../../models";

// GET all active combo offers
export const getActiveComboOffers = async (req: Request, res: Response) => {
  try {
    const { productId } = req.query;
    
    // Base filter
    const filter: any = { isActive: true };
    if (productId) {
      filter.mainProduct = productId;
    }

    const combos = await ComboOffer.find(filter)
      .populate("mainProduct", "productName price mainImage category subcategory")
      .populate("comboProducts", "productName price mainImage category subcategory")
      .populate("sellerId", "storeName")
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

// GET single active combo offer details
export const getComboOfferDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const combo = await ComboOffer.findOne({ _id: id, isActive: true })
      .populate("mainProduct", "productName price mainImage category subcategory stock description")
      .populate("comboProducts", "productName price mainImage category subcategory stock description")
      .populate("sellerId", "storeName");

    if (!combo) {
      return res.status(404).json({ success: false, message: "Combo Offer not found or inactive" });
    }

    return res.status(200).json({
      success: true,
      data: combo,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching combo offer details",
      error: error.message,
    });
  }
};
