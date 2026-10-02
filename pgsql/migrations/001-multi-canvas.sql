-- Upgrades the original single-canvas database to multi-canvas.
-- Run it once, then canvas-bounds.sql, getpixels.sql, placepixels.sql and rls.sql.
-- Fresh databases use schema.sql instead.
begin;

-- 1. Canvas: visibility/playability state, name shown in the selector,
-- "heigth" typo, mandatory size

create type public.canvas_state as enum (
  'playable', -- visible and playable
  'readonly', -- visible but not playable
  'hidden'    -- neither visible nor playable
);

alter table public.canvas rename column heigth to height;

-- The old game never read these sizes: replace missing or invalid ones
update public.canvas
set width = case when width between 1 and 500 then width else 100 end,
    height = case when height between 1 and 500 then height else 100 end
where not coalesce(width between 1 and 500 and height between 1 and 500, false);

alter table public.canvas
  add column state public.canvas_state not null default 'playable',
  add column name text,
  alter column width set not null,
  alter column height set not null,
  -- get_pixels_matrix sends every cell: bigger boards load too slowly
  add constraint canvas_size_check check (width between 1 and 500 and height between 1 and 500);

-- Existing pixels need a canvas to belong to
insert into public.canvas (active)
select true
where not exists (select 1 from public.canvas);

-- Placeholder names, to rename
update public.canvas set name = 'Canvas ' || id;

alter table public.canvas
  alter column name set not null,
  add constraint canvas_name_check check (
    -- at least one visible character: \s misses NBSP and the zero-width spaces
    name ~ '[^\s\u00a0\u1680\u180e\u2000-\u200f\u2028-\u202f\u205f-\u2064\u3000\ufeff]'
    and char_length(name) <= 50
  );

-- 2. Pixel: attach every existing pixel to the canvas the game loads by default

do $$
declare
  default_canvas_id bigint;
begin
  select id
  into default_canvas_id
  from public.canvas
  order by active desc, created_at desc, id desc
  limit 1;

  -- A constant default fills the existing rows without updating them one by one,
  -- so Realtime doesn't replay one UPDATE per pixel to connected players
  execute format(
    'alter table public.pixel add column canvas_id bigint not null default %s',
    default_canvas_id
  );
  alter table public.pixel alter column canvas_id drop default;

  -- The old game always showed a 101 x 101 board (the check allowed 0..100),
  -- whatever canvas.width said. Coordinates are now 0..width-1: keep that board.
  update public.canvas
  set width = greatest(width, 101),
      height = greatest(height, 101)
  where id = default_canvas_id;
end;
$$;

-- 3. Pixel ids become UUIDs

alter table public.pixel drop constraint pixel_pkey;
alter table public.pixel alter column id drop identity if exists;
alter table public.pixel alter column id type uuid using gen_random_uuid();
alter table public.pixel alter column id set default gen_random_uuid();
alter table public.pixel add constraint pixel_pkey primary key (id);

-- 4. Pixel constraints are now per canvas
-- (the upper bounds depend on the canvas size: see canvas-bounds.sql)

alter table public.pixel
  add constraint pixel_canvas_id_fkey
  foreign key (canvas_id) references public.canvas (id) on delete cascade;

-- No "if exists": with other constraint names, a global unique (x, y) left
-- behind would break every other canvas. Rename them here if needed.
alter table public.pixel drop constraint pixel_x_y_unique;
alter table public.pixel drop constraint pixel_x_y_range_check;

alter table public.pixel
  add constraint pixel_canvas_x_y_unique unique (canvas_id, x, y);

alter table public.pixel
  add constraint pixel_x_y_non_negative check (x >= 0 and y >= 0);

-- Colors were only limited by the browser. Existing pixels are not checked.
alter table public.pixel
  add constraint pixel_color_length_check check (char_length(color) <= 20) not valid;

-- Lets Realtime match DELETEs on canvas_id and send the whole deleted row when
-- RLS is off. With rls.sql, DELETE payloads only carry the id (see README).
alter table public.pixel replica identity full;

-- 5. Single-canvas functions (replaced by getpixels.sql and placepixels.sql)

drop function if exists public.get_pixels_matrix();
drop function if exists public."PlacePixel"(integer, integer, text);
drop function if exists public.place_pixels_batch(jsonb);

commit;
