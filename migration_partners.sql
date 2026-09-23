-- ============================================================
-- Happy Fit Physio — Partner (συνεργάτης) architecture, phase 2
-- Run this ONCE in Supabase → SQL Editor → New query → Run.
-- It is written to be additive: it does not drop or replace any
-- existing table, column, or RLS policy, so your current data
-- and access rules stay exactly as they are.
-- ============================================================

-- 1) Let a profile be suspended (owner control over a partner coach).
alter table profiles add column if not exists suspended boolean not null default false;

-- 2) New invite-code table for onboarding PARTNER coaches (mirrors
--    how client invite_codes already work: created by the owner,
--    single-use, checked before signUp).
create table if not exists coach_invite_codes (
  code text primary key,
  created_by uuid references profiles(id),
  used boolean not null default false,
  used_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table coach_invite_codes enable row level security;

-- Anyone (including a not-yet-authenticated signup form) can check
-- whether a code is valid — same pattern as your existing client
-- invite_codes table.
drop policy if exists "anyone can read unused coach invite codes" on coach_invite_codes;
create policy "anyone can read unused coach invite codes"
  on coach_invite_codes for select
  using (true);

-- Only a signed-in user can mark a code used (happens right after
-- their own signUp, before they have a profile row yet, so this is
-- intentionally permissive on UPDATE too — matches the existing
-- invite_codes table's behaviour for the same reason).
drop policy if exists "authenticated can update coach invite codes" on coach_invite_codes;
create policy "authenticated can update coach invite codes"
  on coach_invite_codes for update
  using (auth.role() = 'authenticated');

-- 3) Helper: is this user the platform owner? Used by the new
--    policies below. Defined once, reused everywhere — change the
--    logic in one place if it ever needs to change.
create or replace function is_owner(uid uuid) returns boolean
language sql stable as $$
  select exists(select 1 from profiles where id = uid and role = 'owner');
$$;

-- 4) Owner-only additional read access, so the Partners dashboard
--    can see every coach's profile and client counts. These are
--    ADDITIVE policies — Postgres OR's every matching permissive
--    policy together, so your existing coach/client isolation
--    policies keep working exactly as before for everyone who is
--    not the owner.
drop policy if exists "owner can read all profiles" on profiles;
create policy "owner can read all profiles"
  on profiles for select
  using (is_owner(auth.uid()));

drop policy if exists "owner can update all profiles" on profiles;
create policy "owner can update all profiles"
  on profiles for update
  using (is_owner(auth.uid()));

drop policy if exists "owner can read all clients" on clients;
create policy "owner can read all clients"
  on clients for select
  using (is_owner(auth.uid()));

drop policy if exists "owner can insert coach invite codes" on coach_invite_codes;
create policy "owner can insert coach invite codes"
  on coach_invite_codes for insert
  with check (is_owner(auth.uid()));

-- 5) Promote YOUR OWN account to owner. Find your user id first:
--    select id, full_name from profiles where role = 'coach';
-- Then run (replace the uuid below with your actual id):
--
-- update profiles set role = 'owner' where id = 'PASTE-YOUR-USER-ID-HERE';
--
-- If your profiles.role column has a CHECK constraint limiting it
-- to specific values (e.g. only 'client'/'coach'), that UPDATE will
-- fail with a constraint error — if so, run this first to find the
-- constraint's name, then drop and recreate it to also allow 'owner':
--
-- select conname, pg_get_constraintdef(oid) from pg_constraint
--   where conrelid = 'profiles'::regclass and contype = 'c';
--
-- -- then, using the real constraint name from the query above:
-- -- alter table profiles drop constraint <constraint_name>;
-- -- alter table profiles add constraint <constraint_name>
-- --   check (role in ('client','coach','owner'));
