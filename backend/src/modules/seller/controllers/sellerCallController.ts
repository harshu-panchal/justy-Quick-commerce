import { Request, Response } from "express";
import Seller from "../../../models/Seller";
import { asyncHandler } from "../../../utils/asyncHandler";
import { RtcRole, RtcTokenBuilder } from "agora-token";

const CHANNEL_RE = /^[a-zA-Z0-9_-]{1,64}$/;

export const listVendorsForCall = asyncHandler(async (req: Request, res: Response) => {
  const me = req.user?.userId;
  const sellers = await Seller.find({ status: "Approved", _id: { $ne: me } })
    .select("sellerName storeName mobile status createdAt")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    message: "Vendors fetched successfully",
    data: sellers,
  });
});

export const createAgoraRtcToken = asyncHandler(async (req: Request, res: Response) => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appId.trim()) {
    return res.status(500).json({
      success: false,
      message: "AGORA_APP_ID is not configured on the server",
    });
  }

  if (!appCertificate || !appCertificate.trim()) {
    return res.status(500).json({
      success: false,
      message: "AGORA_APP_CERTIFICATE is not configured on the server (token is required for secured Agora projects)",
    });
  }

  const channel = String(req.body?.channel || "").trim();
  if (!channel || !CHANNEL_RE.test(channel)) {
    return res.status(400).json({
      success: false,
      message: "Invalid channel. Use 1-64 chars of letters/numbers/_/-",
    });
  }

  const account = String(req.user?.userId || "").trim();
  if (!account) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const expireSeconds =
    typeof process.env.AGORA_TOKEN_EXPIRE_SECONDS === "string" && process.env.AGORA_TOKEN_EXPIRE_SECONDS.trim()
      ? Math.max(60, Number(process.env.AGORA_TOKEN_EXPIRE_SECONDS))
      : 60 * 60; // 1 hour default

  const safeExpireSeconds = Number.isFinite(expireSeconds) ? expireSeconds : 3600;
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + safeExpireSeconds;

  const token = RtcTokenBuilder.buildTokenWithUserAccount(
    appId.trim(),
    appCertificate.trim(),
    channel,
    account,
    RtcRole.PUBLISHER,
    safeExpireSeconds,
    safeExpireSeconds
  );

  return res.status(200).json({
    success: true,
    message: "Agora token generated",
    data: { token, channel, uid: account, expiresAt },
  });
});

