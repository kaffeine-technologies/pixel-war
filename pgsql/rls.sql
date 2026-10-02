-- Required: players can only read visible canvases and their pixels, and can
-- only write through the PlacePixel / place_pixels_batch functions, which check
-- that the canvas is playable. Without it, anyone with the anon key can change
-- a canvas state or size, or write pixels directly into the tables, which makes
-- 'readonly' and 'hidden' meaningless.
--
-- WARNING: this drops every existing policy on public.canvas and public.pixel
-- (e.g. an "allow everything" policy) so that only the policies below remain.
-- Run it after getpixels.sql and placepixels.sql.
begin;

do $$
declare
  existing record;
begin
  for existing in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public' and tablename in ('canvas', 'pixel')
  loop
    execute format('drop policy %I on public.%I', existing.policyname, existing.tablename);
  end loop;
end;
$$;

alter table public.canvas enable row level security;
alter table public.pixel enable row level security;

create policy "Visible canvases are readable"
on public.canvas
for select
to anon, authenticated
using (state <> 'hidden');

create policy "Pixels of visible canvases are readable"
on public.pixel
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.canvas c
    where c.id = canvas_id
      and c.state <> 'hidden'
  )
);

-- Supabase grants everything on new tables to anon/authenticated: keep reading only
revoke all on public.canvas, public.pixel from anon, authenticated;
grant select on public.canvas, public.pixel to anon, authenticated;

commit;
