-- user_meta is not referenced anywhere in the application codebase (no supabase.from('user_meta')
-- calls, no queries against rules_enabled/pricing_plan). Confirmed with the team it's safe to drop.
--
-- This has NOT been run against production. Review it, then apply it yourself once linked
-- (supabase login && supabase link --project-ref wfsxeuvbxhmleprrsdco && supabase db push),
-- or run the statement directly in the Supabase SQL editor.

drop table if exists public.user_meta;
