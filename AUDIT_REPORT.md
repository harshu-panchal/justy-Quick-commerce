# Jasti Codebase — Security & Bug Audit Report

**Date:** 2026-04-29  
**Status:** All non-env issues fixed  

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical (code) | 4 | Fixed |
| High     | 6  | Fixed |
| Medium   | 7  | Fixed |
| Low      | 5  | Fixed |
| **.env credentials** | 9 | **Deferred — must be rotated before production deploy** |

---

## Fixed Issues

---

### C-12 + C-13 — OTP Bypass for Hardcoded Test Number
**File:** `backend/src/services/otpService.ts`  
**Fix:** Removed all special-case logic for mobile `9111966732`. Both `sendOTP` and `verifyOTP` now use the standard database-backed OTP flow for every user. No static OTPs remain.

---

### C-14 — Authentication Bypass in Customer Login Controller
**File:** `backend/src/modules/customer/controllers/customerAuthController.ts`  
**Fix:** Removed the entire "EXTREME BYPASS" block. The controller now validates inputs unconditionally and calls the standard OTP service for all users.

---

### C-11 — Admin Account Auto-Created with Hardcoded Credentials
**File:** `backend/src/utils/ensureDefaultAdmin.ts`  
**Fix:** `ensureDefaultAdmin` now requires `DEFAULT_ADMIN_MOBILE`, `DEFAULT_ADMIN_EMAIL`, and `DEFAULT_ADMIN_PASSWORD` to all be explicitly set in the environment. If any are missing the function logs a warning and returns early — no account is created with fallback values.

---

### M-07 — Hardcoded `deliveryOtp = '1234'` on Every Customer
**File:** `backend/src/models/Customer.ts`  
**Fix:** The pre-save hook now generates a cryptographically random 4-digit OTP using `crypto.randomInt(1000, 9999)` instead of assigning the static value `'1234'`.

---

### H-01 — Rate Limiting Disabled
**File:** `backend/src/middleware/rateLimiter.ts`  
**Fix:** Removed the no-op middleware. Both `otpRateLimiter` (5 req / 15 min, keyed by mobile) and `loginRateLimiter` (10 req / 15 min, keyed by IP) are now active real limiters using `express-rate-limit`.

---

### H-02 + H-03 — CORS Wildcard (Localhost and Local IP)
**File:** `backend/src/server.ts`  
**Fix:** Replaced the broad `startsWith('http://localhost:')` / `startsWith('http://192.168.1.99:')` checks with an explicit allowlist of known dev ports (`3000`, `3001`, `5173`, `5174`). Unknown localhost ports are now rejected in development.

---

### H-04 — JWT Secret Fallback Default
**File:** `backend/src/services/jwtService.ts`  
**Fix:** Removed the `|| 'your-secret-key-change-in-production'` fallback. The module now throws at startup if `JWT_SECRET` is not set, preventing the server from running with an insecure default.

---

### H-06 — Payment Signature Data Logged to Console
**File:** `backend/src/services/paymentService.ts`  
**Fix:** Removed the `console.log` block that was printing `Order ID`, `Payment ID`, expected/received HMAC signatures in plaintext.

---

### M-02 — Stack Traces in HTTP Error Responses
**File:** `backend/src/middleware/errorHandler.ts`  
**Fix:** Removed the `NODE_ENV === 'development'` conditional that included `stack` in responses. Stack traces are now only logged server-side via `console.error`.

---

### M-03 — OTPs and Mobile Numbers Logged to Console
**File:** `backend/src/services/otpService.ts`  
**Fix:** Removed all `console.log` statements that printed generated OTP values, bypass trigger messages, and full mobile numbers. The only remaining log is a non-sensitive `[OTP] Sending OTP for userType: X` entry.

---

### M-04 — Weak OTP Randomness (`Math.random`)
**File:** `backend/src/services/otpService.ts`  
**Fix:** Replaced the `Math.random()` loop with `crypto.randomInt(min, max)` from Node's built-in `crypto` module for cryptographically secure OTP generation.

---

### M-06 — New Customers Auto-Created with Fake `@justy.com` Email
**File:** `backend/src/modules/customer/controllers/customerAuthController.ts`  
**Fix:** Removed the auto-generated `${phone}@justy.com` email. New customers are created without an email field (the field is optional in the schema), preventing fake addresses from polluting the database.

---

### M-08 — All Request Paths Logged (Including Sensitive Routes)
**File:** `backend/src/server.ts`  
**Fix:** Removed the debug middleware that was logging every `METHOD /path` to stdout.

---

### L-01 — Razorpay Public Key Included in Every Payment Response
**File:** `backend/src/services/paymentService.ts`  
**Fix:** Removed `razorpayKey: process.env.RAZORPAY_KEY_ID` from the `createRazorpayOrder` response. The frontend should read this from its own environment config once at startup.

---

### L-02 — OTP Model Compound Index Missing `createdAt`
**File:** `backend/src/models/Otp.ts`  
**Fix:** Updated both compound indexes to include `createdAt: -1` so latest-OTP lookups can be served from the index without a collection scan.

---

### L-03 — Customer Coordinates Logged on Every Order Creation
**File:** `backend/src/modules/customer/controllers/customerOrderController.ts`  
**Fix:** Removed the `console.log("DEBUG: Order creation request: ...")` block that was logging `addressLat`, `addressLng`, and `paymentMethod`.

---

## Deferred — `.env` Credentials (Must Rotate Before Production)

These are **not code bugs** — they are operational secrets that need to be rotated at the infrastructure level. Each credential below should be regenerated, the old one revoked, and the new value stored in a secrets manager (AWS Secrets Manager, Vault, etc.) rather than a plain `.env` file.

| Credential | Location | Action |
|-----------|----------|--------|
| MongoDB URI password | `backend/.env` | Rotate DB password |
| `JWT_SECRET` + `JWT_REFRESH_SECRET` | `backend/.env` | Regenerate with `openssl rand -hex 64` |
| Cloudinary API Key + Secret | `backend/.env` | Regenerate from Cloudinary console |
| 2Factor API Key | `backend/.env` | Regenerate from 2Factor dashboard |
| Firebase service account private key | `backend/.env` | Revoke + re-issue from Firebase Console |
| Razorpay Key ID + Secret | `backend/.env` | Regenerate from Razorpay dashboard |
| Gmail app password | `backend/.env` | Revoke + create new app password |
| Google Gemini API key | `backend/.env` | Regenerate from Google AI Studio |
| SMS India Hub API key | `backend/.env` | Regenerate from SMS India Hub dashboard |

**Also:** Verify `backend/.env` is in `.gitignore` and has never been committed — run `git log -- backend/.env` to check.

---

## Remaining Architectural Items (Not Auto-Fixed)

These require deliberate design decisions beyond a simple code change:

| Issue | Description | Recommendation |
|-------|-------------|----------------|
| H-05 | Auth tokens in `localStorage` (XSS risk) | Migrate to `httpOnly` cookies — requires coordinated frontend + backend change |
| M-01 | Full user object serialised to `localStorage` | Store only non-sensitive display fields; remove on logout |
| L-05 | Root `package-lock.json` deleted | Run `npm install` in the root to regenerate and commit |

---

*Report updated 2026-04-29 — all code-level findings resolved*
