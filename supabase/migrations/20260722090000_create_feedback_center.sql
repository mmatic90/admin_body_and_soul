create extension if not exists pgcrypto;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_by_email text,
  created_by_name text,
  type text not null check (type in ('bug', 'improvement', 'idea', 'question')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  title text not null check (char_length(title) between 3 and 160),
  description text not null check (char_length(description) between 5 and 5000),
  status text not null default 'open' check (status in ('open', 'investigating', 'in_progress', 'waiting', 'done', 'rejected')),
  screenshot_path text,
  page_url text,
  user_agent text,
  browser text,
  operating_system text,
  viewport text,
  language text,
  app_version text,
  admin_comment text
);

create index if not exists feedback_created_at_idx
  on public.feedback (created_at desc);

create index if not exists feedback_status_idx
  on public.feedback (status);

create index if not exists feedback_created_by_idx
  on public.feedback (created_by);

create or replace function public.set_feedback_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_feedback_updated_at on public.feedback;
create trigger set_feedback_updated_at
before update on public.feedback
for each row execute function public.set_feedback_updated_at();

alter table public.feedback enable row level security;

drop policy if exists "Authenticated users can create feedback" on public.feedback;
create policy "Authenticated users can create feedback"
on public.feedback
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Maurizio can view all feedback" on public.feedback;
create policy "Maurizio can view all feedback"
on public.feedback
for select
to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'maurizio@bodyandsoul.hr');

drop policy if exists "Maurizio can update feedback" on public.feedback;
create policy "Maurizio can update feedback"
on public.feedback
for update
to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'maurizio@bodyandsoul.hr')
with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'maurizio@bodyandsoul.hr');

drop policy if exists "Maurizio can delete feedback" on public.feedback;
create policy "Maurizio can delete feedback"
on public.feedback
for delete
to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'maurizio@bodyandsoul.hr');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'feedback',
  'feedback',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users can upload feedback screenshots" on storage.objects;
create policy "Authenticated users can upload feedback screenshots"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'feedback'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Maurizio can read feedback screenshots" on storage.objects;
create policy "Maurizio can read feedback screenshots"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'feedback'
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'maurizio@bodyandsoul.hr'
);

drop policy if exists "Maurizio can delete feedback screenshots" on storage.objects;
create policy "Maurizio can delete feedback screenshots"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'feedback'
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'maurizio@bodyandsoul.hr'
);
