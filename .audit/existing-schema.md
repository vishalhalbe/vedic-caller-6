# Existing Database Schema - VedicCall (bkxmbmdnkpmvtaixeiik)

## Tables & Columns (discovered from edge function source + REST API)

### 1. wallets
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | References auth.users |
| balance | decimal(10,2) | Current wallet balance |
| bonus_balance | decimal(10,2) | Default 0 |
| currency | text | Default 'INR' |
| total_recharged | decimal(10,2) | Lifetime total |
| total_spent | decimal(10,2) | Lifetime total |
| total_paid_out | decimal(10,2) | Lifetime total |
| is_locked | boolean | Default false |
| lock_reason | text | Nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 2. calls
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| customer_id | uuid | References auth.users |
| astrologer_id | uuid | References astrologers |
| astrologer_call_id | uuid | References astrologers? |
| agora_channel_name | text | Nullable |
| agora_uid | integer | Nullable |
| status | text | 'initiated','active','ended','failed' |
| start_time | timestamptz | Nullable |
| end_time | timestamptz | Nullable |
| duration_seconds | integer | |
| ringing_duration_seconds | integer | Default 0 |
| billable_duration_seconds | integer | |
| per_second_rate | decimal(10,4) | |
| total_cost | decimal(10,2) | |
| customer_charged | decimal(10,2) | |
| astrologer_earned | decimal(10,2) | |
| platform_commission | decimal(10,2) | |
| commission_rate | decimal(10,4) | Default 0.20 |
| customer_balance_before | decimal(10,2) | |
| customer_balance_after | decimal(10,2) | |
| end_reason | text | Nullable |
| end_initiated_by | text | Nullable |
| is_rated | boolean | Default false |
| call_recording_url | text | Nullable |
| customer_lat/decimal | decimal | Nullable |
| customer_lng | decimal | Nullable |
| astrologer_lat | decimal | Nullable |
| astrologer_lng | decimal | Nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 3. astrologers
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | References auth.users, nullable |
| display_name | text | |
| bio | text | |
| expertise | text[] | Array |
| languages | text[] | Array |
| skills | text[] | Array |
| experience_years | integer | |
| rating | decimal(3,2) | Default 0 |
| total_ratings | integer | Default 0 |
| price_per_minute | decimal(10,2) | |
| minimum_call_duration | integer | Default 60s |
| maximum_call_duration | integer | Default 3600s |
| is_online | boolean | Default false |
| is_available | boolean | Default true |
| is_featured | boolean | Default false |
| call_count | integer | Default 0 |
| total_call_minutes | integer | Default 0 |
| kyc_status | text | 'pending','verified','rejected' |
| kyc_documents | jsonb | Array |
| verification_notes | text | Nullable |
| approval_status | text | 'pending_verification','approved','rejected' |
| approval_rejection_reason | text | Nullable |
| approved_by | uuid | Nullable |
| approved_at | timestamptz | Nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| search_vector | tsvector | Full-text search |

### 4. payments
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | |
| transaction_id | uuid | Nullable |
| gateway | text | 'razorpay' |
| gateway_payment_id | text | |
| order_id | text | Nullable |
| amount | decimal(10,2) | |
| currency | text | 'INR' |
| status | text | 'pending','completed','failed','refunded' |
| payment_method | text | Nullable |
| gateway_response | jsonb | Nullable |
| refund_id | text | Nullable |
| refund_amount | decimal(10,2) | Nullable |
| refund_reason | text | Nullable |
| completed_at | timestamptz | Nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 5. transactions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| wallet_id | uuid | FK → wallets |
| type | text | 'recharge','call_deduction','withdrawal','refund','payout' |
| status | text | 'completed','pending','failed','rejected','reversed' |
| amount | decimal(10,2) | |
| balance_before | decimal(10,2) | |
| balance_after | decimal(10,2) | |
| bonus_amount | decimal(10,2) | Default 0 |
| currency | text | 'INR' |
| reference_id | text | Nullable |
| reference_type | text | Nullable |
| description | text | Nullable |
| metadata | jsonb | Default {} |
| failure_reason | text | Nullable |
| completed_at | timestamptz | Nullable |
| created_at | timestamptz | |

### 6. withdrawals
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | |
| amount | decimal(10,2) | |
| currency | text | 'INR' |
| status | text | 'pending','processed','rejected','reversed' |
| payment_method | text | Nullable |
| bank_account_id | uuid | Nullable |
| gateway_transaction_id | text | Nullable |
| gateway_response | jsonb | Nullable |
| failure_reason | text | Nullable |
| processed_at | timestamptz | Nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 7. audit_logs
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| timestamp | timestamptz | |
| actor_id | text | |
| actor_type | text | 'user','system' |
| event_type | text | |
| resource_type | text | |
| resource_id | text | |
| action | text | 'create','update' |
| status | text | 'success','failure' |
| metadata | jsonb | |
| ip_address | text | Nullable |
| user_agent | text | Nullable |

### 8. astroveda_bookings
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | |
| astrologer_id | uuid | |
| booking_date | date | |
| start_time | time | |
| duration_minutes | integer | |
| total_amount | decimal(10,2) | |
| status | text | 'pending','confirmed','completed','cancelled' |
| payment_id | text | Nullable |
| notes | text | Nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 9. notifications (EXISTS - empty, columns unknown)

### Users
- Uses Supabase `auth.users` table directly (not a custom users table)
- `email` column available from auth.users

## PRD Delta Analysis

| PRD Requirement | Existing | Missing |
|-----------------|----------|---------|
| **profiles** (name, phone, avatar, role) | Uses auth.users directly | Need `profiles` table with role enum, name, phone, avatar, dob, gender |
| **astrologers** (full profile) | ✅ Excellent - has all fields + search_vector | |
| **wallets** (balance, transactions) | ✅ Excellent - has bonus, lock, total tracking | |
| **calls** (full call log) | ✅ Excellent - has geo, commission, rate fields | |
| **transactions** (wallet txns) | ✅ Excellent - has bonus_amount, metadata | |
| **payments** (gateway records) | ✅ | |
| **withdrawals** (payouts) | ✅ | |
| **audit_logs** | ✅ | |
| **astroveda_bookings** | ✅ Schedule booking table exists | |
| **notifications** | ✅ Empty table exists | Column definition unknown |
| **favorites** | ❌ NOT FOUND | Need to create |
| **schedules** (astrologer availability) | ❌ NOT FOUND | Need to create |
| **reviews/ratings** | ❌ NOT FOUND | Need to create (part of calls table via `is_rated`) |
| **wallet_settings** (min/max, commission) | ❌ NOT FOUND | Need to create |
| **disputes** | ❌ NOT FOUND | Need to create |
| **referrals** | ❌ NOT FOUND | Need to create |
| **support_tickets** | ❌ NOT FOUND | Need to create |
| **admin_settings** | ❌ NOT FOUND | Need to create |
| **call_messages** (in-call chat) | ❌ NOT FOUND | Need to create |

## Key Observations
1. Schema is solid for core domain (calls, wallets, astrologers, payments)
2. No RLS policies visible yet - need to check/implement
3. Full-text search vector exists on astrologers
4. Commission rate hardcoded at 20% in `process-payout` function
5. `profiles` table doesn't exist - auth.users used directly
6. Missing secondary/edge tables: favorites, schedules, reviews, settings, disputes, referrals, support_tickets
7. Many edge functions have v2 versions suggesting iterative improvement
8. Astroveda functions are standalone (separate booking flow, separate token gen)
