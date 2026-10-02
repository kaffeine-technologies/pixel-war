-- Returns the colors of a visible canvas as a [y][x] matrix ('null' for empty cells),
-- or null when the canvas does not exist or is hidden.
create or replace function public.get_pixels_matrix(pcanvas_id bigint)
  returns text[][]
  language sql
  stable
  set search_path = ''
as $$
  with target as (
    select c.id, c.width, c.height
    from public.canvas c
    where c.id = pcanvas_id
      and c.state <> 'hidden'
  ),
  grid as (
    select t.id as canvas_id, x, y
    from target t
    cross join generate_series(0, t.width - 1) as x
    cross join generate_series(0, t.height - 1) as y
  ),
  pixels_full as (
    select g.x, g.y, p.color
    from grid g
    left join public.pixel p
      on p.canvas_id = g.canvas_id and p.x = g.x and p.y = g.y
  ),
  rows_agg as (
    select y, array_agg(coalesce(color, 'null') order by x) as row_colors
    from pixels_full
    group by y
  )
  select array_agg(row_colors order by y) as pixel_matrix
  from rows_agg;
$$;
