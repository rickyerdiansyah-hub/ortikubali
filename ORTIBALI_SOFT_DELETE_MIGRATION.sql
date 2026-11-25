-- ORTIBALI: soft-delete data publik dan audit penghapusan
-- Jalankan SEKALI di Supabase SQL Editor SEBELUM deploy ZIP ini.
alter table public.submissions
  add column if not exists deleted_at timestamptz null,
  add column if not exists deleted_by uuid null references auth.users(id);

create index if not exists submissions_public_visible_idx
  on public.submissions (status, deleted_at, reviewed_at desc);

create table if not exists public.public_removal_audit (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  removed_by uuid not null references auth.users(id),
  removed_at timestamptz not null default now()
);

alter table public.public_removal_audit enable row level security;

drop policy if exists "master can remove approved submissions" on public.submissions;
create policy "master can remove approved submissions"
on public.submissions for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'master'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'master'));

drop policy if exists "master can write public removal audit" on public.public_removal_audit;
create policy "master can write public removal audit"
on public.public_removal_audit for insert to authenticated
with check (removed_by = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'master'));

drop policy if exists "master can read public removal audit" on public.public_removal_audit;
create policy "master can read public removal audit"
on public.public_removal_audit for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'master'));
