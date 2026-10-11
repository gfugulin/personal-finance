-- Migration 005: Add unique constraint to transactions for seamless PostgREST upsert
alter table public.transactions
  drop constraint if exists transactions_account_external_id_key;

alter table public.transactions
  add constraint transactions_account_external_id_key unique (account_id, external_transaction_id);
