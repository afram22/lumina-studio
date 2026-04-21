
-- Meetings table
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled meeting',
  status text not null default 'pending', -- pending | uploading | transcribing | extracting | done | error
  error text,
  file_path text,
  duration_seconds int,
  transcript jsonb,
  summary text,
  decisions jsonb,
  action_items jsonb,
  timeline jsonb,
  scope_of_work text,
  agent_log jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meetings enable row level security;

create policy "users select own meetings" on public.meetings for select using (auth.uid() = user_id);
create policy "users insert own meetings" on public.meetings for insert with check (auth.uid() = user_id);
create policy "users update own meetings" on public.meetings for update using (auth.uid() = user_id);
create policy "users delete own meetings" on public.meetings for delete using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger meetings_updated_at before update on public.meetings
for each row execute function public.set_updated_at();

-- Realtime
alter publication supabase_realtime add table public.meetings;
alter table public.meetings replica identity full;

-- Storage bucket (private)
insert into storage.buckets (id, name, public) values ('meeting-uploads', 'meeting-uploads', false)
on conflict (id) do nothing;

create policy "users read own uploads" on storage.objects for select
  using (bucket_id = 'meeting-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users insert own uploads" on storage.objects for insert
  with check (bucket_id = 'meeting-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users delete own uploads" on storage.objects for delete
  using (bucket_id = 'meeting-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
