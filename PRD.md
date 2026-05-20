# VedicCaller 6 — Product Requirements Document

> **Status:** Draft · **Last Updated:** 2026-05-20  
> **Project:** vedic-caller-6 (Expo + Supabase + Agora + Razorpay)  
> **Personas:** User · Astrologer · Admin

---

## 1. Product Overview

### Vision
Connect seekers with trusted Vedic astrologers via seamless voice calls — accessible on web and mobile from one codebase.

### Target Audience
- **Users:** Indian adults (18-60) seeking astrological guidance for life decisions
- **Astrologers:** Professional Vedic astrologers seeking digital presence and clients
- **Admins:** Platform operators managing verification, payouts, and growth

### North Star Metric
**Calls Completed Per Day** — not signups, not page views. Every other metric feeds this.

### Success Criteria
| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to book a call | <30s | Analytics funnel |
| Call connection time | <3s from tap | Agora SDK timing |
| Avg user rating for astrologers | ≥4.0 | Post-call ratings |
| Astrologer payout time | <48h | Withdrawal processing |
| User retention (30-day) | >30% | Cohort analysis |
| Platform commission revenue | >20% margin | Wallet transactions |

---

## 2. Personas & User Stories

### 2.1 User (Seeker)

| ID | Story | Priority | Verification Criteria |
|----|-------|----------|----------------------|
| U-01 | Browse astrologers by specialization (Vedic, Numerology, Palmistry, Tarot, Vastu) | P0 | Filters render ≤2s, results paginated 10/page |
| U-02 | View astrologer profile with ratings, reviews, experience, ₹/min rate | P0 | Profile loads ≤2s, all sections scrollable |
| U-03 | Book a call with date/time slot selection and wallet payment | P0 | Booking confirmed ≤5s from tap, slot locked |
| U-04 | Join voice call via Agora with mute/unmute, speaker toggle | P0 | Connected ≤3s, controls responsive |
| U-05 | Text chat with astrologer during the call (in-call overlay) | P0 | Messages delivered in real-time, persisted post-call |
| U-06 | Rate and review astrologer post-call (stars + optional text + tags) | P0 | Visible on astrologer profile within 5s |
| U-07 | Add money to wallet via Razorpay (UPI, cards, netbanking) | P0 | Balance updates ≤10s post-payment |
| U-08 | View call history (upcoming, completed, cancelled) | P0 | List renders ≤2s, statuses accurate |
| U-09 | Reschedule or cancel a booked call | P1 | Rebooked slot auto-frees old one |
| U-10 | Report an astrologer for inappropriate behavior | P1 | Creates support ticket visible to admin |

### 2.2 Astrologer

| ID | Story | Priority | Verification Criteria |
|----|-------|----------|----------------------|
| A-01 | Set weekly availability (day on/off, time slots per day) | P0 | Saves ≤2s, duplicate detection works |
| A-02 | View upcoming calls with user info and countdown | P0 | List renders ≤2s |
| A-03 | Join voice calls (same Agora flow as user) | P0 | Connected ≤3s |
| A-04 | View earnings dashboard (total, pending, withdrawn, chart) | P0 | Numbers accurate, chart loads ≤3s |
| A-05 | Request withdrawal of earnings (amount, UPI ID) | P0 | Creates pending withdrawal, admin notified |
| A-06 | Edit profile (bio, specialization tags, rate/min, experience) | P0 | Saves ≤2s |
| A-07 | Receive push notification for new bookings | P1 | Notification arrives ≤10s of booking |

### 2.3 Admin

| ID | Story | Priority | Verification Criteria |
|----|-------|----------|----------------------|
| AD-01 | Verify/reject astrologers with document review | P0 | Action reflected immediately, user notified |
| AD-02 | View revenue and call analytics (charts + stats cards) | P0 | Charts load ≤3s with 6 months data |
| AD-03 | Manage all users and astrologers (search, view, suspend) | P0 | Search ≤2s, suspend prevents login |
| AD-04 | Set global and per-astrologer commission override | P0 | Takes effect immediately on new calls |
| AD-05 | Approve/reject withdrawal requests with Razorpay payout | P0 | Payout processed or rejected with notification |
| AD-06 | View audit log of all admin actions | P1 | Log renders ≤2s, filterable by admin |

---

## 3. MoSCoW Priorities

### Must Have (P0 — MVP)
| # | Feature | Persona |
|---|---------|---------|
| 1 | Phone OTP auth + role selection | All |
| 2 | Profile creation (user + astrologer) | All |
| 3 | Browse + filter astrologers | User |
| 4 | Astrologer profile page | User |
| 5 | Slot-based booking with wallet payment | User |
| 6 | Agora voice call (1:1) | User, Astrologer |
| 7 | In-call text chat (Supabase Realtime) | User, Astrologer |
| 8 | Post-call rating & review | User |
| 9 | Wallet top-up via Razorpay | User |
| 10 | Call history | User, Astrologer |
| 11 | Availability management | Astrologer |
| 12 | Earnings dashboard | Astrologer |
| 13 | Withdrawal request | Astrologer |
| 14 | Astrologer verification | Admin |
| 15 | User/astrologer management | Admin |
| 16 | Commission settings | Admin |
| 17 | Withdrawal approval with Razorpay payout | Admin |
| 18 | Analytics dashboard (revenue, calls) | Admin |

### Should Have (P1 — v1.1)
| # | Feature | Persona |
|---|---------|---------|
| 1 | Reschedule/cancel booking | User |
| 2 | Report astrologer | User |
| 3 | Push notifications for bookings | All |
| 4 | Admin audit log | Admin |
| 5 | Hindi + English i18n | All |
| 6 | Dark mode (Sattva Ether Dark) | All |

### Could Have (P2 — v2)
| # | Feature | Persona |
|---|---------|---------|
| 1 | Call recording (opt-in, privacy-compliant) | Admin |
| 2 | Astrologer discovery algorithm (ML-based) | User |
| 3 | In-app Kundli generation | User |
| 4 | Voice note in chat | User, Astrologer |
| 5 | CSV/PDF export of reports | Admin |

### Won't Have (v1)
| Feature | Reason |
|---------|--------|
| Video calls | Audio-only MVP, video adds complexity |
| Group calls | Not in scope for 1:1 consultation model |
| Live streaming | Different product |
| Multi-language beyond Hindi+English | v2 scope |

---

## 4. Technical Architecture

### Stack Diagram
```
┌─────────────────────────────────────────────────────┐
│                   Expo SDK 54                       │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Expo Web │  │ Expo iOS │  │   Expo Android    │  │
│  │ (react-  │  │ (native) │  │     (native)      │  │
│  │ native-  │  │          │  │                   │  │
│  │ web)     │  │          │  │                   │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       └──────────────┴────────────────┘              │
│                      │                               │
│              Expo Router (file-based)                │
│         AuthContext · React Query · Zustand          │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
    ┌──────────────────┼──────────────────┐
    │                  │                  │
┌───▼───┐    ┌────────▼──────┐   ┌──────▼──────┐
│Supabase│    │Supabase Edge  │   │   Agora     │
│Postgres│    │  Functions    │   │   RTC SDK   │
│ Auth   │    │               │   │ Voice Calls │
│Realtime│    │• agora-token  │   └─────────────┘
│ Storage│    │• payment-order│
└───┬───┘    │• verify-pay   │
    │        │• webhook      │
    │        │• process-pay  │
    │        └───────┬───────┘
    │                │
    │         ┌──────▼───────┐
    │         │   Razorpay   │
    │         │  Payments +  │
    │         │   Payouts    │
    │         └──────────────┘
    │
    │ Web: Vercel · Mobile: EAS Build
    │ CI: GitHub Actions · Monitoring: Sentry
```

### MCP Servers (opencode.json entry)
| Server | Type | Purpose |
|--------|------|---------|
| Supabase | Remote (HTTP) | Database, Auth, Realtime, Edge Functions |
| Playwright | Local (npx) | E2E browser testing |
| Razorpay | Local (npx) | Payment orders, payouts, webhooks |
| Tavily | Local (npx) | Web search (research, content) |
| Chrome DevTools | Local (npx) | Browser debugging, DevTools inspection |
| Stitch | Local (npx) | UI mockup generation from prompts |

### Platform Abstraction Strategy
Features that differ between web and native get an abstraction layer from day 1:

| Feature | Web | Native (iOS/Android) | Abstraction |
|---------|-----|----------------------|-------------|
| Voice calls | Agora Web SDK (WebRTC) | `react-native-agora` | `useAgora.ts` — platform-conditional import |
| Push notifications | Service Workers + FCM Web | `expo-notifications` (FCM/APNs) | `useNotifications.ts` — token registration + dispatch |
| Safe area layout | No-op wrapper | `SafeAreaView` / `useSafeAreaInsets` | Conditional export in `_layout.tsx` |
| File/image picker | `expo-image-picker` web fallback | `expo-image-picker` native | Unified API (Expo handles this) |
| Gestures | Mouse/click events | `react-native-gesture-handler` swipe | Wrap in `Platform.OS === 'web'` branches |
| Deep linking | Browser URL | `expo-linking` custom scheme | expo-router handles universal links |
| App install prompt | PWA `beforeinstallprompt` | Store download | Utility hook returning best CTA per platform |

**Rule**: All platform branching lives in `src/platform/` hooks. Screens never check `Platform.OS` directly.

### State Management Strategy
| Layer | Tool | Covers |
|-------|------|--------|
| Server state | **React Query** | API data: astrologers, calls, earnings, transactions |
| Client state | **Zustand** | UI state: filters, modals, selected slots |
| Auth state | **React Context** | User session, profile, role |
| Real-time | **Supabase Realtime** | Chat messages, call status changes |

---

## 5. Data Model

### Core Tables

```
profiles
  id              UUID (PK, FK → auth.users)
  role            ENUM('user', 'astrologer', 'admin')
  name            TEXT
  phone           TEXT (unique)
  email           TEXT
  avatar_url      TEXT
  created_at      TIMESTAMPTZ

astrologers
  id              UUID (PK, FK → profiles)
  specialization  TEXT[]  — ['Vedic', 'Numerology', ...]
  exp_years       INT2
  rate_per_min    INT4    — stored in paise
  bio             TEXT
  rating_avg      FLOAT4  — computed via trigger
  review_count    INT4    — computed via trigger
  is_verified     BOOLEAN default false
  upi_id          TEXT
  created_at      TIMESTAMPTZ

wallets
  id              UUID (PK)
  profile_id      UUID (FK, unique)
  balance         INT8    — stored in paise, default 0
  updated_at      TIMESTAMPTZ

wallet_transactions
  id              UUID (PK)
  wallet_id       UUID (FK)
  type            ENUM('credit', 'debit', 'refund')
  amount          INT8    — in paise
  status          ENUM('pending', 'completed', 'failed')
  razorpay_ref    TEXT    — order_id / payment_id
  description     TEXT
  created_at      TIMESTAMPTZ

availability_slots
  id              UUID (PK)
  astrologer_id   UUID (FK)
  day_of_week     INT2    — 0=Sun, 1=Mon, ..., 6=Sat
  start_time      TIME
  end_time        TIME
  is_booked       BOOLEAN default false
  UNIQUE(astrologer_id, day_of_week, start_time)

calls
  id              UUID (PK)
  user_id         UUID (FK)
  astrologer_id   UUID (FK)
  status          ENUM('scheduled','active','completed','cancelled','no_show')
  scheduled_at    TIMESTAMPTZ
  started_at      TIMESTAMPTZ
  ended_at        TIMESTAMPTZ
  duration_secs   INT4
  cost            INT8    — in paise, final billed amount
  rating          INT2    — 1-5
  review_text     TEXT
  review_tags     TEXT[]
  created_at      TIMESTAMPTZ

chat_messages
  id              UUID (PK)
  call_id         UUID (FK)
  sender_id       UUID (FK)
  content         TEXT
  created_at      TIMESTAMPTZ

withdrawals
  id              UUID (PK)
  astrologer_id   UUID (FK)
  amount          INT8    — in paise
  status          ENUM('pending','approved','rejected','failed')
  utr             TEXT    — Razorpay payout UTR
  admin_id        UUID (FK) — who processed
  reason          TEXT    — rejection reason
  created_at      TIMESTAMPTZ
  processed_at    TIMESTAMPTZ

admin_audit_logs
  id              UUID (PK)
  admin_id        UUID (FK)
  action          TEXT    — 'verify_astrologer', 'approve_withdrawal', etc.
  target_type     TEXT    — 'astrologer', 'user', 'withdrawal'
  target_id       UUID
  details         JSONB
  created_at      TIMESTAMPTZ

commissions
  id              UUID (PK)
  astrologer_id   UUID (FK, nullable — NULL = global default)
  rate_percent    INT2    — e.g. 20 = 20%
  created_at      TIMESTAMPTZ
  UNIQUE(astrologer_id) — one override per astro, one global row
```

### RLS Policies (Mandatory)
| Table | Policy | Rule |
|-------|--------|------|
| profiles | Read own | `auth.uid() = id` |
| | Admin read all | `auth.role() = 'admin'` |
| astrologers | Public read verified | `is_verified = true` |
| | Astrologer write own | `auth.uid() = profile_id` |
| wallets | Read own | `auth.uid() = profile_id` |
| | Mutate via Edge Functions only | `false` on direct insert/update |
| wallet_transactions | Read own | `auth.uid()` matches wallet owner |
| availability_slots | Public read unbooked | `is_booked = false` |
| | Astrologer CRUD own | `auth.uid() = astrologer_id` |
| calls | Read own (user or astro) | `auth.uid() IN (user_id, astrologer_id)` |
| chat_messages | Read own call participants | Call participant check |
| | Insert own | `auth.uid() = sender_id` |
| withdrawals | Astrologer read own | `auth.uid() = astrologer_id` |
| | Admin write all | `auth.role() = 'admin'` |
| admin_audit_logs | Admin read/write | `auth.role() = 'admin'` |
| commissions | Admin CRUD | `auth.role() = 'admin'` |

---

## 6. Screen Flows

### 6.1 Navigation Map

```
[App Launch]
    │
    ├─ Has session? → Refresh → Role check
    │   ├─ user → (user)/index (Dashboard)
    │   ├─ astrologer → (astrologer)/index (Dashboard)
    │   └─ admin → (admin)/index (Dashboard)
    │
    └─ No session → (auth)/login
        ├─ Phone input → verify-otp
        │   └─ New user → role-select
        │       ├─ user → user onboarding → (user)/
        │       └─ astrologer → astro onboarding → (astrologer)/
        └─ Existing user → dashboard
```

### 6.2 User Tab Flow
```
(user)/_layout.tsx — Bottom Tabs: Home | Browse | Calls | Wallet | Profile

home:  index.tsx — greeting, wallet banner, recommended astros, recent calls
browse:browse.tsx — search bar, filter chips, sort, paginated card list
       astrologer/[id].tsx — profile, slots, reviews → book/[astrologerId]
book:  book/[id].tsx — date picker → time slots → confirm → pay
calls: calls/index.tsx — upcoming/completed/cancelled tabs
       calls/[id].tsx — active call (Agora + chat overlay) + post-call rating
wallet:wallet/index.tsx — balance, transactions list
       wallet/add-money.tsx — amount chips, Razorpay checkout
profile:profile.tsx — avatar, name, phone, email
```

### 6.3 Astrologer Tab Flow
```
(astrologer)/_layout.tsx — Bottom Tabs: Dashboard | Calls | Earnings | Profile

home:     index.tsx — availability toggle, today's schedule, stats
          availability.tsx — weekly editor, presets, add/delete slots
calls:    calls/index.tsx — upcoming/completed/missed tabs
          calls/[id].tsx — active call (Agora + chat)
earnings: earnings.tsx — summary cards, chart, call breakdown
          withdraw.tsx — amount input, UPI, request
profile:  profile.tsx — avatar, bio, tags, rate/min, experience
```

### 6.4 Admin Tab Flow
```
(admin)/_layout.tsx — Sidebar: Dashboard | Users | Astrologers | Commissions | Withdrawals | Calls

home:         index.tsx — stats cards, revenue chart, calls chart, activity feed
users:        users.tsx — data table with search/filter/sort
              users/[id].tsx — profile, call history, wallet, suspend
astrologers:  astrologers.tsx — data table with verify/reject inline
              astrologers/[id].tsx — profile, docs, performance, commission override
commissions:  commissions.tsx — global slider, per-astro overrides list
withdrawals:  withdrawals.tsx — pending/approved/rejected tabs, approve/reject with modal
calls:        calls.tsx — data table with date range filter, status filter
```

---

## 7. Edge Cases (34 Total)

### Auth (8)
| # | Edge Case | Handling |
|---|-----------|----------|
| EC-01 | OTP rate limit (3rd attempt) | Block 5 min with visible timer |
| EC-02 | Session expires mid-call | Auto-refresh token; on failure, call continues (Agora independent), chat stops |
| EC-03 | User is banned/suspended | "Account suspended. Contact support." with email link. Login blocked. |
| EC-04 | Multiple devices, same account | Latest token invalidates old ones. Push notification to stale device. |
| EC-05 | User closes OTP screen mid-flow | Session token exists but unverified — prompt "Continue verification?" |
| EC-06 | Re-register same phone | Find existing profile, skip onboarding |
| EC-07 | Network drops mid-OTP | Retry toast with exponential backoff |
| EC-08 | Invalid phone format | Inline validation: 10 digits + optional +91 prefix |

### Booking & Calls (11)
| # | Edge Case | Handling |
|---|-----------|----------|
| EC-09 | Insufficient wallet for estimate | Block: "Add at least ₹X to continue" + deep link to top-up |
| EC-10 | Astrologer deletes account mid-booking | Auto-cancel pending bookings, full refund, notify user |
| EC-11 | Overlapping booking (same user) | Prevent: "You already have a call at this time" |
| EC-12 | Overlapping booking (same astrologer slot) | DB UNIQUE + app-level check — second booking rejected |
| EC-13 | User joins, astrologer doesn't (no-show) | 5 min wait → auto-cancel → full refund to user, ₹0 to astrologer |
| EC-14 | Call ends before minimum billing (1 min) | Minimum 1 min charged (industry standard) |
| EC-15 | Wallet goes negative during call | Warn at 50% remaining; force-end at ₹0, partial bill up to that point |
| EC-16 | Call disconnected mid-way | 3 reconnection attempts (15s each). If fail → bill only for connected seconds |
| EC-17 | Server time ≠ user timezone | All times stored UTC, displayed in detected timezone |
| EC-18 | Booking within 5 min of now | Block — minimum 15 min advance booking |
| EC-19 | User rates 1-2 stars | Trigger feedback: "What went wrong?" + offer refund option |

### Payments (7)
| # | Edge Case | Handling |
|---|-----------|----------|
| EC-20 | Razorpay webhook delayed | Idempotency via `razorpay_order_id` — won't double-credit |
| EC-21 | Payment captured but call not created | Reconciliation job: unmatched payments → admin alert + manual credit |
| EC-22 | Payout API down | "Payout unavailable. Retry or mark manual." Option for admin. |
| EC-23 | Invalid UPI for payout | Status → failed, admin notified, astrologer prompted to update |
| EC-24 | Duplicate withdrawal request | Check pending requests — block if one already pending |
| EC-25 | Minimum withdrawal not met | Button disabled: "Minimum withdrawal is ₹500" |
| EC-26 | INR display formatting | Indian notation: ₹1,12,500 (not ₹112,500) |

### Real-time (4)
| # | Edge Case | Handling |
|---|-----------|----------|
| EC-27 | Agora token expires mid-call | Auto-renew via edge function at 5 min before expiry |
| EC-28 | Chat message fails to send | Retry once; on failure "Not delivered" indicator |
| EC-29 | Both parties send simultaneously | Supabase Realtime handles at DB level via standard row insert |
| EC-30 | Chat persists post-call | Yes — chat history stays accessible in call detail |

### Admin (4)
| # | Edge Case | Handling |
|---|-----------|----------|
| EC-31 | Admin rejects verified astrologer with bookings | Auto-cancel future bookings, full refunds, notify users |
| EC-32 | Delete user | Soft delete + anonymize (PII removed, FK references preserved) |
| EC-33 | Audit log forged | Server-side timestamps only, row immutable (INSERT-only, no UPDATE) |
| EC-34 | Commission override vs global | Per-astro override takes precedence; NULL override uses global |

---

## 8. Design System — Sattva Ether

### Philosophy
Rooted in the three **Gunas** and five **Panchabhoota** elements.

| Guna | Role | Colors | Application |
|------|------|--------|-------------|
| Sattva (pure, luminous) | Primary | Gold, Cream, White | Headings, CTAs |
| Rajas (vibrant, active) | Secondary | Amber, Saffron | Accents, badges |
| Tamas (deep, grounding) | Structural | Charcoal, Warm Brown | Text, backgrounds |

### Color Tokens
```css
--color-gold-500:  #D4AF37;   /* PRIMARY brand */
--color-bg:        #FAF9F6;   /* cream - page background */
--color-bg-card:   #FFFFFF;
--color-text-primary:   #1A1006;  /* warm near-black */
--color-text-secondary: #5C4A32;  /* warm brown */
--color-text-muted:     #8B7E6A;
--color-mystic:  #6B46C1;  /* violet - premium/mystical accent */
--color-saffron: #E8860C;  /* rajas accent */
--color-success: #2D6A4F;
--color-error:   #9B1C1C;
--color-online:  #34A853;
```

### Typography
| Level | Font | Weight | Size |
|-------|------|--------|------|
| Display | Playfair Display | 700 | 32px |
| H1 | Playfair Display | 700 | 28px |
| H2 | Playfair Display | 700 | 22px |
| Body | Manrope | 400 | 15px |
| Label | Manrope | 600 | 12px |

### Spacing
Base 4px. Key: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

### Shadow
```css
--shadow-sm: 0 1px 3px rgba(26, 16, 6, 0.06);
--shadow-md: 0 4px 12px rgba(26, 16, 6, 0.08);
--shadow-lg: 0 8px 30px rgba(26, 16, 6, 0.12);
--shadow-gold: 0 4px 20px rgba(212, 175, 55, 0.25);
```

### Stitch Integration
1. `create_design_system` with Sattva Ether tokens (Stitch project ID: 2787312298814313541)
2. `generate_screen_from_text` per screen before coding
3. `apply_design_system` to ensure theme consistency

---

## 9. Security & Compliance

| Requirement | Implementation |
|-------------|----------------|
| Auth | Phone OTP via Supabase Auth. Email as secondary option. |
| Authorization | RLS on every table. `app_metadata` for roles (never `user_metadata`). |
| Webhook safety | Razorpay webhook signature verified via HMAC-SHA256 on every event. |
| Token safety | Agora tokens: 15 min expiry, rate-limited to 5/user/min. |
| Wallet safety | All mutations via Edge Functions only. RLS denies direct client inserts/updates. |
| Rate limiting | Edge Functions: 10 req/min/user. Auth OTP: 3 attempts/5min. |
| Audit | `admin_audit_logs` table: INSERT-only, immutable timestamps. |
| PII | Phone numbers never logged. Edge Functions log user_id not phone. |
| Data at rest | Supabase default encryption. |
| Session | Token refresh on expiry. Active call persists during refresh. |

---

## 10. Testing Strategy

### Test Types
| Type | Tool | Scope |
|------|------|-------|
| E2E (web) | Playwright MCP | Auth, browse, book, call, wallet flows |
| Test cases | TestDino MCP | Manual test case management, audit reports |
| Accessibility | axe-core via Playwright | WCAG AA compliance |
| Visual | Playwright screenshot diff | UI regression detection |

### E2E Test Scenarios
| ID | Scenario | Persona | Covers Edge Cases |
|----|----------|---------|-------------------|
| E2E-01 | User registers via phone OTP + selects role | User | EC-05, EC-06, EC-07, EC-08 |
| E2E-02 | Astrologer completes onboarding + sets availability | Astrologer | — |
| E2E-03 | User browses astrologers, filters by specialization | User | — |
| E2E-04 | User books call with wallet payment | User | EC-09, EC-11, EC-12 |
| E2E-05 | User joins call, uses mute/speaker/chat, ends call | User, Astrologer | EC-15, EC-16, EC-27 |
| E2E-06 | User rates astrologer after call | User | EC-19 |
| E2E-07 | User adds money to wallet via Razorpay | User | EC-20, EC-21 |
| E2E-08 | Astrologer views earnings + requests withdrawal | Astrologer | EC-24, EC-25 |
| E2E-09 | Admin verifies astrologer, approves withdrawal | Admin | EC-31, EC-33 |
| E2E-10 | Admin views analytics dashboard | Admin | — |
| E2E-11 | Concurrent booking attempt on same slot | User | EC-12 (race condition) |
| E2E-12 | OTP rate limit exceeded | User | EC-01 |

---

## 11. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Cold start (web) | ≤3s on 4G |
| App bundle size (web) | ≤200KB initial JS |
| App bundle size (mobile) | ≤40MB (APK) |
| Call connection time | ≤3s p95 |
| Edge Function response | ≤2s p95 |
| Page load (data) | ≤2s p95 |
| Uptime | 99.5% |
| Concurrent calls | 100 simultaneous |
| Supported browsers | Chrome, Firefox, Safari, Edge (last 2 major) |
| Supported devices | iOS 15+, Android 8+, web responsive down to 360px |

---

## 12. Rollout Plan

### Platform Strategy
**Web-first on Vercel → Mobile stores in weeks 4-6.** Same Expo codebase deploys to all three targets — no code conversion needed.

| Factor | Web (Vercel) | Mobile (Play Store) | Mobile (App Store) |
|--------|-------------|---------------------|--------------------|
| Time to live | Week 1 | Week 4-5 | Week 6 |
| Distribution | Shareable links (WA, SMS) | Store search | Store search |
| Revenue validation | Immediate | Delayed 3-4 weeks | Delayed 4-5 weeks |
| Push notifications | Service Workers | FCM | APNs |
| Voice calls | Agora Web SDK (WebRTC) | react-native-agora | react-native-agora |

### Phase Timeline
```
Phase 0 — Discovery          DONE     (pull existing schema, audit)
Phase 1 — Foundation         DONE     (Expo scaffolded, MCPs, design tokens)
Phase 2 — Schema + RLS       DONE     (7 migration tables pushed)
Phase 3 — Auth               Days 1-2  (OTP, roles, onboarding)
Phase 4 — Edge Functions     DONE     (15 active, 6 new, 5 critical bugs fixed)
Phase 5 — User Module        Days 2-6  (10 screens — web-first, responsive)
Phase 6 — Astrologer Module  Days 2-6  (7 screens, parallel with Phase 5)
Phase 7 — Admin Panel        Days 5-8  (9 screens — web-native anyway)
Phase 8 — Voice + Chat       Days 6-10 (Agora Web SDK, Realtime chat)
Phase 9 — Web Polish + Test  Days 8-12 (Playwright E2E, edge cases)
Phase 10 — Mobile Release    Days 12-16 (EAS Build → Play Store → App Store)
```

### Phase Dependencies
```
Phase 0 → Phase 1 → Phase 2 ────────────→ Phase 3 → Phase 5 ──┐
                            └─→ Phase 4 ──→ Phase 8 ←──────────┴──→ Phase 9 → Phase 10
                            └─→ Phase 7 (parallel after Phase 2)
```

---

## 13. Glossary

| Term | Definition |
|------|------------|
| Wallet | In-app balance stored in paise integers (1 INR = 100 paise) |
| Escrow | Amount held during active call, released post-call |
| UTR | Unique Transaction Reference — Razorpay payout identifier |
| RLS | Row-Level Security (Postgres/Supabase) |
| Guna | Sattva / Rajas / Tamas — design philosophy from Sankhya |
| Sattva Ether | Brand name for the golden light design system |
| Agora Channel | Virtual room for a voice call, identified by `call-{callId}` |
| Edge Function | Supabase serverless function (Deno/TypeScript) |

---

## 14. Tracker

### Phase Status
| Phase | Status | Started | Completed | Blockers |
|-------|--------|---------|-----------|----------|
| 0 — Discovery | ✅ Done | Day 0 | Day 0 | — |
| 1 — Foundation | ✅ Done | Day 0 | Day 1 | — |
| 2 — Schema + RLS | ✅ Done | Day 0 | Day 1 | — |
| 3 — Auth | 🔴 Pending | — | — | — |
| 4 — Edge Functions | ✅ Done | Day 0 | Day 1 | — |
| 5 — User Module | 🔴 Pending | — | — | — |
| 6 — Astrologer Module | 🔴 Pending | — | — | — |
| 7 — Admin Panel | 🔴 Pending | — | — | — |
| 8 — Voice + Chat | 🔴 Pending | — | — | — |
| 9 — Web Polish + Test | 🔴 Pending | — | — | — |
| 10 — Mobile Release | 🔴 Pending | — | — | — |

### Feature Status
| ID | Feature | Prio | Status | E2E | RLS | Contrast | PR Merged |
|----|---------|------|--------|-----|-----|----------|-----------|
| U-01 | Browse astrologers | P0 | 🔴 | — | — | — | — |
| U-02 | Astrologer profile | P0 | 🔴 | — | — | — | — |
| U-03 | Book call with payment | P0 | 🔴 | — | — | — | — |
| U-04 | Voice call (Agora) | P0 | 🔴 | — | — | — | — |
| U-05 | In-call chat | P0 | 🔴 | — | — | — | — |
| U-06 | Rate & review | P0 | 🔴 | — | — | — | — |
| U-07 | Wallet top-up | P0 | 🔴 | — | — | — | — |
| U-08 | Call history | P0 | 🔴 | — | — | — | — |
| U-09 | Reschedule/cancel | P1 | 🔴 | — | — | — | — |
| U-10 | Report astrologer | P1 | 🔴 | — | — | — | — |
| A-01 | Set availability | P0 | 🔴 | — | — | — | — |
| A-02 | View upcoming calls | P0 | 🔴 | — | — | — | — |
| A-03 | Join voice calls | P0 | 🔴 | — | — | — | — |
| A-04 | Earnings dashboard | P0 | 🔴 | — | — | — | — |
| A-05 | Request withdrawal | P0 | 🔴 | — | — | — | — |
| A-06 | Edit profile | P0 | 🔴 | — | — | — | — |
| A-07 | Push notifications | P1 | 🔴 | — | — | — | — |
| AD-01 | Verify astrologers | P0 | 🔴 | — | — | — | — |
| AD-02 | Analytics dashboard | P0 | 🔴 | — | — | — | — |
| AD-03 | User management | P0 | 🔴 | — | — | — | — |
| AD-04 | Commission settings | P0 | 🔴 | — | — | — | — |
| AD-05 | Withdrawal approval | P0 | 🔴 | — | — | — | — |
| AD-06 | Admin audit log | P1 | 🔴 | — | — | — | — |

### Edge Case Status
| # | Edge Case | Severity | Status | Notes |
|---|-----------|----------|--------|-------|
| EC-01 | OTP rate limit | Medium | 🔴 | — |
| EC-02 | Session expires mid-call | High | 🔴 | Needs token refresh logic |
| EC-03 | User banned/suspended | High | 🔴 | — |
| EC-04 | Multiple devices | Low | 🔴 | Nice-to-have in v1 |
| EC-05 | OTP screen closed mid-flow | Medium | 🔴 | — |
| EC-06 | Re-register same phone | Low | 🔴 | — |
| EC-07 | Network drops mid-OTP | Medium | 🔴 | — |
| EC-08 | Invalid phone format | Low | 🔴 | — |
| EC-09 | Insufficient wallet | High | 🔴 | — |
| EC-10 | Astrologer deletes mid-booking | High | 🔴 | — |
| EC-11 | Overlapping user booking | Medium | 🔴 | — |
| EC-12 | Concurrent slot booking (race) | **Critical** | 🔴 | DB UNIQUE constraint needed |
| EC-13 | Astrologer no-show | High | 🔴 | — |
| EC-14 | Min billing (1 min) | Low | 🔴 | — |
| EC-15 | Wallet negative during call | High | 🔴 | — |
| EC-16 | Call disconnected mid-way | High | 🔴 | Reconnection logic |
| EC-17 | Timezone mismatch | Low | 🔴 | — |
| EC-18 | Booking within 5 min | Medium | 🔴 | — |
| EC-19 | 1-2 star rating | Medium | 🔴 | Feedback + refund offer |
| EC-20 | Webhook delayed | High | 🔴 | Idempotency key |
| EC-21 | Payment captured, no call | High | 🔴 | Reconciliation job |
| EC-22 | Payout API down | High | 🔴 | Retry / manual option |
| EC-23 | Invalid UPI | Medium | 🔴 | — |
| EC-24 | Duplicate withdrawal | Medium | 🔴 | — |
| EC-25 | Minimum withdrawal | Low | 🔴 | — |
| EC-26 | INR display format | Low | 🔴 | — |
| EC-27 | Agora token expiry mid-call | High | 🔴 | Auto-renew |
| EC-28 | Chat message failure | Low | 🔴 | Retry + indicator |
| EC-29 | Simultaneous chat send | Low | 🔴 | Handled by Realtime |
| EC-30 | Chat persists post-call | Low | 🔴 | Desired behavior |
| EC-31 | Reject astrologer with bookings | High | 🔴 | Auto-cancel + refund |
| EC-32 | Delete user (soft) | Medium | 🔴 | Anonymize PII |
| EC-33 | Audit log forged | Medium | 🔴 | INSERT-only, server time |
| EC-34 | Commission override vs global | Low | 🔴 | Override logic |

### Known Issues
| # | Issue | Found | Status | Fix |
|---|-------|-------|--------|-----|
| 01 | `commission_settings` table may not exist in remote DB | Day 0 | Open | `process-payout` has fallback to 0.20 / ₹500 — safe but table should be created |
| 02 | `withdrawals` table missing `admin_notes` column | Day 0 | Workaround | `admin-payout-approval` writes rejection reason to `failure_reason` instead |
| 03 | Agora Web SDK vs react-native-agora import split | Day 0 | Tech Debt | Must build `useAgora.ts` abstraction layer before Week 8 |
| 04 | Push notifications: 3 different delivery channels (Web/FCM/APNs) | Day 0 | Tech Debt | `useNotifications.ts` abstraction needed before Phase 10 |
| 05 | In-memory rate limiting on edge functions resets on cold start | Day 0 | Accepted | Low impact for initial launch; upgrade to DB-backed later |
| 06 | No CORS origin validation on edge functions | Day 0 | Accepted | Low risk since calls are server-to-server; tighten before production |
| 07 | No request timeouts on edge functions | Day 0 | Accepted | Supabase defaults to 60s; explicit timeout needed for Razorpay calls |
| 08 | `withdrawals.status` enum missing `approved` — only has `processed` | Day 0 | Open | `admin-payout-approval` maps `approved` → `processed`; enum mismatch logged
