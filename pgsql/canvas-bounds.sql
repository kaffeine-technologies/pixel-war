-- A CHECK constraint cannot read another table, so the pixel bounds that depend
-- on canvas.width/height are enforced by triggers:
--   * a pixel must fit in its canvas when inserted or moved,
--   * a canvas cannot shrink below the pixels it already holds.
--
-- Placements and canvas changes are serialized per canvas with an advisory lock:
-- placements take it shared, a change of state or size takes it exclusive.
-- Lock requests are queued fairly, so a busy canvas can't hold back an admin
-- change forever, and the placements arriving meanwhile wait for its commit,
-- then read the new state and size.

create or replace function public.canvas_lock_key(pcanvas_id bigint)
returns bigint
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.hashtextextended('public.canvas', pcanvas_id);
$$;

create or replace function public.pixel_check_bounds()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  canvas_width integer;
  canvas_height integer;
begin
  -- At REPEATABLE READ / SERIALIZABLE the canvas would be read with a snapshot
  -- taken before waiting for a change of its state or size
  if pg_catalog.current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'Write pixels in a READ COMMITTED transaction'
      using errcode = 'invalid_transaction_state';
  end if;

  perform pg_catalog.pg_advisory_xact_lock_shared(public.canvas_lock_key(new.canvas_id));

  select c.width, c.height
  into canvas_width, canvas_height
  from public.canvas c
  where c.id = new.canvas_id;

  if not found then
    raise exception 'Canvas % does not exist', new.canvas_id
      using errcode = 'foreign_key_violation';
  end if;

  if new.x >= canvas_width or new.y >= canvas_height then
    raise exception 'Pixel (%, %) is outside canvas % (% x %)',
      new.x, new.y, new.canvas_id, canvas_width, canvas_height
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create or replace trigger pixel_check_bounds
before insert or update of canvas_id, x, y on public.pixel
for each row
execute function public.pixel_check_bounds();

create or replace function public.canvas_before_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Waits for the placements in progress on this canvas, holds back the new ones
  perform pg_catalog.pg_advisory_xact_lock(public.canvas_lock_key(old.id));

  if new.width < old.width or new.height < old.height then
    -- The check below reads the pixels with the transaction snapshot: at
    -- REPEATABLE READ / SERIALIZABLE it would miss pixels placed meanwhile
    if pg_catalog.current_setting('transaction_isolation') <> 'read committed' then
      raise exception 'Shrink canvas % in a READ COMMITTED transaction', old.id
        using errcode = 'invalid_transaction_state';
    end if;

    if exists (
      select 1
      from public.pixel p
      where p.canvas_id = old.id
        and (p.x >= new.width or p.y >= new.height)
    ) then
      raise exception 'Canvas % cannot shrink to % x %: some pixels would be outside',
        old.id, new.width, new.height
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

create or replace trigger canvas_before_change
before update of state, width, height on public.canvas
for each row
execute function public.canvas_before_change();

-- Triggers don't need EXECUTE to fire
revoke execute on function
  public.pixel_check_bounds(),
  public.canvas_before_change()
from public, anon, authenticated;
