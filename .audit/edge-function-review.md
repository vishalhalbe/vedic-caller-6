# Edge Function Review — VedicCaller-6

## Function Inventory (21 total)

### Three Generations of Code

| Gen | Functions | Versions | Schema | Status |
|-----|-----------|----------|--------|--------|
| **Gen 0** (legacy) | rapid-action, hyper-worker, swift-responder, clever-endpoint, smart-api, clever-function | v2–v6 | **Old schema** (users.wallet_balance, payout_requests, astrologer_profiles, platform_config, onesignal_player_id) | **Dead code** — references tables that don't exist |
| **Gen 1** (current) | initiate-call, deduct-call-bill, process-payout, create-payment-order, razorpay-webhook, verify-payment, generate-agora-token, refund-call | v6–v12 | Current schema | Active, used by VedicCall app |
| **Gen 2** (improved) | verify-payment-v2, generate-agora-token-v2, razorpay-webhook-v2 | v2 | Current schema | Bugfix releases — fix HMAC crypto |
| **Astroveda** (separate) | astroveda-create-order, astroveda-agora-token | v1–v2 | Current schema + astroveda_bookings | Standalone booking flow |

### Shared Modules
- **`_shared/rate-limiting.ts`** — In-memory sliding-window rate limiter. Used by Gen 1 functions.
- **`_shared/audit-logging.ts`** — Fires audit logs to `audit_logs` table. Silent on failure.
- **`_shared/auth.ts`** — JWT verification via Supabase Auth API. Also accepts anon key.
- **`_shared/validation.ts`** — Field presence validation, UUID format check, email regex.
- **`_shared/hmac.ts`** — Web Crypto API HMAC-SHA256 (Deno-compatible).

## Critical Issues

### 1. 🔴 Gen 0 functions are dead code pointing to wrong schema
`hyper-worker` references `astrologer_profiles.per_minute_rate`, `users.wallet_balance`, and `users.onesignal_player_id` — none exist. `swift-responder` uses `payout_requests` (doesn't exist). `clever-function` writes to `users.wallet_balance` (table has no such column). `rapid-action` is a raw Razorpay proxy with no DB write.

These 6 functions will 500 on any call. Should be **deleted**.

### 2. 🔴 `razorpay-webhook-v2` uses Node `import('crypto')` — will crash
Line 30: `const crypto = await import('crypto');` — Won't work in Deno. v1 correctly uses `_shared/hmac.ts`. The v2 "improved" version actually regressed here.

### 3. 🔴 `verify-payment` (v1) verifies but never credits the wallet
Only updates `payments.status = 'completed'`. Does NOT add funds to wallet. Users would pay but never get their wallet recharged. The v2 version (`verify-payment-v2`) fixes this with `creditWallet()`.

### 4. 🔴 `generate-agora-token` uses custom HMAC token format — won't work with Agora SDK
The token format is `appId:channelName:uid:nonce:version:expireTime:role:signature`. Agora SDK expects specific binary serialization (access token format with message integrity code). This custom HMAC string will be rejected by the Agora Web/Android/iOS SDK.

### 5. 🔴 In-memory rate limiting is ineffective in serverless
`_shared/rate-limiting.ts` uses `Map<string, number[]>` — stored in process memory. Edge function cold starts and multiple concurrent instances mean rate limits reset on each invocation. **All Gen 1 functions** rely on this.

### 6. 🟡 `create-payment-order` stores wrong ID in `gateway_payment_id`
Stores internal `order_${timestamp}_${random}` (line 48). Should store the actual Razorpay order ID. `verify-payment-v2` then tries to look up `payments?gateway_payment_id=eq.${razorpayOrderId}` which won't match.

### 7. 🟡 `deduct-call-bill` joins through `astrologer_call_id` not `astrologer_id`
Uses FK `calls_astrologer_call_id_fkey` instead of the astrologer relationship. There's a separate `astrologer_call_id` column on calls — functions should consistently use `astrologer_id`.

### 8. 🟡 `process-payout` hardcodes 20% commission
`commission_settings` table has `commission_rate = 0.20` but no function reads it. The function also doesn't check `min_withdrawal` from `commission_settings` (hardcodes ₹500).

## Medium Issues

### 9. `razorpay-webhook` doesn't validate user from notes
No verification that `payment.notes?.user_id` matches an actual user or that the payment was authorized by that user. Any Razorpay webhook event could credit any wallet.

### 10. No request timeout or retry limits
Fetch calls to external services (Razorpay API, Agora, Supabase) have no timeout. Under load, hanging requests could accumulate.

### 11. Inconsistent wallet credit flow
Wallet can be credited from three paths:
- `verify-payment-v2` (direct API call from client)
- `razorpay-webhook` / `razorpay-webhook-v2` (server-side webhook)
- `clever-function` (old Gen 0, writes to wrong table)
Risk of double-crediting if both client and webhook process the same payment.

### 12. `astroveda` functions use anon key instead of service_role
Use `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)` with user's auth header. Relies on RLS. Inconsistent with Gen 1/2 functions that use service_role key directly.

## Minor Issues

- **No request ID tracking** on some Gen 0 functions
- **Error format inconsistency**: some return `{error}`, others `{success: false, error}`
- **No CORS validation** — all functions allow any origin
- **All Gen 1 functions duplicate CORS boilerplate** — could be refactored into `_shared/cors.ts`
- **`validateUUID` is defined but never used** in `_shared/validation.ts`
- **`validateEmail` is defined but never used**

## Functional Gaps

| Missing Feature | Required For | Priority |
|----------------|--------------|----------|
| ✅ Admin payout approval | Clever-endpoint does this (dead code) | HIGH |
| ✅ Push notifications | Smart-api does this (dead code) | HIGH |
| ❌ Astrologer online/offline toggle | `is_online` management | HIGH |
| ❌ Rating/review creation | `reviews` table has no write function | MEDIUM |
| ❌ Astrologer search/filter | search_vector unused by any function | MEDIUM |
| ❌ Favorites CRUD | `favorites` table exists now | MEDIUM |
| ❌ Schedule management | `availability_slots` table exists now | MEDIUM |
| ❌ Call message send/receive | `call_messages` table exists now | MEDIUM |
| ❌ KYC verification | astrologers.kyc_status exists, no fn to update | MEDIUM |
| ❌ Wallet create-on-first-use | Only `verify-payment-v2.creditWallet` does this | LOW |

## Recommendations

1. **Delete 6 Gen 0 functions** (rapid-action, hyper-worker, swift-responder, clever-endpoint, smart-api, clever-function)
2. **Fix v2 HMAC** in `razorpay-webhook-v2` (use `_shared/hmac.ts` like v1 does)
3. **Fix `create-payment-order`** to store real Razorpay order ID
4. **Use proper Agora token SDK** in `generate-agora-token`
5. **Read `commission_settings`** in `process-payout` instead of hardcoding
6. **Add client-side dedup** to prevent double wallet credit from webhook + verify flow
7. **Build missing functions**: admin payout approval, push notifications, astrologer status, favorites CRUD, schedule management
