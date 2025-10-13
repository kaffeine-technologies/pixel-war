create or replace function public."PlacePixel"(
  px integer,
  py integer,
  pcolor text
)
returns void
language plpgsql
as $$
begin
  insert into public.pixel (x, y, color)
  values (px, py, pcolor)
  on conflict (x, y) do update
  set color = excluded.color;
end;
$$;

alter table public.pixel
add constraint pixel_x_y_unique unique (x, y);

ALTER TABLE public.pixel
ADD CONSTRAINT pixel_x_y_range_check
CHECK (x >= 0 AND x <= 100 AND y >= 0 AND y <= 100);

create or replace function public.place_pixels_batch(pixels jsonb)
returns void
language plpgsql
as $$
begin
  insert into public.pixel (x, y, color)
  select
    (split_part(key, ':', 1))::integer as x,
    (split_part(key, ':', 2))::integer as y,
    value as color
  from jsonb_each_text(pixels)
  on conflict (x, y) do update set color = excluded.color;
end;
$$;