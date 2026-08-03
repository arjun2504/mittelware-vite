-- Baseline migration: documents the schema as it already exists in production today.
-- These tables were originally created by hand in the Supabase dashboard, before this
-- project adopted the Supabase CLI / migrations workflow.
--
-- Do NOT run this against the existing production database as-is: the tables already
-- exist there, so `create table` will fail. Before running `supabase db push`:
--   1. supabase login
--   2. supabase link --project-ref wfsxeuvbxhmleprrsdco
--   3. supabase migration repair --status applied 20260803000000
-- Step 3 tells Supabase this migration's changes are already applied in prod, without
-- re-running the SQL. Alternatively, run `supabase db pull` once linked and replace this
-- file with the generated one -- it will also capture RLS policies/grants, which aren't
-- included here since they weren't part of the schema export this file was written from.

create table public.rules (
  created_at timestamp with time zone not null default now(),
  type text,
  advanced_filters json,
  description text,
  url_pattern text,
  config json,
  name text not null,
  is_enabled boolean not null default true,
  created_by uuid default auth.uid(),
  id bigint generated always as identity not null,
  updated_at timestamp with time zone default now(),
  updated_by uuid default auth.uid(),
  constraint rules_pkey primary key (id),
  constraint rules_created_by_fkey foreign key (created_by) references auth.users (id),
  constraint rules_updated_by_fkey foreign key (updated_by) references auth.users (id)
);

create table public.user_meta (
  rules_enabled boolean default true,
  id uuid not null default auth.uid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone default now(),
  pricing_plan character varying default 'free'::character varying,
  constraint user_meta_pkey primary key (id),
  constraint user_meta_id_fkey foreign key (id) references auth.users (id)
);
