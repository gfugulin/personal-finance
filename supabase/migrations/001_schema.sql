create extension if not exists pgcrypto;

create type public.connection_status as enum ('PENDING','ACTIVE','SYNCING','ERROR','REAUTH_REQUIRED','REVOKED');
create type public.account_type as enum ('BANK','CREDIT');
create type public.transaction_nature as enum ('INCOME','EXPENSE','TRANSFER','CARD_PAYMENT','INVESTMENT','REFUND','IGNORE','UNKNOWN');
create type public.transaction_status as enum ('PENDING','POSTED','DELETED');
create type public.tax_treatment as enum (
  'TAXABLE_INCOME','EXEMPT_NON_TAXABLE','EXCLUSIVE_DEFINITIVE','DEDUCTIBLE_EXPENSE',
  'TAX_WITHHELD','ASSET_MOVEMENT','NO_TAX_EFFECT','REVIEW'
);
create type public.goal_status as enum ('ACTIVE','COMPLETED','PAUSED','ARCHIVED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'America/Sao_Paulo',
  currency_code text not null default 'BRL',
  reserve_floor numeric(18,2) not null default 0 check (reserve_floor >= 0),
  monthly_investment_target numeric(18,2) not null default 0 check (monthly_investment_target >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.financial_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'PLUGGY',
  institution_name text not null,
  external_item_id text not null,
  connector_id text,
  status public.connection_status not null default 'PENDING',
  last_sync_at timestamptz,
  last_successful_sync_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, external_item_id)
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.financial_connections(id) on delete cascade,
  external_account_id text not null,
  type public.account_type not null,
  subtype text,
  name text not null,
  currency_code text not null default 'BRL',
  balance numeric(18,2) not null default 0,
  credit_limit numeric(18,2),
  available_credit_limit numeric(18,2),
  invoice_due_date date,
  invoice_close_date date,
  is_active boolean not null default true,
  reference_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(connection_id, external_account_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  parent_id uuid references public.categories(id) on delete set null,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  external_transaction_id text,
  description text not null,
  merchant_name text,
  amount numeric(18,2) not null,
  currency_code text not null default 'BRL',
  transaction_date timestamptz not null,
  posted_date timestamptz,
  status public.transaction_status not null default 'POSTED',
  nature public.transaction_nature not null default 'UNKNOWN',
  category_id uuid references public.categories(id) on delete set null,
  tax_treatment public.tax_treatment not null default 'REVIEW',
  tax_year integer generated always as (extract(year from transaction_date at time zone 'America/Sao_Paulo')::integer) stored,
  financial_reviewed boolean not null default false,
  tax_reviewed boolean not null default false,
  payment_method text,
  installment_number integer,
  total_installments integer,
  provider_category text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index transactions_external_unique
on public.transactions(account_id, external_transaction_id)
where external_transaction_id is not null;
create index transactions_user_date_idx on public.transactions(user_id, transaction_date desc);
create index transactions_tax_review_idx on public.transactions(user_id, tax_year, tax_reviewed) where tax_reviewed = false;

create table public.classification_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain text not null check (domain in ('FINANCIAL','TAX')),
  field text not null check (field in ('description','merchant_name','payment_method','account_id')),
  operator text not null check (operator in ('equals','contains','starts_with')),
  pattern_value text not null,
  category_id uuid references public.categories(id) on delete set null,
  financial_nature public.transaction_nature,
  fiscal_treatment public.tax_treatment,
  priority integer not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.financial_connections(id) on delete cascade,
  external_investment_id text not null,
  name text not null,
  ticker text,
  type text,
  subtype text,
  quantity numeric(28,10),
  unit_value numeric(18,6),
  current_value numeric(18,2),
  contributed_value numeric(18,2),
  currency_code text not null default 'BRL',
  reference_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(connection_id, external_investment_id)
);

create table public.investment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  investment_id uuid not null references public.investments(id) on delete cascade,
  external_transaction_id text,
  transaction_type text not null,
  amount numeric(18,2),
  quantity numeric(28,10),
  transaction_date timestamptz not null,
  created_at timestamptz not null default now()
);

create unique index investment_transactions_external_unique
on public.investment_transactions(investment_id, external_transaction_id)
where external_transaction_id is not null;

create table public.monthly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null check (extract(day from month)=1),
  expected_income numeric(18,2) not null default 0,
  spending_limit numeric(18,2) not null default 0,
  investment_target numeric(18,2) not null default 0,
  notes text,
  unique(user_id, month)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(18,2) not null check (target_amount > 0),
  current_amount numeric(18,2) not null default 0,
  target_date date,
  status public.goal_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null,
  cash numeric(18,2) not null,
  investments numeric(18,2) not null,
  credit_card_liability numeric(18,2) not null,
  net_worth numeric(18,2) not null,
  created_at timestamptz not null default now(),
  unique(user_id, snapshot_date)
);

create table public.tax_rule_sets (
  id uuid primary key default gen_random_uuid(),
  calendar_year integer not null unique,
  source_name text not null,
  source_url text not null,
  source_updated_at date,
  rules_json jsonb not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.tax_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tax_year integer not null,
  treatment public.tax_treatment not null,
  description text not null,
  amount numeric(18,2) not null check (amount >= 0),
  event_date date,
  linked_transaction_id uuid references public.transactions(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tax_checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tax_year integer not null,
  key text not null,
  label text not null,
  completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, tax_year, key)
);

create schema if not exists private;
create table private.processed_webhook_events (
  event_id text primary key,
  event_type text not null,
  status text not null default 'RECEIVED',
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_code text
);
