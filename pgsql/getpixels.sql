create or replace function public.get_pixels_matrix()
  returns text[][]
  language sql
  stable
as $$
  with grid as (
    select x, y
    from generate_series(0, 100) as x
    cross join generate_series(0, 100) as y
  ),
  pixels_full as (
    select g.x, g.y, p.color
    from grid g
    left join public.pixel p on p.x = g.x and p.y = g.y
    order by g.y, g.x
  ),
  rows_agg as (
    select y, array_agg(coalesce(color, 'null') order by x) as row_colors
    from pixels_full
    group by y
    order by y
  )
  select array_agg(row_colors order by y) as pixel_matrix
  from rows_agg;
$$;