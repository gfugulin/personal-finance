alter table public.profiles enable row level security;
alter table public.financial_connections enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.classification_rules enable row level security;
alter table public.investments enable row level security;
alter table public.investment_transactions enable row level security;
alter table public.monthly_plans enable row level security;
alter table public.goals enable row level security;
alter table public.net_worth_snapshots enable row level security;
alter table public.tax_rule_sets enable row level security;
alter table public.tax_adjustments enable row level security;
alter table public.tax_checklist_items enable row level security;

create policy profiles_own on public.profiles
for all to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy profiles_aal2 on public.profiles
as restrictive for all to authenticated
using ((select auth.jwt()->>'aal') = 'aal2')
with check ((select auth.jwt()->>'aal') = 'aal2');

do $$
declare t text;
begin
  foreach t in array array[
    'financial_connections','accounts','transactions','classification_rules',
    'investments','investment_transactions','monthly_plans','goals',
    'net_worth_snapshots','tax_adjustments','tax_checklist_items'
  ]
  loop
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_own', t
    );
    execute format(
      'create policy %I on public.%I as restrictive for all to authenticated using ((select auth.jwt()->>''aal'') = ''aal2'') with check ((select auth.jwt()->>''aal'') = ''aal2'')',
      t || '_aal2', t
    );
  end loop;
end $$;

create policy categories_read on public.categories
for select to authenticated
using (user_id is null or (select auth.uid()) = user_id);

create policy categories_insert_own on public.categories
for insert to authenticated
with check ((select auth.uid()) = user_id and is_system = false);

create policy categories_update_own on public.categories
for update to authenticated
using ((select auth.uid()) = user_id and is_system = false)
with check ((select auth.uid()) = user_id and is_system = false);

create policy categories_delete_own on public.categories
for delete to authenticated
using ((select auth.uid()) = user_id and is_system = false);

create policy categories_aal2 on public.categories
as restrictive for all to authenticated
using ((select auth.jwt()->>'aal') = 'aal2')
with check ((select auth.jwt()->>'aal') = 'aal2');

create policy tax_rules_read on public.tax_rule_sets
for select to authenticated
using (active = true);

create policy tax_rules_aal2 on public.tax_rule_sets
as restrictive for select to authenticated
using ((select auth.jwt()->>'aal') = 'aal2');

revoke all on schema private from anon, authenticated;
revoke all on all tables in schema private from anon, authenticated;
