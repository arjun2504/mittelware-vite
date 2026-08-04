-- Recordings feature: step-by-step click/keypress recordings captured via the
-- extension's side panel. Screenshots + step descriptions are stored as a single
-- JSON file per recording in the `step-recordings` bucket (named `${id}.json`,
-- matching the row's uuid primary key); this table holds lightweight metadata only.

create table public.recordings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  step_count integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid default auth.uid(),
  constraint recordings_created_by_fkey foreign key (created_by) references auth.users (id)
);

alter table public.recordings enable row level security;

create policy "Users manage their own recordings"
  on public.recordings
  for all
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

insert into storage.buckets (id, name, public)
values ('step-recordings', 'step-recordings', false)
on conflict (id) do nothing;

create policy "Users manage their own recording files"
  on storage.objects
  for all
  using (bucket_id = 'step-recordings' and owner = auth.uid())
  with check (bucket_id = 'step-recordings' and owner = auth.uid());
