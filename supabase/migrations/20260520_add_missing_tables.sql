-- Migration: Add missing tables for VedicCaller-6
-- Tables: favorites, availability_slots, call_messages, support_tickets, disputes, referrals, bank_accounts

-- 1. favorites — user's favorite astrologers
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  astrologer_id uuid not null references public.astrologers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, astrologer_id)
);
comment on table public.favorites is 'User bookmarked astrologers';

-- 2. availability_slots — astrologer availability windows
create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  astrologer_id uuid not null references public.astrologers(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_recurring boolean not null default true,
  specific_date date,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_time_range check (start_time < end_time)
);
comment on table public.availability_slots is 'Astrologer available time slots';

-- 3. call_messages — in-call text chat
create table if not exists public.call_messages (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  message text not null,
  message_type text not null default 'text' check (message_type in ('text', 'image', 'system')),
  sent_at timestamptz not null default now(),
  is_read boolean not null default false,
  read_at timestamptz
);
comment on table public.call_messages is 'In-call text chat messages';

-- 4. support_tickets — customer support requests
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  call_id uuid references public.calls(id) on delete set null,
  subject text not null,
  description text not null,
  category text not null default 'general' check (category in ('general', 'billing', 'technical', 'call_quality', 'astrologer', 'other')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed')),
  assigned_to uuid references public.users(id) on delete set null,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);
comment on table public.support_tickets is 'Customer support tickets';

-- 5. disputes — billing and call disputes
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  raised_by uuid not null references public.users(id) on delete cascade,
  dispute_type text not null check (dispute_type in ('incorrect_billing', 'short_duration', 'poor_quality', 'astrologer_misconduct', 'technical_issue', 'other')),
  description text not null,
  amount_in_dispute decimal(10,2),
  status text not null default 'open' check (status in ('open', 'under_review', 'approved', 'rejected', 'resolved')),
  resolution text,
  resolved_by uuid references public.users(id) on delete set null,
  refund_amount decimal(10,2),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.disputes is 'Call billing disputes';

-- 6. referrals — user referral tracking
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.users(id) on delete cascade,
  referred_id uuid references public.users(id) on delete set null,
  referral_code text not null unique,
  status text not null default 'pending' check (status in ('pending', 'completed', 'expired', 'rejected')),
  reward_amount decimal(10,2) default 0,
  reward_paid boolean not null default false,
  referred_phone text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
comment on table public.referrals is 'User referral tracking';

-- 7. bank_accounts — astrologer payout bank details
create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_holder_name text not null,
  account_number text not null,
  ifsc_code text not null,
  bank_name text not null,
  branch_name text,
  account_type text not null default 'savings' check (account_type in ('savings', 'current')),
  is_verified boolean not null default false,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, account_number)
);
comment on table public.bank_accounts is 'Astrologer bank accounts for payouts';
