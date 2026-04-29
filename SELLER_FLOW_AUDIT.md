# Seller Flow — Bug Audit Report

**Date:** 2026-04-29
**Scope:** Seller signup, approval/rejection, login, and route access
**Result:** All 6 reported bugs confirmed to exist

---

## Summary

| # | Bug | Severity | Status |
|---|-----|----------|--------|
| S-01 | Mobile number not verified during signup (only email is) | High | Confirmed |
| S-02 | Rejected seller still sees "Waiting for Verification" | High | Confirmed |
| S-03 | Admin can reject a seller without providing a reason | Medium | Confirmed |
| S-04 | Rejected seller can log in successfully and receive a JWT | Critical | Confirmed |
| S-05 | Rejected seller is redirected to spin wheel then dashboard | Critical | Confirmed |
| S-06 | Rejected seller can access all protected routes directly via URL | Critical | Confirmed |

---

## S-01 — Mobile Number Not Verified During Seller Signup

**Severity:** High
**Status:** Confirmed

### What happens
During seller registration, only the email address is verified via OTP. The mobile number is accepted, validated for format, and stored — but no OTP is ever sent to it and no verification is required.

### Evidence

**`backend/src/modules/seller/controllers/sellerAuthController.ts`**
```
Line 35:  const result = await sendEmailOtp(email, "Seller");
          // ↑ Only email OTP is sent — no sendOTP() call for mobile anywhere in register()
```

The `register` function (lines 174–338) collects a mobile number, validates its format, and saves it. There is no call to `sendOTP(mobile, 'Seller')` and no step where the seller must prove ownership of the mobile number.

**`backend/src/models/Seller.ts`**

The Seller schema has no `mobileVerified`, `mobileVerificationStatus`, or similar field — confirming that mobile verification was never designed into the signup flow.

**`backend/src/routes/sellerAuthRoutes.ts`**
```
Line 9:   router.post("/send-otp", ...)   // login only
Line 13:  router.post("/verify-otp", ...) // login only
Line 17:  router.post("/register", ...)   // email OTP only
```
The mobile OTP endpoints exist only for login, not for the signup/registration step.

### Impact
Any mobile number can be associated with a seller account without proving ownership. This enables account enumeration, impersonation, and prevents reliable SMS-based recovery or notifications.

---

## S-02 — Rejected Seller Sees "Waiting for Verification" Instead of Rejection Notice

**Severity:** High
**Status:** Confirmed

### What happens
After an admin rejects a seller, the seller's app still displays the "Waiting for Verification" screen. The rejection is never surfaced to the seller — the page only listens for approval events.

### Evidence

**`frontend/src/modules/seller/pages/SellerVerificationPending.tsx`**
```
Lines 17-25:  WebSocket listener checks: if (data.status === 'Approved') { ... }
Lines 29-50:  Polling checks:            if (seller.status === 'Approved') { ... }
              // 'Rejected' is never handled — page stays frozen in "pending" state
```

**`frontend/src/modules/seller/components/SellerAccessGuard.tsx`**
```
Lines 20-26:  if (status === "Pending")  → redirect to /seller/verification-pending
Lines 28-37:  if (status === "Approved") → redirect to deposit payment or dashboard
Lines 40-47:  // No 'Rejected' case — falls through to default return
```

Because neither the guard nor the pending page handle the `Rejected` status, the seller is stuck on the verification-pending screen indefinitely with no feedback.

### Impact
Rejected sellers are never informed of the decision. They cannot take corrective action, re-apply, or contact support because the UI gives them no signal that anything changed.

---

## S-03 — Admin Can Reject a Seller Without Providing a Reason

**Severity:** Medium
**Status:** Confirmed

### What happens
The rejection action on the admin panel fires immediately with no input field for a reason. The backend does not accept, require, or store a rejection reason.

### Evidence

**`frontend/src/modules/admin/pages/AdminManageSellerList.tsx`**
```
Lines 333-359:  handleReject() function
Line 338:       const response = await updateSellerStatus(sellerId, 'Rejected');
                // Called immediately — no modal, no reason input, no confirmation
```

**`backend/src/modules/seller/controllers/sellerController.ts`**
```
Line 84:   const { status } = req.body;
           // Only 'status' is extracted — no 'reason' field
Lines 86-91: Validation checks status value only, no reason validation
Line 101:  seller.status = status;
           // Only status is saved — reason is discarded even if sent
```

**`backend/src/models/Seller.ts`**

The Seller schema has no `rejectionReason` field. Even if a reason were sent from the frontend it would be silently ignored.

### Impact
Sellers cannot understand why they were rejected and cannot fix specific issues. Admins have no audit trail of rejection decisions.

---

## S-04 — Rejected Seller Can Log In and Receive a Valid JWT

**Severity:** Critical
**Status:** Confirmed

### What happens
The seller OTP verification endpoint issues a JWT token to any seller who provides a valid OTP, regardless of whether their account status is `Pending`, `Rejected`, or `Approved`.

### Evidence

**`backend/src/modules/seller/controllers/sellerAuthController.ts` — `verifyOTP` function**
```
Lines 122-128:  OTP is verified
Lines 130-137:  Seller is fetched from DB
Line 139-140:   const token = generateToken(seller._id.toString(), "Seller", ...);
                return res.status(200).json({ success: true, token, ... });
                // ↑ Token issued with NO check on seller.status
                // Rejected sellers receive a valid token here
```

There is no condition such as:
```typescript
if (seller.status !== 'Approved') {
  return res.status(403).json({ ... });
}
```
anywhere in the login flow.

### Impact
A seller who was explicitly rejected by an admin can still authenticate, obtain a JWT, and make authenticated API calls. Combined with S-05 and S-06, this means rejection has no practical enforcement.

---

## S-05 — Rejected Seller Is Redirected to Spin Wheel Then Dashboard

**Severity:** Critical
**Status:** Confirmed

### What happens
After logging in, a rejected seller bypasses all access guards and is silently redirected to the full seller interface — including the spin wheel and dashboard — because `SellerAccessGuard` has no handling for the `Rejected` status.

### Evidence

**`frontend/src/modules/seller/components/SellerAccessGuard.tsx`**
```typescript
// Lines 20-47 — complete guard logic:
if (status === "Pending") {
  return <Navigate to="/seller/verification-pending" />;   // ✓ handled
}
if (status === "Approved" && !depositPaid) {
  return <Navigate to="/seller/deposit-payment" />;        // ✓ handled
}
if (status === "Approved" && depositPaid) {
  return <>{children}</>;                                  // ✓ handled
}
return <>{children}</>;   // ← Rejected falls here → full dashboard access
```

**`frontend/src/App.tsx`**
```
Line 399:  <Route path="spin-wheel" element={<SellerSpinWheel />} />
Line 386:  <Route path="" element={<SellerDashboard />} />
// Both are inside SellerLayout, reached after SellerAccessGuard falls through
```

### Impact
The rejection decision is completely unenforced on the frontend. A rejected seller has the same UI access as an approved one.

---

## S-06 — Rejected Sellers Can Access All Protected Seller Routes Directly via URL

**Severity:** Critical
**Status:** Confirmed

### What happens
Since the backend issues valid JWTs to rejected sellers (S-04) and the frontend guard does not block them (S-05), a rejected seller can navigate directly to any seller URL and access it without restriction.

### Evidence

The full attack path:

1. **Login** — `verifyOTP()` in `sellerAuthController.ts` (line 140) issues a token with no status check.
2. **Auth check** — `ProtectedRoute` in `App.tsx` (line 375) only checks whether a token exists. It passes.
3. **Status check** — `SellerAccessGuard` (line 47) has no case for `Rejected` and returns `<>{children}</>`.
4. **Route rendered** — the requested page loads normally.

**Routes accessible by a rejected seller:**

| URL | Component |
|-----|-----------|
| `/seller` | SellerDashboard |
| `/seller/spin-wheel` | SellerSpinWheel |
| `/seller/orders` | SellerOrders |
| `/seller/product/list` | SellerProductList |
| `/seller/earnings` | SellerEarnings |
| All other seller routes | Fully accessible |

### Impact
Rejection has zero practical effect. A rejected seller retains full operational access to create products, view orders, and use the platform — the admin's decision is entirely bypassed.

---

## Root Cause Diagram

```
Seller rejected by admin
        │
        ├─ Backend: seller.status = "Rejected" stored in DB
        │
        ├─ [S-03] No rejection reason recorded
        │
        ├─ Seller opens app / retries login
        │       │
        │       └─ [S-04] verifyOTP() issues JWT — no status check
        │               │
        │               └─ Valid token received
        │                       │
        │                       ├─ [S-05] SellerAccessGuard: "Rejected" not handled
        │                       │        → falls through to children
        │                       │        → spin wheel renders, then dashboard
        │                       │
        │                       └─ [S-06] Direct URL access works too
        │                                (same guard bypass)
        │
        └─ Seller still on verification-pending page (different session)
                │
                └─ [S-02] Page only polls for "Approved"
                          → shows "Waiting" forever, never shows "Rejected"
```

---

## Recommended Fixes

### S-01 — Add mobile OTP verification to seller signup
- Add a two-step registration: (1) send OTP to mobile, (2) verify before proceeding to email step
- Or add a `mobileVerified: boolean` field and block login until both email and mobile are verified
- Add `mobileVerified` field to the Seller schema

### S-02 — Handle `Rejected` status in verification pending page and guard
- In `SellerAccessGuard.tsx`: add `if (status === "Rejected") return <Navigate to="/seller/rejected" />`
- Create a `SellerRejected` page that shows the rejection message (and reason once S-03 is fixed)
- In `SellerVerificationPending.tsx`: add polling/websocket handler for `Rejected` status

### S-03 — Require rejection reason from admin
- Add `rejectionReason: String` field to the Seller model
- Update `updateSellerStatus` controller to require `reason` when `status === 'Rejected'`
- Add a confirmation modal in `AdminManageSellerList.tsx` with a required textarea for the reason
- Surface the reason in the seller's rejection notification (S-02)

### S-04 — Block rejected (and pending) sellers from receiving a JWT
In `sellerAuthController.ts` — `verifyOTP()`, after fetching the seller, add:
```typescript
if (seller.status === 'Rejected') {
  return res.status(403).json({
    success: false,
    message: 'Your account has been rejected. Please contact support.',
  });
}
if (seller.status === 'Pending') {
  return res.status(403).json({
    success: false,
    message: 'Your account is pending admin approval.',
  });
}
```

### S-05 + S-06 — Block rejected sellers in SellerAccessGuard
In `SellerAccessGuard.tsx`, add an explicit case before the default return:
```typescript
if (status === "Rejected") {
  return <Navigate to="/seller/rejected" replace />;
}
```
This closes the frontend route bypass for rejected sellers.

---

*Report generated 2026-04-29 — all bugs confirmed via direct code inspection*
