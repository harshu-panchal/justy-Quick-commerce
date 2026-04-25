import { Request, Response } from "express";
import Executive from "../../../models/Executive";
import {
  sendOTP as sendOTPService,
  verifyOTP as verifyOTPService,
} from "../../../services/otpService";
import { generateToken } from "../../../services/jwtService";
import { asyncHandler } from "../../../utils/asyncHandler";

/**
 * Send OTP for Executive Login/Registration
 */
export const sendOTP = asyncHandler(async (req: Request, res: Response) => {
  const { mobile } = req.body;

  if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "Valid 10-digit mobile number is required",
    });
  }

  // Send OTP
  const result = await sendOTPService(mobile, "Executive", true);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Verify OTP and Login/Register Step 1
 */
export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({
      success: false,
      message: "Mobile and OTP are required",
    });
  }

  // Verify OTP
  const isValid = await verifyOTPService(mobile, otp, "Executive");
  if (!isValid) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired OTP",
    });
  }

  // Check if executive already exists
  let executive = await Executive.findOne({ mobile });

  if (executive) {
    // If exists, login (unless suspended)
    if (executive.status === 'Suspended') {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Please contact admin.",
      });
    }

    // Generate JWT token
    const token = generateToken(executive._id.toString(), "Executive", "Executive");

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: executive._id,
          name: executive.name,
          mobile: executive.mobile,
          email: executive.email,
          status: executive.status,
          kycStatus: executive.kycStatus,
          referralCode: executive.referralCode,
          userType: 'Executive'
        },
      },
    });
  } else {
    // If not exists, return success and allow frontend to proceed to Registration Step 1
    return res.status(200).json({
      success: true,
      message: "OTP verified. Proceed to registration.",
      data: {
        isNewUser: true,
        mobile
      }
    });
  }
});

/**
 * Register Executive (Step 1)
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, mobile, alternateMobile, workExperience, otp } = req.body;

  console.log('Registering Executive:', { name, email, mobile });

  if (!name || !email || !mobile || !otp) {
    return res.status(400).json({
      success: false,
      message: "Name, email, mobile, and OTP are required",
    });
  }

  // Verify OTP
  const isValid = await verifyOTPService(mobile, otp, "Executive");
  if (!isValid) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired OTP",
    });
  }

  // Check if already exists
  const existing = await Executive.findOne({ $or: [{ mobile }, { email }] });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: "Executive already exists with this mobile or email",
    });
  }

  try {
    const executive = await Executive.create({
      name,
      email,
      mobile,
      alternateMobile: alternateMobile || undefined,
      workExperience: workExperience || undefined,
      status: 'Active',
      isOtpVerified: true
    });

    console.log('Executive Created:', executive._id);

    const token = generateToken(executive._id.toString(), "Executive", "Executive");

    return res.status(201).json({
      success: true,
      message: "Executive registered successfully",
      data: {
        token,
        user: {
          id: executive._id,
          name: executive.name,
          mobile: executive.mobile,
          email: executive.email,
          referralCode: executive.referralCode,
          userType: 'Executive'
        },
      },
    });
  } catch (error: any) {
    console.error('Error creating executive:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error creating executive profile",
    });
  }
});

/**
 * Update KYC Documents (Step 2)
 */
export const updateKYC = asyncHandler(async (req: Request, res: Response) => {
  const id = (req as any).user.userId;
  const { 
    aadharNumber, 
    panNumber, 
    aadharFront, 
    aadharBack, 
    panCard, 
    resume, 
    bankPassbook,
    bankName,
    ifscCode,
    accountNumber,
    accountHolderName,
    dynamicKycData
  } = req.body;

  // Validation
  if (aadharNumber && !/^[0-9]{12}$/.test(aadharNumber)) {
    return res.status(400).json({ success: false, message: "Aadhar number must be exactly 12 digits" });
  }
  if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
    return res.status(400).json({ success: false, message: "Invalid PAN card format (e.g. ABCDE1234F)" });
  }
  if (ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
    return res.status(400).json({ success: false, message: "Invalid IFSC code format (11 characters)" });
  }

  const executive = await Executive.findById(id);
  if (!executive) {
    return res.status(404).json({
      success: false,
      message: "Executive not found",
    });
  }

  // Update KYC Details
  executive.kycDetails = {
    ...executive.kycDetails,
    ...(aadharNumber && { aadharNumber }),
    ...(panNumber && { panNumber }),
    ...(aadharFront && { aadharFront }),
    ...(aadharBack && { aadharBack }),
    ...(panCard && { panCard }),
    ...(resume && { resume }),
    ...(bankPassbook && { bankPassbook }),
  };

  // Update Bank Details
  executive.bankDetails = {
    ...executive.bankDetails,
    ...(bankName && { bankName }),
    ...(ifscCode && { ifscCode }),
    ...(accountNumber && { accountNumber }),
    ...(accountHolderName && { accountHolderName }),
  };
  
  if (dynamicKycData) {
    executive.dynamicKycData = dynamicKycData;
  }
  
  executive.kycStatus = 'Submitted';
  await executive.save();

  return res.status(200).json({
    success: true,
    message: "KYC documents updated successfully",
    data: executive,
  });
});

/**
 * Update Executive Profile
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const executiveId = (req as any).user.userId;
  const { name, email, alternateMobile } = req.body;
  
  const executive = await Executive.findById(executiveId);
  if (!executive) {
    return res.status(404).json({
      success: false,
      message: "Executive not found",
    });
  }
  
  if (name) executive.name = name;
  if (email) executive.email = email;
  if (alternateMobile) executive.alternateMobile = alternateMobile;
  
  await executive.save();
  
  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: executive,
  });
});
