-- ============================================================
-- Happy Fit Physio — Partner architecture, phase 4
-- (billing history + QC visibility into a partner's clients)
-- Run this ONCE in Supabase → SQL Editor → New query → Run,
-- AFTER migration_partners.sql (it reuses the is_owner() function
-- that script creates). Additive only — nothing existing is
-- dropped or replaced.
-- ============================================================

-- 1) Durable monthly billing record per partner. This is a RECORD,
--    not an automatic charge — the app has no payment processor
--    wired in anywhere, so "paid" is set by hand by the owner once
--    money has actually changed hands outside the platform.
create table if not exists partner_charges (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references profiles(id),
  period text not null,              -- 'YYYY-MM', one row per partner per month
  active_clients integer not null,
  rate numeric not null,
  amount numeric not null,
  paid boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (coach_id, period)
);

alter table partner_charges enable row level security;

-- Owner: full access (record charges, mark paid/unpaid, review history).
drop policy if exists "owner can manage partner charges" on partner_charges;
create policy "owner can manage partner charges"
  on partner_charges for all
  using (is_owner(auth.uid()))
  with check (is_owner(auth.uid()));

-- Partner coach: read-only access to their OWN charge history, so they
-- can see what was recorded and whether it's marked paid.
drop policy if exists "coach can read own charges" on partner_charges;
create policy "coach can read own charges"
  on partner_charges for select
  using (coach_id = auth.uid());

-- 2) QC visibility: let the owner see enough of a partner's client data
--    to tell whether clients are being looked after (check-ins happening,
--    a program assigned) — NOT their messages, intake forms, or anything
--    beyond what the "needs attention" logic already uses elsewhere in
--    the app. Additive SELECT policies, exactly like migration_partners.sql.
drop policy if exists "owner can read all checkins" on checkins;
create policy "owner can read all checkins"
  on checkins for select
  using (is_owner(auth.uid()));

drop policy if exists "owner can read all programs" on programs;
create policy "owner can read all programs"
  on programs for select
  using (is_owner(auth.uid()));
