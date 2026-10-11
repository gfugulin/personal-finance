-- Migration 004: Fix processed_webhook_events table location to public with strict RLS
create table if not exists public.processed_webhook_events (
  event_id text primary key,
  event_type text not null,
  status text not null default 'RECEIVED',
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_code text
);

-- Enable RLS so that anon and standard authenticated users have zero access
alter table public.processed_webhook_events enable row level security;

-- No policies are created for public/authenticated roles.
-- Only the backend using SUPABASE_SECRET_KEY (service_role) has access.
revoke all on public.processed_webhook_events from anon, authenticated;
