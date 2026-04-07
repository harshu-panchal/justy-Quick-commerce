import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  createProduct,
  getProductById,
  updateProduct,
  getShops,
  Shop,
  ProductVariation,
  ProductAddon,
  generateProductDescriptionAI
} from "../../../services/api/productService";
import { getCategories, getSubcategories, Category, SubCategory } from "../../../services/api/categoryService";
import { getActiveTaxes, Tax } from "../../../services/api/taxService";
import { getBrands, Brand } from "../../../services/api/brandService";
import { getHeaderCategoriesPublic, HeaderCategory } from "../../../services/api/headerCategoryService";
import api from "../../../services/api/config";
import { uploadImage } from "../../../services/api/uploadService";
import { validateImageFile, createImagePreview } from "../../../utils/imageUpload";
import { useAuth } from "../../../context/AuthContext";
import toast from 'react-hot-toast';

interface ImageSlot {
  file: File | null;
  preview: string;
  url: string;
}

export default function SellerAddProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userCat = (user?.category || (user?.categories && user.categories[0]) || "").toLowerCase();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [headerCategories, setHeaderCategories] = useState<HeaderCategory[]>([]);

  const [formData, setFormData] = useState({
    productName: "",
    headerCategory: "",
    category: "",
    subcategory: "",
    foodType: "Veg" as "Veg" | "Non-Veg" | "Egg",
    publish: "Yes",
    popular: "No",
    dealOfDay: "No",
    brand: "",
    brandName: "",
    tags: "",
    smallDescription: "",
    description: "",
    tax: "",
    totalAllowedQuantity: "10",
    mainImageUrl: "",
    galleryImageUrls: [] as string[],
    seoTitle: "",
    seoKeywords: "",
    seoDescription: "",
    isReturnable: "Yes",
    maxReturnDays: "7",
    returnPolicyText: "",
    regionalTime: "",
    localTime: "",
    preparationTime: "20",
    timing: [] as string[],
    sku: "",
    barcode: "",
    availabilityStatus: "Available" as "Available" | "Sold out",
    isJain: "No",
    spicyLevel: "None" as "None" | "Mild" | "Medium" | "Hot",
    hsnCode: "",
    fssaiLicNo: "",
    gstNumber: "",
    weight: "",
    pharmacy: {
      tablets: "",
      quantity: "",
      treatment: "",
      form: "",
      prescriptionRequired: "No",
      packOf: "",
      variant: "",
      dosage: "",
      therapeuticClassification: "",
      composition: "",
      containerType: "",
      salesPackage: "",
      manufacturingDate: "",
      expiryDate: "",
      usageDescription: "",
      sideEffects: "",
      manufacturerName: "",
      howItWorks: "",
      safetyAdvice: "",
      interactions: "",
      manufacturerLicenseNo: "",
      storage: "",
      contraindications: "",
      schedule: "",
      medicineType: "Allopathic",
      underDPCO: "No",
      manufacturingProcess: "",
      manufacturerAddress: "",
    },
    freshProduce: {
      packOf: "",
      brand: "",
      type: "",
      quantity: "",
      shelfLife: "",
      form: "",
      isOrganic: "No",
      commonName: "",
      isWhole: "Yes",
      origin: "",
      packagingType: "",
      netQuantity: "",
      addedPreservatives: "No",
      secondaryQuantity: "",
      isImported: "No",
    },
    grocery: {
      unitType: "Packet" as "Kg" | "Gram" | "Litre" | "Piece" | "Packet",
      minOrderQuantity: "1",
      expiryDate: "",
      brand: "",
      description: "",
    },
    electronics: {
      modelNumber: "",
      productCondition: "New" as "New" | "Refurbished" | "Used",
      warranty: "No",
      warrantyPeriod: "",
      countryOfOrigin: "",
      processorType: "",
      ram: "",
      storageCapacity: "",
      displaySize: "",
      batteryCapacity: "",
      operatingSystem: "",
      connectivity: "", // comma separated
      powerConsumption: "",
      colorOptions: "", // comma separated
      minStockAlert: "",
      bulkPrice: "",
      videoUrl: "",
      threeSixtyViewUrl: "",
      datasheetUrl: "",
      packageWeight: "",
      packageLength: "",
      packageWidth: "",
      packageHeight: "",
      shippingClass: "",
      deliveryTime: "",
      bisCertification: "",
      serialNumber: "",
      safetyInstructions: "",
      importerDetails: "",
      installationRequired: "No",
      installationCharges: "",
      supportContact: "",
      manufacturerDetails: "",
      replacementPolicy: "",
      promotionalBanner: "",
    },
    fashionApparel: {
      gender: "Unisex" as 'Men' | 'Women' | 'Unisex' | 'Kids',
      ageGroup: "Adult" as 'Adult' | 'Teen' | 'Kids' | 'Baby',
      apparelType: "",
      availableSizes: [] as string[],
      sizeChartUrl: "",
      fitType: "Regular Fit" as 'Slim Fit' | 'Regular Fit' | 'Loose Fit' | 'Oversized',
      primaryColor: "",
      secondaryColor: "",
      pattern: "Solid" as 'Solid' | 'Printed' | 'Striped' | 'Checked' | 'Embroidered',
      sleeveType: "Half Sleeve" as 'Full Sleeve' | 'Half Sleeve' | 'Sleeveless',
      neckType: "Round Neck" as 'Round Neck' | 'V-Neck' | 'Collar',
      fabricType: "Cotton" as 'Cotton' | 'Polyester' | 'Denim' | 'Silk' | 'Wool' | 'Linen',
      fabricBlend: "",
      isStretchable: "No",
      careInstructions: "",
      countryOfOrigin: "",
      occasion: "Casual" as 'Casual' | 'Formal' | 'Party Wear' | 'Sports' | 'Ethnic',
      minOrderQuantity: "1",
      modelImage: "",
      videoUrl: "",
      packageWeight: "",
      packageLength: "",
      packageWidth: "",
      packageHeight: "",
      shippingClass: "",
    },
    beautyPersonalCare: {
      keyBenefits: "",
      ingredients: "",
      barcode: "",
      sizeVolume: "",
      shadeColor: "",
      fragranceVariant: "",
      packSize: "",
      skinType: "" as 'Dry' | 'Oily' | 'Combination' | 'Sensitive' | '',
      hairType: "" as 'Dry' | 'Normal' | 'Oily' | 'Damaged' | '',
      concern: "",
      ingredientType: "" as 'Herbal' | 'Organic' | 'Chemical-Free' | '',
      gender: "Unisex" as 'Men' | 'Women' | 'Unisex',
      spf: "",
      formulation: "" as 'Gel' | 'Cream' | 'Serum' | 'Oil' | 'Powder' | '',
      beforeAfterImages: [] as string[],
      isDermatologicallyTested: "No",
      isCrueltyFree: "No",
      isVegan: "No",
      isOrganic: "No",
      isParabenFree: "No",
      isSulphateFree: "No",
      packageWeight: "",
      packageLength: "",
      packageWidth: "",
      packageHeight: "",
      shippingClass: "",
      deliveryTime: "",
      expiryDate: "",
      manufacturingDate: "",
      faqs: [] as { question: string; answer: string }[],
    },
    homeKitchen: {
      material: "Other" as 'Steel' | 'Plastic' | 'Glass' | 'Wood' | 'Silicone' | 'Other',
      color: "",
      capacitySize: "",
      usageType: "" as 'Kitchen' | 'Cleaning' | 'Laundry' | 'Bathroom' | '',
      powerType: "None" as 'Electric' | 'Manual' | 'Battery' | 'None',
      warranty: "",
      powerConsumption: "",
      voltage: "",
      applianceType: "",
      energyRating: "",
      cleaningType: "" as 'Floor' | 'Kitchen' | 'Bathroom' | '',
      fragrance: "",
      isChemical: "No",
      isHerbal: "No",
      packSize: "",
      packageWeight: "",
      packageLength: "",
      packageWidth: "",
      packageHeight: "",
      shippingCharges: "0",
    },
    babyKids: {
      ageGroup: "" as '0–3 Months' | '3–6 Months' | '6–12 Months' | '1–3 Years' | '3–5 Years' | '5–10 Years' | '',
      gender: "Unisex" as 'Boys' | 'Girls' | 'Unisex',
      size: "" as 'Newborn' | 'S' | 'M' | 'L' | '0–3M' | '3–6M' | '6–12M' | '1–2Y' | '2–3Y' | '',
      color: "",
      materialFabric: "",
      pattern: "" as 'Printed' | 'Plain' | 'Cartoon' | 'Character' | '',
      occasion: "" as 'Casual' | 'Party Wear' | 'School Wear' | '',
      safetyCertification: "",
      isBpaFree: "No",
      isNonToxic: "No",
      countryOfOrigin: "",
      packageWeight: "",
      packageLength: "",
      packageWidth: "",
      packageHeight: "",
      deliveryTime: "",
    },
    sportsFitness: {
      keyFeatures: "",
      material: "",
      weight: "",
      dimensions: "",
      color: "",
      size: "",
      sportType: "",
      skillLevel: "Beginner" as 'Beginner' | 'Intermediate' | 'Professional',
      usage: "Indoor" as 'Indoor' | 'Outdoor' | 'Both',
      packageWeight: "",
      packageLength: "",
      packageWidth: "",
      packageHeight: "",
      shippingClass: "Standard" as 'Standard' | 'Heavy Item',
      deliveryCharges: "0",
      warranty: "",
      returnPolicy: "",
      certification: "",
      countryOfOrigin: "",
    },
    automotive: {
      vehicleType: "Car" as 'Car' | 'Bike' | 'Truck' | 'EV' | 'Other',
      compatibleBrand: "",
      compatibleModel: "",
      modelYear: "",
      engineType: "Any" as 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid' | 'Any',
      partNumber: "",
      material: "",
      color: "",
      weight: "",
      dimensions: "",
      warrantyPeriod: "",
      installationGuideUrl: "",
      installationType: "DIY" as 'DIY' | 'Professional Required',
      isOem: "No", // Using string "Yes"/"No" to match existing pattern for boolean selectors
      returnEligibility: "Yes",
      shippingWeight: "",
      countryOfOrigin: "",
    },
    booksStationery: {
      isbn: "",
      author: "",
      publisher: "",
      language: "",
      edition: "",
      pages: "0",
      condition: "New" as 'New' | 'Used',
      weight: "",
      dimensions: "",
      shippingWeight: "",
      deliveryTime: "",
      returnPolicy: "",
      bindingType: "Paperback" as 'Paperback' | 'Hardcover',
      paperQuality: "",
      stationeryMaterial: "Paper" as 'Plastic' | 'Metal' | 'Paper' | 'Other',
      penType: "Ball" as 'Ball' | 'Gel' | 'Fountain' | 'Other',
      notebookSize: "A4" as 'A4' | 'A5' | 'B5' | 'Other',
    },
    healthWellness: {
      ingredients: "",
      form: "Tablet" as 'Tablet' | 'Capsule' | 'Powder' | 'Liquid' | 'Gummies' | 'Other',
      flavor: "",
      quantityWeight: "",
      servingSize: "",
      servingsPerPack: "0",
      suitableFor: "All" as 'Men' | 'Women' | 'Kids' | 'All',
      healthBenefit: "",
      dietaryPreference: "Vegetarian" as 'Vegetarian' | 'Non-Vegetarian' | 'Vegan',
      isSugarFree: "No",
      isGlutenFree: "No",
      isOrganic: "No",
      expiryDate: "",
      manufacturingDate: "",
      licenseNumber: "",
      usageInstructions: "",
      isDoctorRecommended: "No",
      packageWeight: "",
      packageDimensions: "",
      shippingClass: "Standard" as 'Standard' | 'Fragile' | 'Cold Storage',
    },
    petSupplies: {
      petType: "" as 'Dog' | 'Cat' | 'Bird' | 'Fish' | 'Small Animals' | 'Reptiles' | 'Other',
      breedSize: "All Sizes" as 'Small' | 'Medium' | 'Large' | 'All Sizes',
      lifeStage: "All Ages" as 'Puppy' | 'Kitten' | 'Adult' | 'Senior' | 'All Ages',
      material: "",
      flavor: "",
      weightSize: "",
      color: "",
      packSize: "",
      shelfLife: "",
      expiryDate: "",
      ingredients: "",
      safetyInstructions: "",
      countryOfOrigin: "",
      packageWeight: "",
      packageDimensions: "",
      shippingClass: "",
    },
    industrialBusiness: {
      modelNumber: "",
      material: "",
      powerSource: "" as 'Electric' | 'Battery' | 'Manual' | 'Hydraulic' | 'Other',
      voltage: "",
      wattage: "",
      capacity: "",
      loadLimit: "",
      finishType: "",
      usageType: "Industrial" as 'Industrial' | 'Commercial' | 'Workshop' | 'General',
      isGstApplicable: "Yes",
      isInvoiceAvailable: "Yes",
      dispatchTime: "",
      shippingMethod: "Courier" as 'Courier' | 'Freight' | 'Pickup',
      isInstallationAvailable: "No",
      isIsoCertified: "No",
      isBisCertified: "No",
      isCeCertified: "No",
      warrantyPeriod: "",
      safetyCompliance: "",
      sparePartsAvailability: "Yes",
      maintenanceSupport: "Yes",
    },
  });

  // Derived state for category-specific UI rendering
  const selectedHeaderCatName = headerCategories.find(hc => hc._id === formData.headerCategory)?.name.toLowerCase() || "";
  
  // Use user profile as fallback only if no category is selected yet (Adding new)
  const effectiveCatName = selectedHeaderCatName || userCat;

  const isPharmacy = effectiveCatName.includes("pharmacy");
  const isProduce = effectiveCatName.includes("vegetable") || effectiveCatName.includes("fruit") || effectiveCatName.includes("produce");
  const isGrocery = effectiveCatName.includes("grocery");
  const isTeaCorner = effectiveCatName.includes("tea corner") || effectiveCatName.includes("pan corner");
  const isFoodBakery = (effectiveCatName.includes("food") || effectiveCatName.includes("bakery")) && !isTeaCorner && !isGrocery && !isPharmacy && !isProduce;
  const isElectronics = effectiveCatName.includes("electronics");
  const isFashion = effectiveCatName.includes("fashion") || effectiveCatName.includes("apparel");
  const isBeauty = effectiveCatName.includes("beauty") || effectiveCatName.includes("care") || effectiveCatName.includes("makeup");
  const isHomeKitchen = effectiveCatName.includes("home") || effectiveCatName.includes("kitchen");
  const isBabyKids = effectiveCatName.includes("baby") || effectiveCatName.includes("kids");
  const isSportsFitness = effectiveCatName.includes("sports") || effectiveCatName.includes("fitness");
  const isAutomotive = effectiveCatName.includes("automotive");
  const isBooksStationery = effectiveCatName.includes("book") || effectiveCatName.includes("stationery");
  const isHealthWellness = effectiveCatName.includes("health") || effectiveCatName.includes("wellness");
  const isPetSupplies = effectiveCatName.includes("pet supplies");
  const isIndustrial = effectiveCatName.includes("industrial");
  const isScheduled = headerCategories.find(h => h._id === formData.headerCategory)?.deliveryType === "scheduled";

  const [showProposalField, setShowProposalField] = useState(false);
  const [proposalName, setProposalName] = useState("");
  const [proposalLoading, setProposalLoading] = useState(false);

  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(
    Array(5).fill(null).map(() => ({ file: null, preview: "", url: "" }))
  );

  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [variationForm, setVariationForm] = useState({
    title: "",
    price: "",
    discPrice: "0",
    stock: "999",
    status: "Available" as "Available" | "Sold out",
  });

  const [addons, setAddons] = useState<ProductAddon[]>([]);
  const [addonForm, setAddonForm] = useState({ name: "", price: "0" });

  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          getCategories(),
          getActiveTaxes(),
          getHeaderCategoriesPublic(),
          getBrands(),
        ]);

        let fetchedCategories: Category[] = [];
        if (results[0].status === "fulfilled" && results[0].value.success) {
          fetchedCategories = results[0].value.data;
          setCategories(fetchedCategories);
        }

        if (results[1].status === "fulfilled" && results[1].value.success) setTaxes(results[1].value.data);

        if (results[3].status === "fulfilled" && results[3].value.success) setBrands(results[3].value.data);

        if (results[2].status === "fulfilled") {
          const hRes = results[2].value;
          const sellerCategory = (user?.category || (user?.categories && user.categories.length > 0 ? user.categories[0] : null) || "").toLowerCase();

          // Filter by seller's category
          const filtered = hRes.filter((hc: HeaderCategory) =>
            hc.status === "Published" &&
            hc.name.toLowerCase() === sellerCategory
          );
          setHeaderCategories(filtered);

          if (filtered.length > 0 && !id) {
            const headId = filtered[0]._id;

            // Find matching subcategories
            const subCats = fetchedCategories.filter(c =>
              ((c as any).headerCategoryId?._id === headId ||
                (c as any).headerCategoryId === headId) &&
              c.status === "Active"
            );

            if (subCats.length > 0) {
              setFormData(p => ({
                ...p,
                headerCategory: headId,
                category: subCats[0]._id
              }));
            } else {
              setFormData(p => ({
                ...p,
                headerCategory: headId
              }));
            }
          }
        }
      } catch (err) { console.error("Error fetching data:", err); }
    };
    fetchData();
  }, [user, id]);

  // Auto-fill FSSAI, GST, Brand and other details from user profile for new products
  useEffect(() => {
    if (!id && user) {
      setFormData(prev => ({
        ...prev,
        fssaiLicNo: prev.fssaiLicNo || user.fssaiLicNo || "",
        gstNumber: prev.gstNumber || user.gstNumber || user.taxNumber || "",
        brandName: prev.brandName || user.storeName || "",
        pharmacy: {
          ...prev.pharmacy,
          manufacturerName: prev.pharmacy.manufacturerName || user.storeName || "",
          manufacturerAddress: prev.pharmacy.manufacturerAddress || user.address || "",
        },
        electronics: {
          ...prev.electronics,
          manufacturerDetails: prev.electronics.manufacturerDetails || user.storeName || "",
        },
        healthWellness: {
          ...prev.healthWellness,
          licenseNumber: prev.healthWellness.licenseNumber || user.fssaiLicNo || "",
        }
      }));
    }
  }, [user, id]);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const response = await getProductById(id);
          if (response.success && response.data) {
            const product = response.data as any;
            setFormData({
              productName: product.productName,
              headerCategory: String((product.headerCategoryId as any)?._id || (product as any).headerCategoryId || ""),
              category: String((product.category as any)?._id || product.categoryId || ""),
              subcategory: String((product.subcategory as any)?._id || product.subcategoryId || (product as any).subcategory || ""),
              foodType: product.foodType || "Veg",
              publish: product.publish ? "Yes" : "No",
              popular: product.popular ? "Yes" : "No",
              dealOfDay: product.dealOfDay ? "Yes" : "No",
              brand: String((product as any).brand?._id || (product as any).brand || ""),
              brandName: product.brandName || "",
              tags: product.tags?.join(", ") || "",
              smallDescription: product.smallDescription || "",
              description: product.description || "",
              tax: String((product.tax as any)?._id || (product as any).taxId || ""),
              totalAllowedQuantity: product.totalAllowedQuantity?.toString() || "10",
              mainImageUrl: product.mainImageUrl || product.mainImage || "",
              galleryImageUrls: product.galleryImageUrls || [],
              preparationTime: product.preparationTime?.toString() || "20",
              regionalTime: product.regionalTime || "",
              localTime: product.localTime || "",
              timing: product.timing || [],
              sku: product.sku || "",
              barcode: product.barcode || "",
              availabilityStatus: product.availabilityStatus || "Available",
              isJain: product.isJain ? "Yes" : "No",
              hsnCode: product.hsnCode || "",
              fssaiLicNo: product.fssaiLicNo || "",
              gstNumber: product.gstNumber || "",
              weight: product.weight || "",
              spicyLevel: product.spicyLevel || "None",
              seoTitle: product.seoTitle || "",
              seoKeywords: product.seoKeywords || "",
              seoDescription: product.seoDescription || "",
              isReturnable: product.isReturnable !== false ? "Yes" : "No",
              maxReturnDays: product.maxReturnDays?.toString() || "7",
              returnPolicyText: product.returnPolicyText || "",
              pharmacy: {
                tablets: product.pharmacy?.tablets || "",
                quantity: product.pharmacy?.quantity || "",
                treatment: product.pharmacy?.treatment || "",
                form: product.pharmacy?.form || "",
                prescriptionRequired: product.pharmacy?.prescriptionRequired ? "Yes" : "No",
                packOf: product.pharmacy?.packOf || "",
                variant: product.pharmacy?.variant || "",
                dosage: product.pharmacy?.dosage || "",
                therapeuticClassification: product.pharmacy?.therapeuticClassification || "",
                composition: product.pharmacy?.composition || "",
                containerType: product.pharmacy?.containerType || "",
                salesPackage: product.pharmacy?.salesPackage || "",
                manufacturingDate: product.pharmacy?.manufacturingDate ? new Date(product.pharmacy.manufacturingDate).toISOString().split('T')[0] : "",
                expiryDate: product.pharmacy?.expiryDate ? new Date(product.pharmacy.expiryDate).toISOString().split('T')[0] : "",
                usageDescription: product.pharmacy?.usageDescription || "",
                sideEffects: product.pharmacy?.sideEffects || "",
                manufacturerName: product.pharmacy?.manufacturerName || "",
                howItWorks: product.pharmacy?.howItWorks || "",
                safetyAdvice: product.pharmacy?.safetyAdvice || "",
                interactions: product.pharmacy?.interactions || "",
                manufacturerLicenseNo: product.pharmacy?.manufacturerLicenseNo || "",
                storage: product.pharmacy?.storage || "",
                contraindications: product.pharmacy?.contraindications || "",
                schedule: product.pharmacy?.schedule || "",
                medicineType: product.pharmacy?.medicineType || "Allopathic",
                underDPCO: product.pharmacy?.underDPCO ? "Yes" : "No",
                manufacturingProcess: product.pharmacy?.manufacturingProcess || "",
                manufacturerAddress: product.pharmacy?.manufacturerAddress || "",
              },
              freshProduce: {
                packOf: product.freshProduce?.packOf || "",
                brand: product.freshProduce?.brand || "",
                type: product.freshProduce?.type || "",
                quantity: product.freshProduce?.quantity || "",
                shelfLife: product.freshProduce?.shelfLife || "",
                form: product.freshProduce?.form || "",
                isOrganic: product.freshProduce?.isOrganic ? "Yes" : "No",
                commonName: product.freshProduce?.commonName || "",
                isWhole: product.freshProduce?.isWhole !== false ? "Yes" : "No",
                origin: product.freshProduce?.origin || "",
                packagingType: product.freshProduce?.packagingType || "",
                netQuantity: product.freshProduce?.netQuantity || "",
                addedPreservatives: product.freshProduce?.addedPreservatives || "No",
                secondaryQuantity: product.freshProduce?.secondaryQuantity || "",
                isImported: product.freshProduce?.isImported ? "Yes" : "No",
              },
              grocery: {
                unitType: product.grocery?.unitType || "Packet",
                minOrderQuantity: product.grocery?.minOrderQuantity?.toString() || "1",
                expiryDate: product.grocery?.expiryDate ? new Date(product.grocery.expiryDate).toISOString().split('T')[0] : "",
                brand: product.grocery?.brand || product.brandName || "",
                description: product.description || "",
              },
              electronics: {
                modelNumber: product.electronics?.modelNumber || "",
                productCondition: product.electronics?.productCondition || "New",
                warranty: product.electronics?.warranty ? "Yes" : "No",
                warrantyPeriod: product.electronics?.warrantyPeriod || "",
                countryOfOrigin: product.electronics?.countryOfOrigin || "",
                processorType: product.electronics?.processorType || "",
                ram: product.electronics?.ram || "",
                storageCapacity: product.electronics?.storageCapacity || "",
                displaySize: product.electronics?.displaySize || "",
                batteryCapacity: product.electronics?.batteryCapacity || "",
                operatingSystem: product.electronics?.operatingSystem || "",
                connectivity: product.electronics?.connectivity?.join(", ") || "",
                powerConsumption: product.electronics?.powerConsumption || "",
                colorOptions: product.electronics?.colorOptions?.join(", ") || "",
                minStockAlert: product.electronics?.minStockAlert?.toString() || "",
                bulkPrice: product.electronics?.bulkPrice?.toString() || "",
                videoUrl: product.electronics?.videoUrl || "",
                threeSixtyViewUrl: product.electronics?.threeSixtyViewUrl || "",
                datasheetUrl: product.electronics?.datasheetUrl || "",
                packageWeight: product.electronics?.packageWeight || "",
                packageLength: product.electronics?.packageLength || "",
                packageWidth: product.electronics?.packageWidth || "",
                packageHeight: product.electronics?.packageHeight || "",
                shippingClass: product.electronics?.shippingClass || "",
                deliveryTime: product.electronics?.deliveryTime || "",
                bisCertification: product.electronics?.bisCertification || "",
                serialNumber: product.electronics?.serialNumber || "",
                safetyInstructions: product.electronics?.safetyInstructions || "",
                importerDetails: product.electronics?.importerDetails || "",
                installationRequired: product.electronics?.installationRequired ? "Yes" : "No",
                installationCharges: product.electronics?.installationCharges?.toString() || "",
                supportContact: product.electronics?.supportContact || "",
                manufacturerDetails: product.electronics?.manufacturerDetails || "",
                replacementPolicy: product.electronics?.replacementPolicy || "",
                promotionalBanner: product.electronics?.promotionalBanner || "",
              },
              fashionApparel: {
                gender: product.fashionApparel?.gender || "Unisex",
                ageGroup: product.fashionApparel?.ageGroup || "Adult",
                apparelType: product.fashionApparel?.apparelType || "",
                availableSizes: product.fashionApparel?.availableSizes || [],
                sizeChartUrl: product.fashionApparel?.sizeChartUrl || "",
                fitType: product.fashionApparel?.fitType || "Regular Fit",
                primaryColor: product.fashionApparel?.primaryColor || "",
                secondaryColor: product.fashionApparel?.secondaryColor || "",
                pattern: product.fashionApparel?.pattern || "Solid",
                sleeveType: product.fashionApparel?.sleeveType || "Half Sleeve",
                neckType: product.fashionApparel?.neckType || "Round Neck",
                fabricType: product.fashionApparel?.fabricType || "Cotton",
                fabricBlend: product.fashionApparel?.fabricBlend || "",
                isStretchable: product.fashionApparel?.isStretchable ? "Yes" : "No",
                careInstructions: product.fashionApparel?.careInstructions || "",
                countryOfOrigin: product.fashionApparel?.countryOfOrigin || "",
                occasion: product.fashionApparel?.occasion || "Casual",
                minOrderQuantity: product.fashionApparel?.minOrderQuantity?.toString() || "1",
                modelImage: product.fashionApparel?.modelImage || "",
                videoUrl: product.fashionApparel?.videoUrl || "",
                packageWeight: product.fashionApparel?.packageWeight || "",
                packageLength: product.fashionApparel?.packageLength || "",
                packageWidth: product.fashionApparel?.packageWidth || "",
                packageHeight: product.fashionApparel?.packageHeight || "",
                shippingClass: product.fashionApparel?.shippingClass || "",
              },
              beautyPersonalCare: {
                keyBenefits: product.beautyPersonalCare?.keyBenefits || "",
                ingredients: product.beautyPersonalCare?.ingredients || "",
                barcode: product.beautyPersonalCare?.barcode || "",
                sizeVolume: product.beautyPersonalCare?.sizeVolume || "",
                shadeColor: product.beautyPersonalCare?.shadeColor || "",
                fragranceVariant: product.beautyPersonalCare?.fragranceVariant || "",
                packSize: product.beautyPersonalCare?.packSize || "",
                skinType: (product.beautyPersonalCare?.skinType as any) || "",
                hairType: (product.beautyPersonalCare?.hairType as any) || "",
                concern: product.beautyPersonalCare?.concern || "",
                ingredientType: (product.beautyPersonalCare?.ingredientType as any) || "",
                gender: (product.beautyPersonalCare?.gender as any) || "Unisex",
                spf: product.beautyPersonalCare?.spf || "",
                formulation: (product.beautyPersonalCare?.formulation as any) || "",
                beforeAfterImages: product.beautyPersonalCare?.beforeAfterImages || [],
                isDermatologicallyTested: product.beautyPersonalCare?.isDermatologicallyTested ? "Yes" : "No",
                isCrueltyFree: product.beautyPersonalCare?.isCrueltyFree ? "Yes" : "No",
                isVegan: product.beautyPersonalCare?.isVegan ? "Yes" : "No",
                isOrganic: product.beautyPersonalCare?.isOrganic ? "Yes" : "No",
                isParabenFree: product.beautyPersonalCare?.isParabenFree ? "Yes" : "No",
                isSulphateFree: product.beautyPersonalCare?.isSulphateFree ? "Yes" : "No",
                packageWeight: product.beautyPersonalCare?.packageWeight || "",
                packageLength: product.beautyPersonalCare?.packageLength || "",
                packageWidth: product.beautyPersonalCare?.packageWidth || "",
                packageHeight: product.beautyPersonalCare?.packageHeight || "",
                shippingClass: product.beautyPersonalCare?.shippingClass || "",
                deliveryTime: product.beautyPersonalCare?.deliveryTime || "",
                expiryDate: product.beautyPersonalCare?.expiryDate ? new Date(product.beautyPersonalCare.expiryDate).toISOString().split('T')[0] : "",
                manufacturingDate: product.beautyPersonalCare?.manufacturingDate ? new Date(product.beautyPersonalCare.manufacturingDate).toISOString().split('T')[0] : "",
                faqs: product.beautyPersonalCare?.faqs || [],
              },
              homeKitchen: {
                material: product.homeKitchen?.material || "Other",
                color: product.homeKitchen?.color || "",
                capacitySize: product.homeKitchen?.capacitySize || "",
                usageType: (product.homeKitchen?.usageType as any) || "",
                powerType: product.homeKitchen?.powerType || "None",
                warranty: product.homeKitchen?.warranty || "",
                powerConsumption: product.homeKitchen?.powerConsumption || "",
                voltage: product.homeKitchen?.voltage || "",
                applianceType: product.homeKitchen?.applianceType || "",
                energyRating: product.homeKitchen?.energyRating || "",
                cleaningType: (product.homeKitchen?.cleaningType as any) || "",
                fragrance: product.homeKitchen?.fragrance || "",
                isChemical: product.homeKitchen?.isChemical ? "Yes" : "No",
                isHerbal: product.homeKitchen?.isHerbal ? "Yes" : "No",
                packSize: product.homeKitchen?.packSize || "",
                packageWeight: product.homeKitchen?.packageWeight || "",
                packageLength: product.homeKitchen?.packageLength || "",
                packageWidth: product.homeKitchen?.packageWidth || "",
                packageHeight: product.homeKitchen?.packageHeight || "",
                shippingCharges: product.homeKitchen?.shippingCharges?.toString() || "0",
              },
              babyKids: {
                ageGroup: (product.babyKids?.ageGroup as any) || "",
                gender: product.babyKids?.gender || "Unisex",
                size: (product.babyKids?.size as any) || "",
                color: product.babyKids?.color || "",
                materialFabric: product.babyKids?.materialFabric || "",
                pattern: (product.babyKids?.pattern as any) || "",
                occasion: (product.babyKids?.occasion as any) || "",
                safetyCertification: product.babyKids?.safetyCertification || "",
                isBpaFree: product.babyKids?.isBpaFree ? "Yes" : "No",
                isNonToxic: product.babyKids?.isNonToxic ? "Yes" : "No",
                countryOfOrigin: product.babyKids?.countryOfOrigin || "",
                packageWeight: product.babyKids?.packageWeight || "",
                packageLength: product.babyKids?.packageLength || "",
                packageWidth: product.babyKids?.packageWidth || "",
                packageHeight: product.babyKids?.packageHeight || "",
                deliveryTime: product.babyKids?.deliveryTime || "",
              },
              sportsFitness: {
                keyFeatures: product.sportsFitness?.keyFeatures || "",
                material: product.sportsFitness?.material || "",
                weight: product.sportsFitness?.weight || "",
                dimensions: product.sportsFitness?.dimensions || "",
                color: product.sportsFitness?.color || "",
                size: product.sportsFitness?.size || "",
                sportType: product.sportsFitness?.sportType || "",
                skillLevel: (product.sportsFitness?.skillLevel as any) || "Beginner",
                usage: (product.sportsFitness?.usage as any) || "Indoor",
                packageWeight: product.sportsFitness?.packageWeight || "",
                packageLength: product.sportsFitness?.packageLength || "",
                packageWidth: product.sportsFitness?.packageWidth || "",
                packageHeight: product.sportsFitness?.packageHeight || "",
                shippingClass: (product.sportsFitness?.shippingClass as any) || "Standard",
                deliveryCharges: product.sportsFitness?.deliveryCharges?.toString() || "0",
                warranty: product.sportsFitness?.warranty || "",
                returnPolicy: product.sportsFitness?.returnPolicy || "",
                certification: product.sportsFitness?.certification || "",
                countryOfOrigin: product.sportsFitness?.countryOfOrigin || "",
              },
              automotive: {
                vehicleType: (product.automotive?.vehicleType as any) || "Car",
                compatibleBrand: product.automotive?.compatibleBrand || "",
                compatibleModel: product.automotive?.compatibleModel || "",
                modelYear: product.automotive?.modelYear || "",
                engineType: (product.automotive?.engineType as any) || "Any",
                partNumber: product.automotive?.partNumber || "",
                material: product.automotive?.material || "",
                color: product.automotive?.color || "",
                weight: product.automotive?.weight || "",
                dimensions: product.automotive?.dimensions || "",
                warrantyPeriod: product.automotive?.warrantyPeriod || "",
                installationGuideUrl: product.automotive?.installationGuideUrl || "",
                installationType: (product.automotive?.installationType as any) || "DIY",
                isOem: product.automotive?.isOem ? "Yes" : "No",
                returnEligibility: product.automotive?.returnEligibility !== false ? "Yes" : "No",
                shippingWeight: product.automotive?.shippingWeight || "",
                countryOfOrigin: product.automotive?.countryOfOrigin || "",
              },
              booksStationery: {
                isbn: product.booksStationery?.isbn || "",
                author: product.booksStationery?.author || "",
                publisher: product.booksStationery?.publisher || "",
                language: product.booksStationery?.language || "",
                edition: product.booksStationery?.edition || "",
                pages: product.booksStationery?.pages?.toString() || "0",
                condition: (product.booksStationery?.condition as any) || "New",
                weight: product.booksStationery?.weight || "",
                dimensions: product.booksStationery?.dimensions || "",
                shippingWeight: product.booksStationery?.shippingWeight || "",
                deliveryTime: product.booksStationery?.deliveryTime || "",
                returnPolicy: product.booksStationery?.returnPolicy || "",
                bindingType: (product.booksStationery?.bindingType as any) || "Paperback",
                paperQuality: product.booksStationery?.paperQuality || "",
                stationeryMaterial: (product.booksStationery?.stationeryMaterial as any) || "Paper",
                penType: (product.booksStationery?.penType as any) || "Ball",
                notebookSize: (product.booksStationery?.notebookSize as any) || "A4",
              },
              healthWellness: {
                ingredients: product.healthWellness?.ingredients || "",
                form: (product.healthWellness?.form as any) || "Tablet",
                flavor: product.healthWellness?.flavor || "",
                quantityWeight: product.healthWellness?.quantityWeight || "",
                servingSize: product.healthWellness?.servingSize || "",
                servingsPerPack: product.healthWellness?.servingsPerPack?.toString() || "0",
                suitableFor: (product.healthWellness?.suitableFor as any) || "All",
                healthBenefit: product.healthWellness?.healthBenefit || "",
                dietaryPreference: (product.healthWellness?.dietaryPreference as any) || "Vegetarian",
                isSugarFree: product.healthWellness?.isSugarFree ? "Yes" : "No",
                isGlutenFree: product.healthWellness?.isGlutenFree ? "Yes" : "No",
                isOrganic: product.healthWellness?.isOrganic ? "Yes" : "No",
                expiryDate: product.healthWellness?.expiryDate || "",
                manufacturingDate: product.healthWellness?.manufacturingDate || "",
                licenseNumber: product.healthWellness?.licenseNumber || "",
                usageInstructions: product.healthWellness?.usageInstructions || "",
                isDoctorRecommended: product.healthWellness?.isDoctorRecommended ? "Yes" : "No",
                packageWeight: product.healthWellness?.packageWeight || "",
                packageDimensions: product.healthWellness?.packageDimensions || "",
                shippingClass: (product.healthWellness?.shippingClass as any) || "Standard",
              },
              petSupplies: {
                petType: (product.petSupplies?.petType as any) || "",
                breedSize: (product.petSupplies?.breedSize as any) || "All Sizes",
                lifeStage: (product.petSupplies?.lifeStage as any) || "All Ages",
                material: product.petSupplies?.material || "",
                flavor: product.petSupplies?.flavor || "",
                weightSize: product.petSupplies?.weightSize || "",
                color: product.petSupplies?.color || "",
                packSize: product.petSupplies?.packSize || "",
                shelfLife: product.petSupplies?.shelfLife || "",
                expiryDate: product.petSupplies?.expiryDate ? new Date(product.petSupplies.expiryDate).toISOString().split('T')[0] : "",
                ingredients: product.petSupplies?.ingredients || "",
                safetyInstructions: product.petSupplies?.safetyInstructions || "",
                countryOfOrigin: product.petSupplies?.countryOfOrigin || "",
                packageWeight: product.petSupplies?.packageWeight || "",
                packageDimensions: product.petSupplies?.packageDimensions || "",
                shippingClass: (product.petSupplies?.shippingClass as any) || "",
              },
              industrialBusiness: {
                modelNumber: product.industrialBusiness?.modelNumber || "",
                material: product.industrialBusiness?.material || "",
                powerSource: (product.industrialBusiness?.powerSource as any) || "",
                voltage: product.industrialBusiness?.voltage || "",
                wattage: product.industrialBusiness?.wattage || "",
                capacity: product.industrialBusiness?.capacity || "",
                loadLimit: product.industrialBusiness?.loadLimit || "",
                finishType: product.industrialBusiness?.finishType || "",
                usageType: (product.industrialBusiness?.usageType as any) || "Industrial",
                isGstApplicable: product.industrialBusiness?.isGstApplicable ? "Yes" : "No",
                isInvoiceAvailable: product.industrialBusiness?.isInvoiceAvailable ? "Yes" : "No",
                dispatchTime: product.industrialBusiness?.dispatchTime || "",
                shippingMethod: (product.industrialBusiness?.shippingMethod as any) || "Courier",
                isInstallationAvailable: product.industrialBusiness?.isInstallationAvailable ? "Yes" : "No",
                isIsoCertified: product.industrialBusiness?.isIsoCertified ? "Yes" : "No",
                isBisCertified: product.industrialBusiness?.isBisCertified ? "Yes" : "No",
                isCeCertified: product.industrialBusiness?.isCeCertified ? "Yes" : "No",
                warrantyPeriod: product.industrialBusiness?.warrantyPeriod || "",
                safetyCompliance: product.industrialBusiness?.safetyCompliance || "",
                sparePartsAvailability: product.industrialBusiness?.sparePartsAvailability ? "Yes" : "No",
                maintenanceSupport: product.industrialBusiness?.maintenanceSupport ? "Yes" : "No",
              },
            } as any);
            setVariations(product.variations || []);
            setAddons(product.addons || []);
            const allImages = [
              product.mainImage || product.mainImageUrl || "",
              ...(product.galleryImages || product.galleryImageUrls || [])
            ].filter(Boolean).slice(0, 5);

            setImageSlots(prev => {
              const newSlots = [...prev];
              allImages.forEach((url, i) => {
                if (i < 5) newSlots[i] = { file: null, preview: url as string, url: url as string };
              });
              return newSlots;
            });
          }
        } catch (err) { console.error("Error fetching product:", err); }
      };
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!formData.category) {
        setSubcategories([]);
        return;
      }
      try {
        const res = await getSubcategories(formData.category);
        if (res.success) {
          setSubcategories(res.data);
        }
      } catch (err) {
        console.error("Error fetching subcategories:", err);
      }
    };
    fetchSubcategories();
  }, [formData.category]);
  // Already defined at top

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("pharmacy.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, pharmacy: { ...prev.pharmacy, [field]: value } }));
    }
    else if (name.startsWith("freshProduce.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, freshProduce: { ...prev.freshProduce, [field]: value } }));
    }
    else if (name.startsWith("grocery.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, grocery: { ...prev.grocery, [field]: value } }));
    }
    else if (name.startsWith("electronics.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, electronics: { ...prev.electronics, [field]: value } }));
    }
    else if (name.startsWith("fashionApparel.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, fashionApparel: { ...prev.fashionApparel, [field]: value } }));
    }
    else if (name.startsWith("beautyPersonalCare.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, beautyPersonalCare: { ...prev.beautyPersonalCare, [field]: value } }));
    }
    else if (name.startsWith("homeKitchen.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, homeKitchen: { ...prev.homeKitchen, [field]: value } }));
    }
    else if (name.startsWith("babyKids.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, babyKids: { ...prev.babyKids, [field]: value } }));
    }
    else if (name.startsWith("sportsFitness.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, sportsFitness: { ...prev.sportsFitness, [field]: value } }));
    }
    else if (name.startsWith("automotive.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, automotive: { ...prev.automotive, [field]: value } }));
    }
    else if (name.startsWith("booksStationery.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, booksStationery: { ...prev.booksStationery, [field]: value } }));
    }
    else if (name.startsWith("healthWellness.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, healthWellness: { ...prev.healthWellness, [field]: value } }));
    }
    else if (name.startsWith("petSupplies.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, petSupplies: { ...prev.petSupplies, [field]: value } }));
    }
    else if (name.startsWith("industrialBusiness.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, industrialBusiness: { ...prev.industrialBusiness, [field]: value } }));
    }
    else if (name === "headerCategory" && value === "propose_new") setShowProposalField(true);
    else setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSizeChange = (size: string) => {
    setFormData(prev => {
      const currentSizes = prev.fashionApparel.availableSizes || [];
      const newSizes = currentSizes.includes(size)
        ? currentSizes.filter(s => s !== size)
        : [...currentSizes, size];
      return {
        ...prev,
        fashionApparel: { ...prev.fashionApparel, availableSizes: newSizes }
      };
    });
  };

  const handleProposeCategory = async () => {
    if (!proposalName.trim()) return;
    setProposalLoading(true);
    try {
      await api.post("/header-categories/propose", { name: proposalName, deliveryType: "quick" });
      toast.success("Proposal Sent Successfully! 📩");
      setProposalName("");
      setShowProposalField(false);
    } catch (err: any) { toast.error("Failed to propose category."); } finally { setProposalLoading(false); }
  };

  const handleImageSlotChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) { toast.error(validation.error || "Invalid file"); return; }
    try {
      const preview = await createImagePreview(file);
      setImageSlots(prev => { const newSlots = [...prev]; newSlots[index] = { file, preview, url: "" }; return newSlots; });
    } catch (error) { toast.error("Process failed"); }
  };

  const clearImageSlot = (index: number) => {
    setImageSlots(prev => { const newSlots = [...prev]; newSlots[index] = { file: null, preview: "", url: "" }; return newSlots; });
  };

  const addVariation = () => {
    if (!variationForm.title || !variationForm.price) return;
    setVariations([...variations, { title: variationForm.title, price: parseFloat(variationForm.price), discPrice: parseFloat(variationForm.discPrice || "0"), stock: parseInt(variationForm.stock || "999"), status: variationForm.status }]);
    setVariationForm({ title: "", price: "", discPrice: "0", stock: "999", status: "Available" });
  };

  const removeVariation = (index: number) => setVariations(prev => prev.filter((_, i) => i !== index));

  const addAddon = () => {
    if (!addonForm.name) return;
    setAddons([...addons, { name: addonForm.name, price: parseFloat(addonForm.price || "0") }]);
    setAddonForm({ name: "", price: "0" });
  };
  const removeAddon = (index: number) => setAddons(prev => prev.filter((_, i) => i !== index));

  const handleGenerateAI = async () => {
    if (!formData.productName) return;
    setAiLoading(true);
    try {
      const res = await generateProductDescriptionAI({ name: formData.productName, category: categories.find(c => c._id === formData.category)?.name });
      if (res.success && res.data?.description) setAiSuggestion(res.data.description);
    } catch (err) { toast.error("AI is busy right now. Ensure GEMINI_API_KEY is set in your backend .env file."); } finally { setAiLoading(false); }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setFormData(prev => ({ ...prev, smallDescription: aiSuggestion }));
    setAiSuggestion("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName.trim()) { toast.error("Product name is required."); return; }
    if (!formData.headerCategory) { toast.error("Parent category is required."); return; }
    if (!formData.category) { toast.error("Sub category is required."); return; }
    if (variations.length === 0) { toast.error("Please add at least one configuration (Size/Price)."); return; }

    setUploading(true);
    const idToast = toast.loading(id ? "Updating product..." : "Uploading product...");

    try {
      // 1. Upload Images
      const uploadedUrls: string[] = [];
      for (let i = 0; i < imageSlots.length; i++) {
        const slot = imageSlots[i];
        if (slot.file) {
          try {
            const res = await uploadImage(slot.file, "products");
            if (res && res.secureUrl) {
              uploadedUrls.push(res.secureUrl);
            }
          } catch (err) {
            console.error(`Failed to upload image at slot ${i + 1}:`, err);
            toast.error(`Image ${i + 1} failed to upload.`);
          }
        } else if (slot.url) {
          uploadedUrls.push(slot.url);
        }
      }

      if (uploadedUrls.length === 0) {
        toast.dismiss(idToast);
        toast.error("At least one product image is required.");
        setUploading(false);
        return;
      }

      // 2. Prepare Product Data
      const productData: any = {
        ...formData,
        headerCategoryId: formData.headerCategory,
        categoryId: formData.category,
        publish: formData.publish === "Yes",
        popular: formData.popular === "Yes",
        dealOfDay: formData.dealOfDay === "Yes",
        isJain: formData.isJain === "Yes",
        spicyLevel: formData.spicyLevel,
        price: variations[0].price,
        stock: variations[0].stock,
        preparationTime: (isPharmacy || isProduce) ? undefined : (parseInt(formData.preparationTime) || 20),
        regionalTime: formData.regionalTime,
        localTime: formData.localTime,
        variations: variations.map(v => ({ ...v, name: v.title })),
        addons: addons,
        fssaiLicNo: formData.fssaiLicNo,
        gstNumber: formData.gstNumber,
        hsnCode: formData.hsnCode,
        weight: formData.weight,
        totalAllowedQuantity: parseInt(formData.totalAllowedQuantity) || 10,
        mainImageUrl: uploadedUrls[0],
        galleryImageUrls: uploadedUrls.slice(1),
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        taxId: formData.tax || undefined,
        brandId: (formData.brand && formData.brand !== "other") ? formData.brand : undefined,
        brandName: (formData.brand === "other" || !formData.brand) ? formData.brandName : brands.find(b => b._id === formData.brand)?.name,
        subSubCategoryId: formData.subcategory || undefined,
        seoTitle: formData.seoTitle || undefined,
        seoKeywords: formData.seoKeywords || undefined,
        seoDescription: formData.seoDescription || undefined,
        isReturnable: formData.isReturnable === "Yes",
        maxReturnDays: parseInt(formData.maxReturnDays) || 7,
        returnPolicyText: formData.returnPolicyText || undefined,
        pharmacy: isPharmacy ? {
          ...formData.pharmacy,
          prescriptionRequired: formData.pharmacy.prescriptionRequired === "Yes",
          underDPCO: formData.pharmacy.underDPCO === "Yes",
          manufacturingDate: formData.pharmacy.manufacturingDate || undefined,
          expiryDate: formData.pharmacy.expiryDate || undefined,
        } : undefined,
        freshProduce: isProduce ? {
          ...formData.freshProduce,
          isOrganic: formData.freshProduce.isOrganic === "Yes",
          isWhole: formData.freshProduce.isWhole === "Yes",
          isImported: formData.freshProduce.isImported === "Yes",
        } : undefined,
        grocery: isGrocery ? {
          ...formData.grocery,
          minOrderQuantity: parseInt(formData.grocery.minOrderQuantity) || 1,
          expiryDate: formData.grocery.expiryDate || undefined,
        } : undefined,
        electronics: isElectronics ? {
          ...formData.electronics,
          warranty: formData.electronics.warranty === "Yes",
          connectivity: formData.electronics.connectivity.split(",").map(i => i.trim()).filter(Boolean),
          minStockAlert: parseInt(formData.electronics.minStockAlert) || undefined,
          bulkPrice: parseFloat(formData.electronics.bulkPrice) || undefined,
          installationRequired: formData.electronics.installationRequired === "Yes",
          installationCharges: parseFloat(formData.electronics.installationCharges) || undefined,
        } : undefined,
        fashionApparel: isFashion ? {
          ...formData.fashionApparel,
          isStretchable: formData.fashionApparel.isStretchable === "Yes",
          minOrderQuantity: parseInt(formData.fashionApparel.minOrderQuantity) || 1,
        } : undefined,
        beautyPersonalCare: isBeauty ? {
          ...formData.beautyPersonalCare,
          isDermatologicallyTested: formData.beautyPersonalCare.isDermatologicallyTested === "Yes",
          isCrueltyFree: formData.beautyPersonalCare.isCrueltyFree === "Yes",
          isVegan: formData.beautyPersonalCare.isVegan === "Yes",
          isOrganic: formData.beautyPersonalCare.isOrganic === "Yes",
          isParabenFree: formData.beautyPersonalCare.isParabenFree === "Yes",
          isSulphateFree: formData.beautyPersonalCare.isSulphateFree === "Yes",
          expiryDate: formData.beautyPersonalCare.expiryDate || undefined,
          manufacturingDate: formData.beautyPersonalCare.manufacturingDate || undefined,
        } : undefined,
        homeKitchen: isHomeKitchen ? {
          ...formData.homeKitchen,
          isChemical: formData.homeKitchen.isChemical === "Yes",
          isHerbal: formData.homeKitchen.isHerbal === "Yes",
          shippingCharges: parseFloat(formData.homeKitchen.shippingCharges) || 0,
        } : undefined,
        babyKids: isBabyKids ? {
          ...formData.babyKids,
          isBpaFree: formData.babyKids.isBpaFree === "Yes",
          isNonToxic: formData.babyKids.isNonToxic === "Yes",
        } : undefined,
        sportsFitness: isSportsFitness ? {
          ...formData.sportsFitness,
          deliveryCharges: parseFloat(formData.sportsFitness.deliveryCharges) || 0,
        } : undefined,
        automotive: isAutomotive ? {
          ...formData.automotive,
          isOem: formData.automotive.isOem === "Yes",
          returnEligibility: formData.automotive.returnEligibility === "Yes",
        } : undefined,
        booksStationery: isBooksStationery ? {
          ...formData.booksStationery,
          pages: parseInt(formData.booksStationery.pages) || 0,
        } : undefined,
        healthWellness: isHealthWellness ? {
          ...formData.healthWellness,
          servingsPerPack: parseInt(formData.healthWellness.servingsPerPack) || 0,
          isSugarFree: formData.healthWellness.isSugarFree === "Yes",
          isGlutenFree: formData.healthWellness.isGlutenFree === "Yes",
          isOrganic: formData.healthWellness.isOrganic === "Yes",
          isDoctorRecommended: formData.healthWellness.isDoctorRecommended === "Yes",
        } : undefined,
        petSupplies: isPetSupplies ? {
          ...formData.petSupplies,
        } : undefined,
        industrialBusiness: isIndustrial ? {
          ...formData.industrialBusiness,
          isGstApplicable: formData.industrialBusiness.isGstApplicable === "Yes",
          isInvoiceAvailable: formData.industrialBusiness.isInvoiceAvailable === "Yes",
          isInstallationAvailable: formData.industrialBusiness.isInstallationAvailable === "Yes",
          isIsoCertified: formData.industrialBusiness.isIsoCertified === "Yes",
          isBisCertified: formData.industrialBusiness.isBisCertified === "Yes",
          isCeCertified: formData.industrialBusiness.isCeCertified === "Yes",
          sparePartsAvailability: formData.industrialBusiness.sparePartsAvailability === "Yes",
          maintenanceSupport: formData.industrialBusiness.maintenanceSupport === "Yes",
        } : undefined,
      };

      // 3. Submit to Backend
      const response = id ? await updateProduct(id, productData) : await createProduct(productData);

      toast.dismiss(idToast);
      if (response.success) {
        toast.success(id ? "Product Updated Successfully! 🪄" : "Product Submitted for Approval! ⏳");
        setTimeout(() => navigate("/seller/product/list"), 1500);
      } else {
        toast.error(response.message || "Submission failed.");
      }
    } catch (error: any) {
      toast.dismiss(idToast);
      console.error("Submission Error:", error);
      toast.error(error.response?.data?.message || error.message || "An unexpected error occurred.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="font-sans antialiased text-neutral-900 pb-20">
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">

        {/* Header - Zoomed Out */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${formData.availabilityStatus === "Available" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>{formData.availabilityStatus === "Available" ? "• Available" : "• Sold Out"}</span>
              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest opacity-60">Product Management</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-900">{id ? "Update Product" : "Create New Product"}</h1>
          </div>
          <button type="button" onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-white border border-neutral-200 rounded-xl text-neutral-400 hover:bg-neutral-50 transition-all shadow-sm"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Quick Config - Sticky */}
          <div className="bg-white/80 backdrop-blur-xl border border-neutral-200 rounded-2xl p-4 flex items-center justify-between shadow-sm sticky top-4 z-[100]">
            <div className="flex items-center gap-6 pl-2">
              <div className="flex flex-col gap-1.5 border-r border-neutral-100 pr-6">
                <p className="text-[8px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-0.5">Availability</p>
                <button type="button" onClick={() => setFormData(p => ({ ...p, availabilityStatus: p.availabilityStatus === "Available" ? "Sold out" : "Available" }))} className={`w-11 h-5.5 rounded-full transition-all flex items-center px-1 shadow-inner ${formData.availabilityStatus === "Available" ? "bg-emerald-500" : "bg-neutral-200"}`}><motion.div animate={{ x: formData.availabilityStatus === "Available" ? 22 : 0 }} className="w-3.5 h-3.5 bg-white rounded-full shadow-md" /></button>
              </div>
              {!isTeaCorner && !isGrocery && (
                <>
                  <div className="flex flex-col gap-1.5 border-r border-neutral-100 pr-6">
                    <p className="text-[8px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-0.5">Recommended</p>
                    <button type="button" onClick={() => setFormData(p => ({ ...p, popular: p.popular === "Yes" ? "No" : "Yes" }))} className={`w-11 h-5.5 rounded-full transition-all flex items-center px-1 shadow-inner ${formData.popular === "Yes" ? "bg-amber-500" : "bg-neutral-200"}`}><motion.div animate={{ x: formData.popular === "Yes" ? 22 : 0 }} className="w-3.5 h-3.5 bg-white rounded-full shadow-md" /></button>
                  </div>
                  <div className="flex flex-col gap-1.5 border-r border-neutral-100 pr-6">
                    <p className="text-[8px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-0.5">Approval Status</p>
                    <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">Pending 🔍</div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[8px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-0.5">Deal of the Day</p>
                    <button type="button" onClick={() => setFormData(p => ({ ...p, dealOfDay: p.dealOfDay === "Yes" ? "No" : "Yes" }))} className={`w-11 h-5.5 rounded-full transition-all flex items-center px-1 shadow-inner ${formData.dealOfDay === "Yes" ? "bg-orange-600" : "bg-neutral-200"}`}><motion.div animate={{ x: formData.dealOfDay === "Yes" ? 22 : 0 }} className="w-3.5 h-3.5 bg-white rounded-full shadow-md" /></button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 1: Basic Information */}
          <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-emerald-600 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Product Identity</h2></div>
              {!isPharmacy && !isProduce && !isGrocery && !isTeaCorner && (
                <div className="flex bg-neutral-100/50 p-1 rounded-xl border border-neutral-100 gap-1">{["Veg", "Non-Veg", "Egg"].map(type => (<button key={type} type="button" onClick={() => setFormData(p => ({ ...p, foodType: type as any }))} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${formData.foodType === type ? "bg-white text-emerald-600 shadow-sm" : "text-neutral-400"}`}>{type}</button>))}</div>
              )}
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Full Product Name *</label><input type="text" name="productName" value={formData.productName} onChange={handleChange} placeholder="e.g. Fresh Organic Tomatoes" className="w-full h-12 px-5 bg-neutral-50 border border-neutral-100 rounded-xl text-[16px] font-bold focus:bg-white focus:border-emerald-500 transition-all outline-none" /></div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Brand</label>
                  <select name="brand" value={formData.brand} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-[12px] font-bold outline-none focus:border-teal-500">
                    <option value="">Select Brand</option>
                    {brands.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                    <option value="other">Other / Custom</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">External SKU (Product ID)</label>
                  <input type="text" name="sku" value={formData.sku} onChange={handleChange} placeholder="e.g. SKU-123" className="w-full h-11 px-5 bg-neutral-50 border border-neutral-100 rounded-xl text-[14px] font-bold focus:bg-white focus:border-emerald-500 transition-all outline-none" />
                </div>
              </div>
              {formData.brand === "other" && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Custom Brand Name</label>
                  <input type="text" name="brandName" value={formData.brandName} onChange={handleChange} placeholder="Enter brand name" className="w-full h-11 px-5 bg-neutral-50 border border-neutral-100 rounded-xl text-[14px] font-bold focus:bg-white focus:border-emerald-500 transition-all outline-none" />
                </div>
              )}
              {!isPharmacy && !isProduce && !isGrocery && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Regional Time</label><input type="text" name="regionalTime" value={formData.regionalTime} onChange={handleChange} placeholder="e.g. 10:00 AM - 08:00 PM" className="w-full h-11 px-5 bg-neutral-50 border border-neutral-100 rounded-xl text-[14px] font-black tabular-nums transition-all outline-none focus:border-emerald-500" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Local Time</label><input type="text" name="localTime" value={formData.localTime} onChange={handleChange} placeholder="e.g. 09:00 AM - 10:00 PM" className="w-full h-11 px-5 bg-neutral-50 border border-neutral-100 rounded-xl text-[14px] font-black tabular-nums transition-all outline-none focus:border-emerald-500" /></div>
                </div>
              )}
              {!isPharmacy && !isProduce && !isGrocery && !isTeaCorner && (
                <div className="grid grid-cols-1 gap-6 pt-2">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Spicy Level</label><select name="spicyLevel" value={formData.spicyLevel} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-[12px] font-black uppercase outline-none focus:border-teal-500"><option value="None">Not Spicy</option><option value="Mild">Mild 🔥</option><option value="Medium">Medium 🔥🔥</option><option value="Hot">Extra Hot 🔥🔥🔥</option></select></div>
                </div>
              )}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Short Description</label>
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={aiLoading || !formData.productName}
                    className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-teal-100 transition-all disabled:opacity-50"
                  >
                    {aiLoading ? "Thinking..." : "✨ Magic AI"}
                  </button>
                </div>
                <textarea name="smallDescription" value={formData.smallDescription} onChange={handleChange} rows={2} placeholder="Brief summary (e.g. A delicious blend of spices...)" className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-medium focus:bg-white transition-all outline-none resize-none mb-3"></textarea>

                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5 ml-1">Detailed Description (Required for details page)</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Full product details, nutrition info, usage instructions, etc..." className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-medium focus:bg-white transition-all outline-none resize-none"></textarea>

                <AnimatePresence>
                  {aiSuggestion && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 bg-teal-50 border border-teal-100 rounded-xl space-y-3 mt-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-teal-700 uppercase tracking-widest">AI Suggestion</p>
                        <button type="button" onClick={() => setAiSuggestion("")} className="text-teal-400 text-xs font-black">×</button>
                      </div>
                      <p className="text-xs text-teal-900 leading-relaxed italic">{aiSuggestion}</p>
                      <button type="button" onClick={applyAiSuggestion} className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-teal-600/20 active:scale-95 transition-all">Apply Suggestion</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>

          {/* Section 2: Category */}
          <div className="grid grid-cols-1 gap-8">
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3"><div className="w-1.5 h-6 bg-teal-600 rounded-full"></div><h2 className="text-md font-black text-neutral-800 tracking-tight">Categories</h2></div>
              <div className="space-y-4">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em]">Parent Category</label><select name="headerCategory" value={formData.headerCategory} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 rounded-xl text-[12px] font-bold border border-neutral-100 focus:bg-white focus:border-teal-500 transition-all outline-none cursor-pointer"><option value="">Selection Required</option>{headerCategories.map(hc => <option key={hc._id} value={hc._id}>{hc.name}</option>)}</select></div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em]">Sub Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 rounded-xl text-[12px] font-bold border border-neutral-100 focus:bg-white focus:border-teal-500 transition-all outline-none cursor-pointer disabled:opacity-40"><option value="">Selection Required</option>{categories.filter(c => ((c as any).headerCategoryId?._id === formData.headerCategory || (c as any).headerCategoryId === formData.headerCategory) && (c as any).status === "Active").map((cat: any) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}</select>
                </div>
                {subcategories.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em]">Deep Sub Category (Optional)</label>
                    <select name="subcategory" value={formData.subcategory} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 rounded-xl text-[12px] font-bold border border-neutral-100 focus:bg-white focus:border-teal-500 transition-all outline-none cursor-pointer"><option value="">Selection Optional</option>{subcategories.map(sc => <option key={sc._id} value={sc._id}>{sc.subcategoryName}</option>)}</select>
                  </div>
                )}
              </div>
            </section>
          </div>

          {isPharmacy && (
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-8">
              <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-teal-600 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Pharmacy Specifications</h2></div>

              {/* Visual Highlights */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 text-teal-600">★ High Priority Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Tablets Count</label><input type="text" name="pharmacy.tablets" value={formData.pharmacy.tablets} onChange={handleChange} placeholder="e.g. 10 Tabs" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Quantity/Volume</label><input type="text" name="pharmacy.quantity" value={formData.pharmacy.quantity} onChange={handleChange} placeholder="e.g. 100ml" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Primary Treatment</label><input type="text" name="pharmacy.treatment" value={formData.pharmacy.treatment} onChange={handleChange} placeholder="e.g. Fever" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Medicine Form</label><input type="text" name="pharmacy.form" value={formData.pharmacy.form} onChange={handleChange} placeholder="e.g. Syrup" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Prescription Required?</label><select name="pharmacy.prescriptionRequired" value={formData.pharmacy.prescriptionRequired} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none"><option value="No">No (OTC)</option><option value="Yes">Yes (Prescription)</option></select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Pack Of</label><input type="text" name="pharmacy.packOf" value={formData.pharmacy.packOf} onChange={handleChange} placeholder="e.g. Pack of 2" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none" /></div>
                </div>
              </div>

              {/* General Medicine Details */}
              <div className="space-y-6 pt-4 border-t border-neutral-100">
                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">All Details in General</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(1) Brand Name</label><input type="text" name="brandName" value={formData.brandName} onChange={handleChange} className="w-full h-10 px-4 bg-neutral-50 rounded-xl border-none text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(5) Variant</label><input type="text" name="pharmacy.variant" value={formData.pharmacy.variant} onChange={handleChange} className="w-full h-10 px-4 bg-neutral-50 rounded-xl border-none text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(8) Dosage</label><input type="text" name="pharmacy.dosage" value={formData.pharmacy.dosage} onChange={handleChange} placeholder="e.g. Twice daily" className="w-full h-10 px-4 bg-neutral-50 rounded-xl border-none text-sm font-bold" /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(9) Therapeutic Classification</label><input type="text" name="pharmacy.therapeuticClassification" value={formData.pharmacy.therapeuticClassification} onChange={handleChange} className="w-full h-10 px-4 bg-neutral-50 rounded-xl border-none text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(10) Composition</label><input type="text" name="pharmacy.composition" value={formData.pharmacy.composition} onChange={handleChange} placeholder="e.g. Paracetamol 500mg" className="w-full h-10 px-4 bg-neutral-50 rounded-xl border-none text-sm font-bold" /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(11) Container Type</label><input type="text" name="pharmacy.containerType" value={formData.pharmacy.containerType} onChange={handleChange} className="w-full h-10 px-4 bg-neutral-50 rounded-xl border-none text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(12) Sales Package</label><input type="text" name="pharmacy.salesPackage" value={formData.pharmacy.salesPackage} onChange={handleChange} className="w-full h-10 px-4 bg-neutral-50 rounded-xl border-none text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(25) Type</label><select name="pharmacy.medicineType" value={formData.pharmacy.medicineType} onChange={handleChange} className="w-full h-10 px-4 bg-neutral-50 rounded-xl border-none text-sm font-bold"><option value="Allopathic">Allopathic</option><option value="Ayurvedic">Ayurvedic</option><option value="Homeopathic">Homeopathic</option></select></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(13) Date of Manufacturing</label><input type="date" name="pharmacy.manufacturingDate" value={formData.pharmacy.manufacturingDate} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(14) Date of Expiry</label><input type="date" name="pharmacy.expiryDate" value={formData.pharmacy.expiryDate} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                </div>

                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(15) Usage Description In Short</label><textarea name="pharmacy.usageDescription" value={formData.pharmacy.usageDescription} onChange={handleChange} rows={2} className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-medium focus:bg-white outline-none resize-none"></textarea></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(16) Side Effects</label><input type="text" name="pharmacy.sideEffects" value={formData.pharmacy.sideEffects} onChange={handleChange} className="w-full h-10 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(23) Contraindications</label><input type="text" name="pharmacy.contraindications" value={formData.pharmacy.contraindications} onChange={handleChange} className="w-full h-10 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm" /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(18) How it Works</label><textarea name="pharmacy.howItWorks" value={formData.pharmacy.howItWorks} onChange={handleChange} rows={2} className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"></textarea></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(19) Safety Advice</label><textarea name="pharmacy.safetyAdvice" value={formData.pharmacy.safetyAdvice} onChange={handleChange} rows={2} className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"></textarea></div>
                </div>

                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(20) Interaction with Drugs and Food</label><textarea name="pharmacy.interactions" value={formData.pharmacy.interactions} onChange={handleChange} rows={2} className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"></textarea></div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(24) Schedule</label><select name="pharmacy.schedule" value={formData.pharmacy.schedule} onChange={handleChange} className="w-full h-10 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"><option value="">None</option><option value="Schedule H">Schedule H</option><option value="Schedule H1">Schedule H1</option><option value="Schedule X">Schedule X</option><option value="Schedule G">Schedule G</option></select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(26) Under DPCO?</label><select name="pharmacy.underDPCO" value={formData.pharmacy.underDPCO} onChange={handleChange} className="w-full h-10 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(22) Storage Explanation</label><input type="text" name="pharmacy.storage" value={formData.pharmacy.storage} onChange={handleChange} placeholder="e.g. Store in cool place" className="w-full h-10 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm" /></div>
                </div>

                <div className="space-y-6 pt-4 border-t border-dashed border-neutral-200">
                  <h4 className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em]">Supplier / Manufacturer Info</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(17) Manufacturer/Dealer Name</label><input type="text" name="pharmacy.manufacturerName" value={formData.pharmacy.manufacturerName} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(21) Licence Number</label><input type="text" name="pharmacy.manufacturerLicenseNo" value={formData.pharmacy.manufacturerLicenseNo} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(27) Manufacturing Process</label><input type="text" name="pharmacy.manufacturingProcess" value={formData.pharmacy.manufacturingProcess} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm" /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">(28) Manufacturer Address</label><textarea name="pharmacy.manufacturerAddress" value={formData.pharmacy.manufacturerAddress} onChange={handleChange} rows={2} className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"></textarea></div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {isProduce && (
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-8">
              <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-emerald-600 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Produce Specifications</h2></div>

              {/* Product Highlights */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 text-emerald-600">★ Product Highlights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Pack of</label><input type="text" name="freshProduce.packOf" value={formData.freshProduce.packOf} onChange={handleChange} placeholder="e.g. 1kg" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold shadow-sm" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Type</label><input type="text" name="freshProduce.type" value={formData.freshProduce.type} onChange={handleChange} placeholder="e.g. Seasonal" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold shadow-sm" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Quantity</label><input type="text" name="freshProduce.quantity" value={formData.freshProduce.quantity} onChange={handleChange} placeholder="e.g. 5 units" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold shadow-sm" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Shelf Life</label><input type="text" name="freshProduce.shelfLife" value={formData.freshProduce.shelfLife} onChange={handleChange} placeholder="e.g. 3-4 days" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold shadow-sm" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Form</label><input type="text" name="freshProduce.form" value={formData.freshProduce.form} onChange={handleChange} placeholder="e.g. Whole/Cut" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold shadow-sm" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Organic?</label><select name="freshProduce.isOrganic" value={formData.freshProduce.isOrganic} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold shadow-sm"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Common Name</label><input type="text" name="freshProduce.commonName" value={formData.freshProduce.commonName} onChange={handleChange} placeholder="e.g. Onion" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold shadow-sm" /></div>
                </div>
              </div>

              {/* All Details / General */}
              <div className="space-y-6 pt-6 border-t border-neutral-100">
                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">General Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Origin / Country</label><input type="text" name="freshProduce.origin" value={formData.freshProduce.origin} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Packaging Type</label><input type="text" name="freshProduce.packagingType" value={formData.freshProduce.packagingType} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Net Quantity</label><input type="text" name="freshProduce.netQuantity" value={formData.freshProduce.netQuantity} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Added Preservatives?</label><select name="freshProduce.addedPreservatives" value={formData.freshProduce.addedPreservatives} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Whole / Cut?</label><select name="freshProduce.isWhole" value={formData.freshProduce.isWhole} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold"><option value="Yes">Whole</option><option value="No">Pre-Cut</option></select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Secondary Quantity</label><input type="text" name="freshProduce.secondaryQuantity" value={formData.freshProduce.secondaryQuantity} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Food Type</label><select name="foodType" value={formData.foodType} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-[10px] font-black uppercase"><option value="Veg">Veg</option><option value="Non-Veg">Non-Veg</option><option value="Egg">Egg</option></select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Imported?</label><select name="freshProduce.isImported" value={formData.freshProduce.isImported} onChange={handleChange} className="w-full h-10 px-4 bg-white border border-neutral-100 rounded-xl text-sm font-bold"><option value="No">Local / Domestic</option><option value="Yes">Imported</option></select></div>
                </div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Product Weight (Total)</label><input type="text" name="weight" value={formData.weight} onChange={handleChange} placeholder="e.g. 500g" className="w-full h-11 px-4 bg-white border border-neutral-100 rounded-xl text-sm font-bold" /></div>
              </div>
            </section>
          )}

          {isGrocery && (
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-8">
              <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-amber-600 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Grocery Details</h2></div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Unit Type</label><select name="grocery.unitType" value={formData.grocery.unitType} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white focus:border-amber-500 transition-all outline-none"><option value="Kg">Kg</option><option value="Gram">Gram</option><option value="Litre">Litre</option><option value="Piece">Piece</option><option value="Packet">Packet</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Minimum Order Qty</label><input type="number" name="grocery.minOrderQuantity" value={formData.grocery.minOrderQuantity} onChange={handleChange} placeholder="e.g. 1" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white focus:border-amber-500 transition-all outline-none" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Expiry Date</label><input type="date" name="grocery.expiryDate" value={formData.grocery.expiryDate} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white focus:border-amber-500 transition-all outline-none" /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em]">Brand Name *</label><select name="grocery.brand" value={formData.grocery.brand} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white focus:border-amber-500 transition-all outline-none"><option value="">Select Brand</option>{brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}</select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Barcode / SKU</label><input type="text" name="barcode" value={formData.barcode} onChange={handleChange} placeholder="Optional Barcode" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white focus:border-amber-500 transition-all outline-none" /></div>
              </div>
            </section>
          )}

          {isElectronics && isScheduled && (
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-8">
              <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-blue-600 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Electronics & Gadgets Specifications</h2></div>

              {/* 1. Technical Specs */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 text-blue-600">★ Technical Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Model Number</label><input type="text" name="electronics.modelNumber" value={formData.electronics.modelNumber} onChange={handleChange} placeholder="e.g. iPhone 15 Pro" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Condition</label><select name="electronics.productCondition" value={formData.electronics.productCondition} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="New">New</option><option value="Refurbished">Refurbished</option><option value="Used">Used</option></select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Warranty?</label><select name="electronics.warranty" value={formData.electronics.warranty} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Warranty Period</label><input type="text" name="electronics.warrantyPeriod" value={formData.electronics.warrantyPeriod} onChange={handleChange} placeholder="e.g. 1 Year" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Country of Origin</label><input type="text" name="electronics.countryOfOrigin" value={formData.electronics.countryOfOrigin} onChange={handleChange} placeholder="e.g. India" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Color Options</label><input type="text" name="electronics.colorOptions" value={formData.electronics.colorOptions} onChange={handleChange} placeholder="e.g. Space Black, Titanium" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                </div>
              </div>

              {/* 2. Hardware Performance */}
              <div className="space-y-6 pt-6 border-t border-neutral-100">
                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Hardware & OS</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Processor</label><input type="text" name="electronics.processorType" value={formData.electronics.processorType} onChange={handleChange} placeholder="e.g. M2 Chip" className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">RAM</label><input type="text" name="electronics.ram" value={formData.electronics.ram} onChange={handleChange} placeholder="e.g. 16GB" className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Storage</label><input type="text" name="electronics.storageCapacity" value={formData.electronics.storageCapacity} onChange={handleChange} placeholder="e.g. 512GB SSD" className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Display Size</label><input type="text" name="electronics.displaySize" value={formData.electronics.displaySize} onChange={handleChange} placeholder="e.g. 6.7 inch" className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Battery</label><input type="text" name="electronics.batteryCapacity" value={formData.electronics.batteryCapacity} onChange={handleChange} placeholder="e.g. 5000mAh" className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">OS</label><input type="text" name="electronics.operatingSystem" value={formData.electronics.operatingSystem} onChange={handleChange} placeholder="e.g. iOS 17" className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Connectivity (WiFi, BT, 5G)</label><input type="text" name="electronics.connectivity" value={formData.electronics.connectivity} onChange={handleChange} placeholder="WiFi, Bluetooth, NFC" className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Power Consumption</label><input type="text" name="electronics.powerConsumption" value={formData.electronics.powerConsumption} onChange={handleChange} placeholder="e.g. 20W" className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                </div>
              </div>

              {/* 3. Media & Resources */}
              <div className="space-y-6 pt-6 border-t border-neutral-100">
                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Media & Documentation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Video URL (YouTube/Cloudinary)</label><input type="text" name="electronics.videoUrl" value={formData.electronics.videoUrl} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-xs" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">360° View URL</label><input type="text" name="electronics.threeSixtyViewUrl" value={formData.electronics.threeSixtyViewUrl} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-xs" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Datasheet PDF URL</label><input type="text" name="electronics.datasheetUrl" value={formData.electronics.datasheetUrl} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-xs" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Promotional Banner URL</label><input type="text" name="electronics.promotionalBanner" value={formData.electronics.promotionalBanner} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-xs" /></div>
                </div>
              </div>

              {/* 4. Shipping & Logistics */}
              <div className="space-y-6 pt-6 border-t border-neutral-100">
                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Shipping & Logistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Pkg Weight</label><input type="text" name="electronics.packageWeight" value={formData.electronics.packageWeight} onChange={handleChange} placeholder="e.g. 1.2kg" className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Length (cm)</label><input type="text" name="electronics.packageLength" value={formData.electronics.packageLength} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Width (cm)</label><input type="text" name="electronics.packageWidth" value={formData.electronics.packageWidth} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Height (cm)</label><input type="text" name="electronics.packageHeight" value={formData.electronics.packageHeight} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Shipping Class</label><input type="text" name="electronics.shippingClass" value={formData.electronics.shippingClass} onChange={handleChange} placeholder="e.g. Fragile" className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Est. Delivery Time</label><input type="text" name="electronics.deliveryTime" value={formData.electronics.deliveryTime} onChange={handleChange} placeholder="e.g. 3-5 Business Days" className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold" /></div>
                </div>
              </div>

              {/* 5. Compliance & Support */}
              <div className="space-y-6 pt-6 border-t border-neutral-100">
                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Compliance & Support</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">BIS Certification</label><input type="text" name="electronics.bisCertification" value={formData.electronics.bisCertification} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Serial Number</label><input type="text" name="electronics.serialNumber" value={formData.electronics.serialNumber} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Installation?</label><select name="electronics.installationRequired" value={formData.electronics.installationRequired} onChange={handleChange} className="w-full h-10 px-4 bg-white rounded-xl border border-neutral-100 text-sm font-bold"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Importer Details</label><textarea name="electronics.importerDetails" value={formData.electronics.importerDetails} onChange={handleChange} rows={2} className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"></textarea></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Manufacturer Details</label><textarea name="electronics.manufacturerDetails" value={formData.electronics.manufacturerDetails} onChange={handleChange} rows={2} className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"></textarea></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Installation Charges (₹)</label><input type="number" name="electronics.installationCharges" value={formData.electronics.installationCharges} onChange={handleChange} className="w-full h-10 px-4 bg-white border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Support Contact</label><input type="text" name="electronics.supportContact" value={formData.electronics.supportContact} onChange={handleChange} className="w-full h-10 px-4 bg-white border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Replacement Policy</label><input type="text" name="electronics.replacementPolicy" value={formData.electronics.replacementPolicy} onChange={handleChange} className="w-full h-10 px-4 bg-white border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                </div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Safety Instructions</label><textarea name="electronics.safetyInstructions" value={formData.electronics.safetyInstructions} onChange={handleChange} rows={2} className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"></textarea></div>
              </div>

              {/* 6. Stock & Bulk Pricing */}
              <div className="space-y-6 pt-6 border-t border-neutral-100">
                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Inventory & Special Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Min Stock Alert</label><input type="number" name="electronics.minStockAlert" value={formData.electronics.minStockAlert} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Bulk Price (Optional)</label><input type="number" name="electronics.bulkPrice" value={formData.electronics.bulkPrice} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                </div>
              </div>
            </section>
          )}

          {isFashion && (
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-8">
              <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-rose-600 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Fashion & Apparel Specifications</h2></div>

              {/* 1. Basic Fashion Info */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 text-rose-600">★ Basic Fashion Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Gender</label>
                    <select name="fashionApparel.gender" value={formData.fashionApparel.gender} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="Men">Men</option><option value="Women">Women</option><option value="Unisex">Unisex</option><option value="Kids">Kids</option></select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Age Group</label>
                    <select name="fashionApparel.ageGroup" value={formData.fashionApparel.ageGroup} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="Adult">Adult</option><option value="Teen">Teen</option><option value="Kids">Kids</option><option value="Baby">Baby</option></select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Apparel Category</label>
                    <select name="fashionApparel.apparelType" value={formData.fashionApparel.apparelType} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold">
                      <option value="">Select Type</option>
                      <optgroup label="Topwear">
                        <option value="T-Shirts">T-Shirts</option>
                        <option value="Shirts">Shirts</option>
                        <option value="Jackets">Jackets</option>
                        <option value="Hoodies">Hoodies</option>
                        <option value="Sweaters">Sweaters</option>
                      </optgroup>
                      <optgroup label="Bottomwear">
                        <option value="Jeans">Jeans</option>
                        <option value="Trousers">Trousers</option>
                        <option value="Shorts">Shorts</option>
                        <option value="Leggings">Leggings</option>
                      </optgroup>
                      <optgroup label="Ethnic Wear">
                        <option value="Kurta">Kurta</option>
                        <option value="Saree">Saree</option>
                        <option value="Salwar Suit">Salwar Suit</option>
                        <option value="Sherwani">Sherwani</option>
                      </optgroup>
                      <option value="Innerwear">Innerwear</option>
                      <option value="Sleepwear">Sleepwear</option>
                      <option value="Sportswear">Sportswear</option>
                      <option value="Winter Wear">Winter Wear</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Occasion</label>
                    <select name="fashionApparel.occasion" value={formData.fashionApparel.occasion} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="Casual">Casual</option><option value="Formal">Formal</option><option value="Party Wear">Party Wear</option><option value="Sports">Sports</option><option value="Ethnic">Ethnic</option></select>
                  </div>
                </div>
              </div>

              {/* 2. Size & Fit */}
              <div className="space-y-6 pt-6 border-t border-neutral-100">
                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Size & Fit</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3 col-span-1 md:col-span-2">
                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Available Sizes</label>
                    <div className="flex flex-wrap gap-2">
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                        <button key={size} type="button" onClick={() => handleSizeChange(size)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${formData.fashionApparel.availableSizes.includes(size) ? "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-600/20" : "bg-neutral-50 text-neutral-400 border-neutral-100 hover:border-neutral-300"}`}>{size}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Fit Type</label>
                    <select name="fashionApparel.fitType" value={formData.fashionApparel.fitType} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="Slim Fit">Slim Fit</option><option value="Regular Fit">Regular Fit</option><option value="Loose Fit">Loose Fit</option><option value="Oversized">Oversized</option></select>
                  </div>
                </div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Size Chart URL</label><input type="text" name="fashionApparel.sizeChartUrl" value={formData.fashionApparel.sizeChartUrl} onChange={handleChange} placeholder="Link to size guide image" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
              </div>

              {/* 3. Color & Design */}
              <div className="space-y-6 pt-6 border-t border-neutral-100">
                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Color & Design</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Primary Color</label><input type="text" name="fashionApparel.primaryColor" value={formData.fashionApparel.primaryColor} onChange={handleChange} placeholder="e.g. Red" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Secondary Color</label><input type="text" name="fashionApparel.secondaryColor" value={formData.fashionApparel.secondaryColor} onChange={handleChange} placeholder="e.g. White" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Pattern</label><select name="fashionApparel.pattern" value={formData.fashionApparel.pattern} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="Solid">Solid</option><option value="Printed">Printed</option><option value="Striped">Striped</option><option value="Checked">Checked</option><option value="Embroidered">Embroidered</option></select></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Sleeve Type</label><select name="fashionApparel.sleeveType" value={formData.fashionApparel.sleeveType} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="Full Sleeve">Full Sleeve</option><option value="Half Sleeve">Half Sleeve</option><option value="Sleeveless">Sleeveless</option></select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Neck Type</label><select name="fashionApparel.neckType" value={formData.fashionApparel.neckType} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="Round Neck">Round Neck</option><option value="V-Neck">V-Neck</option><option value="Collar">Collar</option></select></div>
                </div>
              </div>

              {/* 4. Fabric & Material */}
              <div className="space-y-6 pt-6 border-t border-neutral-100">
                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Fabric & Material</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Fabric Type</label><select name="fashionApparel.fabricType" value={formData.fashionApparel.fabricType} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="Cotton">Cotton</option><option value="Polyester">Polyester</option><option value="Denim">Denim</option><option value="Silk">Silk</option><option value="Wool">Wool</option><option value="Linen">Linen</option></select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Fabric Blend %</label><input type="text" name="fashionApparel.fabricBlend" value={formData.fashionApparel.fabricBlend} onChange={handleChange} placeholder="e.g. 90% Cotton" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Stretchable?</label><select name="fashionApparel.isStretchable" value={formData.fashionApparel.isStretchable} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                </div>
              </div>

              {/* 5. Media & Logistics */}
              <div className="space-y-6 pt-6 border-t border-neutral-100">
                <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-widest ml-1">★ Media & Shipping</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Model Image URL</label><input type="text" name="fashionApparel.modelImage" value={formData.fashionApparel.modelImage} onChange={handleChange} placeholder="Link to image with model" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Product Video URL</label><input type="text" name="fashionApparel.videoUrl" value={formData.fashionApparel.videoUrl} onChange={handleChange} placeholder="Link to product video" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Pkg Weight</label><input type="text" name="fashionApparel.packageWeight" value={formData.fashionApparel.packageWeight} onChange={handleChange} placeholder="e.g. 500g" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Length (cm)</label><input type="text" name="fashionApparel.packageLength" value={formData.fashionApparel.packageLength} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Width (cm)</label><input type="text" name="fashionApparel.packageWidth" value={formData.fashionApparel.packageWidth} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Height (cm)</label><input type="text" name="fashionApparel.packageHeight" value={formData.fashionApparel.packageHeight} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                </div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Shipping Class</label><input type="text" name="fashionApparel.shippingClass" value={formData.fashionApparel.shippingClass} onChange={handleChange} placeholder="e.g. Standard" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
              </div>

              {/* 6. Care & Country */}
              <div className="space-y-6 pt-6 border-t border-neutral-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Country of Origin</label><input type="text" name="fashionApparel.countryOfOrigin" value={formData.fashionApparel.countryOfOrigin} onChange={handleChange} placeholder="e.g. India" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Min Order Qty</label><input type="number" name="fashionApparel.minOrderQuantity" value={formData.fashionApparel.minOrderQuantity} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                </div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Care Instructions</label><textarea name="fashionApparel.careInstructions" value={formData.fashionApparel.careInstructions} onChange={handleChange} placeholder="e.g. Machine wash cold, do not bleach" className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-medium focus:bg-white transition-all outline-none resize-none"></textarea></div>
              </div>
            </section>
          )}

          {isBeauty && (
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-8">
              <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-pink-500 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Beauty & Personal Care Specs</h2></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Key Benefits</label><textarea name="beautyPersonalCare.keyBenefits" value={formData.beautyPersonalCare.keyBenefits} onChange={handleChange} rows={2} className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"></textarea></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Ingredients</label><textarea name="beautyPersonalCare.ingredients" value={formData.beautyPersonalCare.ingredients} onChange={handleChange} rows={2} className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"></textarea></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Size / Volume</label><input type="text" name="beautyPersonalCare.sizeVolume" value={formData.beautyPersonalCare.sizeVolume} onChange={handleChange} placeholder="e.g. 100ml" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Skin Type</label><select name="beautyPersonalCare.skinType" value={formData.beautyPersonalCare.skinType} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="">Select</option><option value="Dry">Dry</option><option value="Oily">Oily</option><option value="Combination">Combination</option><option value="Sensitive">Sensitive</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Formulation</label><select name="beautyPersonalCare.formulation" value={formData.beautyPersonalCare.formulation} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="">Select</option><option value="Gel">Gel</option><option value="Cream">Cream</option><option value="Serum">Serum</option><option value="Oil">Oil</option><option value="Powder">Powder</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">SPF</label><input type="text" name="beautyPersonalCare.spf" value={formData.beautyPersonalCare.spf} onChange={handleChange} placeholder="e.g. SPF 50" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-neutral-100">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Tested?</label><select name="beautyPersonalCare.isDermatologicallyTested" value={formData.beautyPersonalCare.isDermatologicallyTested} onChange={handleChange} className="w-full h-10 px-4 bg-white border border-neutral-100 rounded-xl text-xs"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Vegan?</label><select name="beautyPersonalCare.isVegan" value={formData.beautyPersonalCare.isVegan} onChange={handleChange} className="w-full h-10 px-4 bg-white border border-neutral-100 rounded-xl text-xs"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Cruelty Free?</label><select name="beautyPersonalCare.isCrueltyFree" value={formData.beautyPersonalCare.isCrueltyFree} onChange={handleChange} className="w-full h-10 px-4 bg-white border border-neutral-100 rounded-xl text-xs"><option value="No">No</option><option value="Yes">Yes</option></select></div>
              </div>
            </section>
          )}

          {isHomeKitchen && (
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-8">
              <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-orange-500 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Home & Kitchen Care Specs</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Material</label><select name="homeKitchen.material" value={formData.homeKitchen.material} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="Steel">Steel</option><option value="Plastic">Plastic</option><option value="Glass">Glass</option><option value="Wood">Wood</option><option value="Silicone">Silicone</option><option value="Other">Other</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Capacity / Size</label><input type="text" name="homeKitchen.capacitySize" value={formData.homeKitchen.capacitySize} onChange={handleChange} placeholder="e.g. 5L" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Power Type</label><select name="homeKitchen.powerType" value={formData.homeKitchen.powerType} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="None">None</option><option value="Electric">Electric</option><option value="Manual">Manual</option><option value="Battery">Battery</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Warranty</label><input type="text" name="homeKitchen.warranty" value={formData.homeKitchen.warranty} onChange={handleChange} placeholder="e.g. 1 Year" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-neutral-100">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Power Consumption</label><input type="text" name="homeKitchen.powerConsumption" value={formData.homeKitchen.powerConsumption} onChange={handleChange} placeholder="e.g. 1500W" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Energy Rating</label><input type="text" name="homeKitchen.energyRating" value={formData.homeKitchen.energyRating} onChange={handleChange} placeholder="e.g. 5 Star" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
              </div>
            </section>
          )}

          {isBabyKids && (
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-8">
              <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-sky-400 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Baby & Kids Product Specs</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Age Group</label><select name="babyKids.ageGroup" value={formData.babyKids.ageGroup} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="">Select</option><option value="0–3 Months">0–3 Months</option><option value="3–6 Months">3–6 Months</option><option value="6–12 Months">6–12 Months</option><option value="1–3 Years">1–3 Years</option><option value="3–5 Years">3–5 Years</option><option value="5–10 Years">5–10 Years</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Gender</label><select name="babyKids.gender" value={formData.babyKids.gender} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="Unisex">Unisex</option><option value="Boys">Boys</option><option value="Girls">Girls</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Material / Fabric</label><input type="text" name="babyKids.materialFabric" value={formData.babyKids.materialFabric} onChange={handleChange} placeholder="e.g. 100% Organic Cotton" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-neutral-100">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Safety Certification</label><input type="text" name="babyKids.safetyCertification" value={formData.babyKids.safetyCertification} onChange={handleChange} placeholder="e.g. EN71, ASTM" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">BPA Free?</label><select name="babyKids.isBpaFree" value={formData.babyKids.isBpaFree} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Non-Toxic?</label><select name="babyKids.isNonToxic" value={formData.babyKids.isNonToxic} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                </div>
              </div>
            </section>
          )}

          {isSportsFitness && (
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-8">
              <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-green-500 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Sports & Fitness Specifications</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Key Features</label><textarea name="sportsFitness.keyFeatures" value={formData.sportsFitness.keyFeatures} onChange={handleChange} rows={2} placeholder="Highlight main benefits..." className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"></textarea></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Material</label><input type="text" name="sportsFitness.material" value={formData.sportsFitness.material} onChange={handleChange} placeholder="e.g. Carbon Fiber, Leather" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Weight</label><input type="text" name="sportsFitness.weight" value={formData.sportsFitness.weight} onChange={handleChange} placeholder="e.g. 300g" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Dimensions</label><input type="text" name="sportsFitness.dimensions" value={formData.sportsFitness.dimensions} onChange={handleChange} placeholder="e.g. 10x20x30 cm" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Color</label><input type="text" name="sportsFitness.color" value={formData.sportsFitness.color} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Size</label><input type="text" name="sportsFitness.size" value={formData.sportsFitness.size} onChange={handleChange} placeholder="e.g. XL, 5, Standard" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-neutral-100">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Sport Type</label><input type="text" name="sportsFitness.sportType" value={formData.sportsFitness.sportType} onChange={handleChange} placeholder="e.g. Cricket, Yoga" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Skill Level</label><select name="sportsFitness.skillLevel" value={formData.sportsFitness.skillLevel} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="Beginner">Beginner</option><option value="Intermediate">Intermediate</option><option value="Professional">Professional</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Usage</label><select name="sportsFitness.usage" value={formData.sportsFitness.usage} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="Indoor">Indoor</option><option value="Outdoor">Outdoor</option><option value="Both">Both</option></select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-neutral-100">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Shipping Class</label><select name="sportsFitness.shippingClass" value={formData.sportsFitness.shippingClass} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="Standard">Standard</option><option value="Heavy Item">Heavy Item</option></select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Delivery Charges</label><input type="number" name="sportsFitness.deliveryCharges" value={formData.sportsFitness.deliveryCharges} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                </div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Warranty</label><input type="text" name="sportsFitness.warranty" value={formData.sportsFitness.warranty} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
              </div>
            </section>
          )}
          {isAutomotive && (
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-8">
              <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-zinc-700 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Automotive & Spare Parts Specs</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Vehicle Type</label><select name="automotive.vehicleType" value={formData.automotive.vehicleType} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="">Select</option><option value="Car">Car</option><option value="Bike">Bike</option><option value="Truck">Truck</option><option value="EV">EV</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Compatible Brands</label><input type="text" name="automotive.compatibleBrand" value={formData.automotive.compatibleBrand} onChange={handleChange} placeholder="e.g. Toyota, Honda" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Compatible Models</label><input type="text" name="automotive.compatibleModel" value={formData.automotive.compatibleModel} onChange={handleChange} placeholder="e.g. Camry, Civic" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-neutral-100">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Material</label><input type="text" name="automotive.material" value={formData.automotive.material} onChange={handleChange} placeholder="e.g. Aluminum" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Part Number</label><input type="text" name="automotive.partNumber" value={formData.automotive.partNumber} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">OEM?</label><select name="automotive.isOem" value={formData.automotive.isOem} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="No">No (Aftermarket)</option><option value="Yes">Yes (OEM)</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Return Eligibility</label><select name="automotive.returnEligibility" value={formData.automotive.returnEligibility} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="Yes">Eligible</option><option value="No">Non-Refundable</option></select></div>
              </div>
            </section>
          )}

          {isBooksStationery && (
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-8">
              <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-amber-800 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Books & Stationery Specs</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">ISBN (Book)</label><input type="text" name="booksStationery.isbn" value={formData.booksStationery.isbn} onChange={handleChange} placeholder="13 digits" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Author / Writer</label><input type="text" name="booksStationery.author" value={formData.booksStationery.author} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Publisher</label><input type="text" name="booksStationery.publisher" value={formData.booksStationery.publisher} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-neutral-100">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Language</label><input type="text" name="booksStationery.language" value={formData.booksStationery.language} onChange={handleChange} placeholder="e.g. English" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Pages</label><input type="number" name="booksStationery.pages" value={formData.booksStationery.pages} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Binding Type</label><select name="booksStationery.bindingType" value={formData.booksStationery.bindingType} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="">Select</option><option value="Paperback">Paperback</option><option value="Hardcover">Hardcover</option><option value="Digital">Digital</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Condition</label><select name="booksStationery.condition" value={formData.booksStationery.condition} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="New">New</option><option value="Used">Used</option></select></div>
              </div>
            </section>
          )}

          {isHealthWellness && (
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-8">
              <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-green-600 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Health & Wellness Specifications</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Ingredients / Composition</label><textarea name="healthWellness.ingredients" value={formData.healthWellness.ingredients} onChange={handleChange} rows={2} placeholder="List active ingredients..." className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"></textarea></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Health Benefits</label><textarea name="healthWellness.healthBenefit" value={formData.healthWellness.healthBenefit} onChange={handleChange} rows={2} placeholder="e.g. Boosts Immunity..." className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"></textarea></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-neutral-100">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Form</label><select name="healthWellness.form" value={formData.healthWellness.form} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="">Select</option><option value="Tablet">Tablet</option><option value="Capsule">Capsule</option><option value="Powder">Powder</option><option value="Liquid">Liquid</option><option value="Gummies">Gummies</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Servings</label><input type="number" name="healthWellness.servingsPerPack" value={formData.healthWellness.servingsPerPack} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Dietary</label><select name="healthWellness.dietaryPreference" value={formData.healthWellness.dietaryPreference} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="Vegetarian">Vegetarian</option><option value="Non-Vegetarian">Non-Vegetarian</option><option value="Vegan">Vegan</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">License No.</label><input type="text" name="healthWellness.licenseNumber" value={formData.healthWellness.licenseNumber} onChange={handleChange} placeholder="FSSAI / AYUSH" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Sugar Free?</label><select name="healthWellness.isSugarFree" value={formData.healthWellness.isSugarFree} onChange={handleChange} className="w-full h-10 px-4 bg-white border border-neutral-100 rounded-xl text-xs"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Gluten Free?</label><select name="healthWellness.isGlutenFree" value={formData.healthWellness.isGlutenFree} onChange={handleChange} className="w-full h-10 px-4 bg-white border border-neutral-100 rounded-xl text-xs"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Organic?</label><select name="healthWellness.isOrganic" value={formData.healthWellness.isOrganic} onChange={handleChange} className="w-full h-10 px-4 bg-white border border-neutral-100 rounded-xl text-xs"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Recommended?</label><select name="healthWellness.isDoctorRecommended" value={formData.healthWellness.isDoctorRecommended} onChange={handleChange} className="w-full h-10 px-4 bg-white border border-neutral-100 rounded-xl text-xs"><option value="No">No</option><option value="Yes">Yes</option></select></div>
              </div>
            </section>
          )}
          {isPetSupplies && (
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-8">
              <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-blue-500 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Pet Supplies Specifications</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Pet Type</label><select name="petSupplies.petType" value={formData.petSupplies.petType} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="">Select Pet</option><option value="Dog">Dog</option><option value="Cat">Cat</option><option value="Bird">Bird</option><option value="Fish">Fish</option><option value="Small Animals">Small Animals</option><option value="Reptiles">Reptiles</option><option value="Other">Other</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Breed Size</label><select name="petSupplies.breedSize" value={formData.petSupplies.breedSize} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="Small">Small</option><option value="Medium">Medium</option><option value="Large">Large</option><option value="All Sizes">All Sizes</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Life Stage</label><select name="petSupplies.lifeStage" value={formData.petSupplies.lifeStage} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="Puppy">Puppy/Kitten</option><option value="Adult">Adult</option><option value="Senior">Senior</option><option value="All Ages">All Ages</option></select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-neutral-100">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Flavor (if food)</label><input type="text" name="petSupplies.flavor" value={formData.petSupplies.flavor} onChange={handleChange} placeholder="e.g. Chicken, Fish" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Weight / Size</label><input type="text" name="petSupplies.weightSize" value={formData.petSupplies.weightSize} onChange={handleChange} placeholder="e.g. 5kg, 10L" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Shelf Life</label><input type="text" name="petSupplies.shelfLife" value={formData.petSupplies.shelfLife} onChange={handleChange} placeholder="e.g. 12 Months" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Expiry Date</label><input type="date" name="petSupplies.expiryDate" value={formData.petSupplies.expiryDate} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
              </div>
              <div className="space-y-2 pt-4"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Ingredients / Material</label><textarea name="petSupplies.ingredients" value={formData.petSupplies.ingredients} onChange={handleChange} rows={2} placeholder="List ingredients for food or materials for toys..." className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm"></textarea></div>
            </section>
          )}

          {isIndustrial && (
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-8">
              <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-slate-800 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Industrial & Business Specifications</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Model / Part No.</label><input type="text" name="industrialBusiness.modelNumber" value={formData.industrialBusiness.modelNumber} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Power Source</label><select name="industrialBusiness.powerSource" value={formData.industrialBusiness.powerSource} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="">Select</option><option value="Electric">Electric</option><option value="Battery">Battery</option><option value="Manual">Manual</option><option value="Hydraulic">Hydraulic</option></select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Usage Type</label><select name="industrialBusiness.usageType" value={formData.industrialBusiness.usageType} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="Industrial">Industrial</option><option value="Commercial">Commercial</option><option value="Workshop">Workshop</option><option value="General">General</option></select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-neutral-100">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Voltage</label><input type="text" name="industrialBusiness.voltage" value={formData.industrialBusiness.voltage} onChange={handleChange} placeholder="e.g. 220V" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Capacity / Load</label><input type="text" name="industrialBusiness.capacity" value={formData.industrialBusiness.capacity} onChange={handleChange} placeholder="e.g. 500kg" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Warranty</label><input type="text" name="industrialBusiness.warrantyPeriod" value={formData.industrialBusiness.warrantyPeriod} onChange={handleChange} placeholder="e.g. 1 Year" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Dispatch Time</label><input type="text" name="industrialBusiness.dispatchTime" value={formData.industrialBusiness.dispatchTime} onChange={handleChange} placeholder="e.g. 2-4 Days" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4">
                <div className="space-y-1.5"><label className="text-[8px] font-black text-neutral-400 uppercase tracking-widest ml-1">ISO Cert?</label><select name="industrialBusiness.isIsoCertified" value={formData.industrialBusiness.isIsoCertified} onChange={handleChange} className="w-full h-10 px-4 bg-white border border-neutral-100 rounded-xl text-xs"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                <div className="space-y-1.5"><label className="text-[8px] font-black text-neutral-400 uppercase tracking-widest ml-1">BIS Cert?</label><select name="industrialBusiness.isBisCertified" value={formData.industrialBusiness.isBisCertified} onChange={handleChange} className="w-full h-10 px-4 bg-white border border-neutral-100 rounded-xl text-xs"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                <div className="space-y-1.5"><label className="text-[8px] font-black text-neutral-400 uppercase tracking-widest ml-1">CE Cert?</label><select name="industrialBusiness.isCeCertified" value={formData.industrialBusiness.isCeCertified} onChange={handleChange} className="w-full h-10 px-4 bg-white border border-neutral-100 rounded-xl text-xs"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                <div className="space-y-1.5"><label className="text-[8px] font-black text-neutral-400 uppercase tracking-widest ml-1">Installation?</label><select name="industrialBusiness.isInstallationAvailable" value={formData.industrialBusiness.isInstallationAvailable} onChange={handleChange} className="w-full h-10 px-4 bg-white border border-neutral-100 rounded-xl text-xs"><option value="No">No</option><option value="Yes">Yes</option></select></div>
                <div className="space-y-1.5"><label className="text-[8px] font-black text-neutral-400 uppercase tracking-widest ml-1">Spare Parts?</label><select name="industrialBusiness.sparePartsAvailability" value={formData.industrialBusiness.sparePartsAvailability} onChange={handleChange} className="w-full h-10 px-4 bg-white border border-neutral-100 rounded-xl text-xs"><option value="No">No</option><option value="Yes">Yes</option></select></div>
              </div>
            </section>
          )}

          {/* Section 3: Pricing & Combinations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sizes & Pricing */}
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-teal-600 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Sizes & Pricing</h2></div>
              <div className="space-y-4">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Variant/Size Name (e.g. Regular, 500g, Half)</label><input type="text" value={variationForm.title} onChange={e => setVariationForm(p => ({ ...p, title: e.target.value }))} className="w-full h-11 px-4 bg-neutral-50 rounded-xl text-[13px] font-bold border border-neutral-100 focus:bg-white focus:border-teal-500 transition-all outline-none" placeholder="e.g. Regular" /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Regular Price (₹)</label><input type="number" value={variationForm.price} onChange={e => setVariationForm(p => ({ ...p, price: e.target.value }))} className="w-full h-10 px-4 bg-neutral-50 rounded-lg text-xs font-bold border border-neutral-100 focus:bg-white transition-all outline-none" placeholder="0" /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Discount (₹)</label><input type="number" value={variationForm.discPrice} onChange={e => setVariationForm(p => ({ ...p, discPrice: e.target.value }))} className="w-full h-10 px-4 bg-neutral-50 rounded-lg text-xs font-bold border border-neutral-100 focus:bg-white transition-all outline-none" placeholder="0" /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Stock</label><input type="number" value={variationForm.stock} onChange={e => setVariationForm(p => ({ ...p, stock: e.target.value }))} className="w-full h-10 px-4 bg-neutral-50 rounded-lg text-xs font-bold border border-neutral-100 focus:bg-white transition-all outline-none" placeholder="999" /></div>
                </div>
                <button type="button" onClick={addVariation} className="w-full h-10 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">Add Configuration Node</button>
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                  {variations.map((v, i) => (<div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl mb-2 group transition-all hover:bg-teal-50/50"><div className="flex items-center gap-3"><div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center font-black text-[9px] text-teal-600 shadow-sm border border-neutral-100">{i + 1}</div><div><p className="text-[11px] font-black text-slate-800">{v.title}</p><div className="flex items-center gap-2"><p className="text-[10px] font-bold text-teal-600">₹{v.discPrice || v.price}</p>{v.discPrice > 0 && <p className="text-[9px] font-bold text-neutral-400 line-through">₹{v.price}</p>}</div></div></div><button type="button" onClick={() => removeVariation(i)} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-all">×</button></div>))}
                </div>
              </div>
            </section>

            {/* Add-ons Management */}
            {!isGrocery && (
              <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-sky-500 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Add-ons / Sides</h2></div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Modifier Name</label><input type="text" value={addonForm.name} onChange={e => setAddonForm(p => ({ ...p, name: e.target.value }))} className="w-full h-10 px-4 bg-neutral-50 rounded-lg text-xs font-bold border-none" placeholder="e.g. Extra Cheese" /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Fee (₹)</label><input type="number" value={addonForm.price} onChange={e => setAddonForm(p => ({ ...p, price: e.target.value }))} className="w-full h-10 px-4 bg-neutral-50 rounded-lg text-xs font-bold border-none" placeholder="0" /></div>
                  </div>
                  <button type="button" onClick={addAddon} className="w-full h-10 bg-slate-900/5 text-slate-900 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">Add Modifier</button>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                    {addons.map((a, i) => (<div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl mb-2 group transition-all hover:bg-sky-50/50"><div className="flex items-center gap-3"><p className="text-[11px] font-black text-slate-800">{a.name}</p></div><div className="flex items-center gap-4"><p className="text-[10px] font-bold text-sky-600">₹{a.price}</p><button type="button" onClick={() => removeAddon(i)} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-all">×</button></div></div>))}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Section 4: Imagery & Logistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Imagery */}
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-teal-600 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Product Images</h2></div><span className="text-[8px] font-black text-neutral-400 uppercase bg-neutral-50 px-3 py-1 rounded-full">Max 5 Photos</span></div>
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-4 lg:col-span-2 aspect-video lg:aspect-auto h-48 lg:h-40 rounded-2xl overflow-hidden border-2 border-dashed border-neutral-200 hover:border-teal-500 transition-all bg-neutral-50 group relative">
                  {imageSlots[0].preview ? (
                    <><img src={imageSlots[0].preview} className="w-full h-full object-cover group-hover:scale-105 transition-all" alt="" /><div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><button type="button" onClick={() => clearImageSlot(0)} className="bg-white text-rose-500 w-8 h-8 rounded-lg font-black text-lg">×</button></div></>
                  ) : (
                    <label className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-neutral-100 transition-all"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><polyline points="21 15 16 10 5 21" /></svg><div className="flex flex-col items-center"><span className="text-[10px] font-black text-neutral-800 uppercase tracking-widest">Cover Image</span><span className="text-[8px] font-bold text-neutral-400 uppercase">Primary Display</span></div><input type="file" onChange={e => handleImageSlotChange(0, e)} className="hidden" accept="image/*" /></label>
                  )}
                </div>
                <div className="col-span-4 lg:col-span-2 grid grid-cols-4 gap-3 lg:h-40">
                  {imageSlots.slice(1).map((slot, index) => (
                    <div key={index + 1} className="aspect-square rounded-xl overflow-hidden border-2 border-dashed border-neutral-200 hover:border-teal-500 transition-all bg-neutral-50 group relative">
                      {slot.preview ? (
                        <><img src={slot.preview} className="w-full h-full object-cover group-hover:scale-105 transition-all" alt="" /><div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><button type="button" onClick={() => clearImageSlot(index + 1)} className="bg-white text-rose-500 w-6 h-6 rounded-md font-black text-sm">×</button></div></>
                      ) : (
                        <label className="absolute inset-0 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-neutral-100 transition-all"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><polyline points="21 15 16 10 5 21" /></svg><span className="text-[7px] font-black text-neutral-400 uppercase">Slot {index + 2}</span><input type="file" onChange={e => handleImageSlotChange(index + 1, e)} className="hidden" accept="image/*" /></label>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {!isTeaCorner && !isGrocery && (
              <section className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-neutral-800 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">Compliance & Limits</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Tax / GST (%)</label>
                    <input
                      type="number"
                      name="tax"
                      value={formData.tax}
                      onChange={handleChange}
                      placeholder="e.g. 18"
                      className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">HSN Code</label>
                    <input type="text" name="hsnCode" value={formData.hsnCode} onChange={handleChange} placeholder="8 digits" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Weight / Size</label>
                    <input type="text" name="weight" value={formData.weight} onChange={handleChange} placeholder="e.g. 500g" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">GST Number</label>
                    {(user?.gstNumber || user?.taxNumber)?.startsWith('http') ? (
                      <div className="relative group h-11 bg-neutral-50 border border-neutral-100 rounded-xl overflow-hidden flex items-center justify-between px-3">
                        <span className="text-[10px] font-bold text-teal-600">Verified Image</span>
                        <div className="h-8 w-12 rounded border border-neutral-200 overflow-hidden bg-white relative">
                          <img src={user.gstNumber || user.taxNumber} className="w-full h-full object-cover" alt="GST" />
                          <a href={user.gstNumber || user.taxNumber} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-[7px] text-white font-black">VIEW</a>
                        </div>
                      </div>
                    ) : (
                      <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} disabled={!!(user?.gstNumber || user?.taxNumber)} placeholder="15 digits" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none disabled:opacity-60" />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">FSSAI License No.</label>
                    {user?.fssaiLicNo?.startsWith('http') ? (
                      <div className="relative group h-11 bg-neutral-50 border border-neutral-100 rounded-xl overflow-hidden flex items-center justify-between px-3">
                        <span className="text-[10px] font-bold text-teal-600">Verified Image</span>
                        <div className="h-8 w-12 rounded border border-neutral-200 overflow-hidden bg-white relative">
                          <img src={user.fssaiLicNo} className="w-full h-full object-cover" alt="FSSAI" />
                          <a href={user.fssaiLicNo} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-[7px] text-white font-black">VIEW</a>
                        </div>
                      </div>
                    ) : (
                      <input type="text" name="fssaiLicNo" value={formData.fssaiLicNo} onChange={handleChange} disabled={!!user?.fssaiLicNo} placeholder="14 digits" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none disabled:opacity-60" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Max Order limit</label>
                    <input type="number" name="totalAllowedQuantity" value={formData.totalAllowedQuantity} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none" />
                  </div>
                </div>
                <p className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest mt-2 leading-relaxed opacity-60">Mandatory for GST compliance and shipping calculations.</p>
              </section>
            )}
          </div>

          {/* SEO & Policies Section */}
          <div className="max-w-7xl mx-auto px-4 pb-32">
            <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3"><div className="w-1.5 h-8 bg-indigo-600 rounded-full"></div><h2 className="text-lg font-black text-neutral-800 tracking-tight">SEO & Policies</h2></div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">SEO Title</label><input type="text" name="seoTitle" value={formData.seoTitle} onChange={handleChange} placeholder="Page title for search engines" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Meta Keywords</label><input type="text" name="seoKeywords" value={formData.seoKeywords} onChange={handleChange} placeholder="e.g. smartphone, electronics, iphone" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none" /></div>
                </div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Meta Description</label><textarea name="seoDescription" value={formData.seoDescription} onChange={handleChange} rows={2} placeholder="Brief summary for search results" className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-medium focus:bg-white transition-all outline-none resize-none"></textarea></div>
              </div>

              <div className="space-y-6 pt-6 border-t border-neutral-100">
                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">★ Return & Refund Policies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Is Returnable?</label><select name="isReturnable" value={formData.isReturnable} onChange={handleChange} className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold"><option value="Yes">Yes</option><option value="No">No (Final Sale)</option></select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Max Return Days</label><input type="number" name="maxReturnDays" value={formData.maxReturnDays} onChange={handleChange} placeholder="7" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold" /></div>
                </div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-1">Return Policy Content</label><textarea name="returnPolicyText" value={formData.returnPolicyText} onChange={handleChange} rows={2} placeholder="e.g. Items can be returned within 7 days of delivery..." className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-medium focus:bg-white transition-all outline-none resize-none"></textarea></div>
              </div>
            </section>
          </div>

          {/* Action Center */}
          <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/95 backdrop-blur-3xl border-t border-neutral-100 p-5 z-[110] flex justify-center shadow-2xl">
            <div className="max-w-xl w-full flex gap-3">
              <button type="button" onClick={() => navigate(-1)} className="h-12 flex-1 bg-white border border-neutral-200 rounded-xl text-[10px] font-black uppercase text-neutral-400 hover:text-neutral-900 transition-all hover:bg-neutral-50">Discard</button>
              <button type="submit" disabled={uploading} className="h-12 flex-[2] bg-teal-600 text-white rounded-xl text-[13px] font-black tracking-tight shadow-xl shadow-teal-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                {uploading ? "Processing..." : (id ? "Update Product" : "Add Product")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
