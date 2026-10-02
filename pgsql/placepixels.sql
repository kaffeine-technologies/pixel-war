-- Raises unless the canvas exists and is playable. The shared lock makes a
-- concurrent state change wait until the pixels being placed are committed
-- (see canvas-bounds.sql).
create or replace function public.assert_canvas_playable(pcanvas_id bigint)
returns void
language plpgsql
set search_path = ''
as $$
declare
  current_state public.canvas_state;
begin
  perform pg_catalog.pg_advisory_xact_lock_shared(public.canvas_lock_key(pcanvas_id));

  select c.state
  into current_state
  from public.canvas c
  where c.id = pcanvas_id;

  -- hidden canvases answer like missing ones
  if not found or current_state = 'hidden' then
    raise exception 'Canvas % does not exist', pcanvas_id;
  end if;

  if current_state <> 'playable' then
    raise exception 'Canvas % is not playable', pcanvas_id;
  end if;
end;
$$;

-- Only called by the functions below
revoke execute on function public.assert_canvas_playable(bigint) from public, anon, authenticated;

-- The placing functions are security definer: with rls.sql they are the only
-- way for players to write pixels.

create or replace function public."PlacePixel"(
  pcanvas_id bigint,
  px integer,
  py integer,
  pcolor text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_canvas_playable(pcanvas_id);

  insert into public.pixel (canvas_id, x, y, color)
  values (pcanvas_id, px, py, pcolor)
  on conflict (canvas_id, x, y) do update
  set color = excluded.color;
end;
$$;

create or replace function public.place_pixels_batch(pcanvas_id bigint, pixels jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Same size as the front end's chunks: a bigger batch would hold the canvas
  -- lock for seconds
  if (select count(*) from pg_catalog.jsonb_object_keys(pixels)) > 1000 then
    raise exception 'A batch holds at most 1000 pixels'
      using errcode = 'program_limit_exceeded';
  end if;

  perform public.assert_canvas_playable(pcanvas_id);

  -- One row per pixel, in (x, y) order: "01:1" and "1:1" are the same pixel,
  -- and concurrent batches lock their rows in the same order (no deadlock)
  insert into public.pixel (canvas_id, x, y, color)
  select distinct on (p.x, p.y) pcanvas_id, p.x, p.y, p.color
  from (
    select
      (split_part(key, ':', 1))::integer as x,
      (split_part(key, ':', 2))::integer as y,
      value as color
    from jsonb_each_text(pixels)
  ) p
  order by p.x, p.y
  on conflict (canvas_id, x, y) do update set color = excluded.color;
end;
$$;
