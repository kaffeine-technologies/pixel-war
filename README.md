# 🎨 Pixel War

> A developer-style twist on the classic Pixel War — this time, you don’t click… you **/place** your pixels.
> 
<img width="2148" height="1286" alt="image" src="https://github.com/user-attachments/assets/b7ed1889-89db-410e-8854-8707d5eee977" />

---

## 🧠 What is Pixel War?

**Pixel War** is a collaborative pixel art experiment inspired by *r/place*, but with a twist:  
Instead of clicking to place pixels, players use **a command line** to draw on the board.

Example:
```bash
/place -x 10 -y 10 -c #ffffff
```

## ⚙️ Tech Stack

| Technology                               | Purpose                            |
| ---------------------------------------- | ---------------------------------- |
| [React + Vite](https://vitejs.dev/)      | Front-end framework and build tool |
| [React Router](https://reactrouter.com/) | Page routing and navigation        |
| [Supabase](https://supabase.com/)        | Realtime database and backend      |
| [i18next](https://www.i18next.com/)      | Multi-language support             |

## 🚀 Features

- 🎨 Command-based pixel placement (/place -x -y -c)
- ⚡ Realtime board updates powered by Supabase
- 🌍 Multi-language support via i18next
- 🖼️ Multiple canvases, playable or read-only, switchable from the top bar
- 👤 No account required

## 💻 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Setup environment variables: `VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=...`
4. Start the development server: `npm run dev`
5. Navigate to http://localhost:5173/

## 🧩 Example Command

```bash
/place -x 10 -y 10 -c #ffffff
```

-x 10: Place the pixel at column 10
-y 10: Place the pixel at row 10
-c #ffffff: Set the color to white. It also accepts color names supported by the CSS norms (white, black, red, green, blue, etc.)

## 🔒 Secret Commands

- **/nuke**: This command will erase all pixels from the board... Though I wouldn't recommend it not for the reasons you can think of.
- **/json**: This command will replace all pixels on the board with the JSON you provide. Now find the correct format.

## 🌐 Internationalization

The app supports multiple languages thanks to i18next.
You can easily switch languages or add new ones by editing the translation files in src/i18n.

## 💽 Database

The app uses Supabase as a backend, which provides a realtime database for storing and syncing pixel data.

The database has two tables.

`canvas` stores the boards:
- `id` (bigint, primary key)
- `name` (text, 1 to 50 characters): shown in the canvas selector (the migration names the existing canvases `Canvas <id>`)
- `active` (boolean): `/canvas` loads the most recent active canvas that isn't hidden (or the most recent visible one if none is active). The other visible canvases are reachable from the canvas selector or at `/canvas/:id`.
- `width`, `height` (integer, 1 to 500): the size of the board, pixels go from `0` to `width - 1` / `height - 1`. `get_pixels_matrix` sends every cell, so bigger boards would load too slowly.
- `state` (`canvas_state` enum):
  - `playable`: visible and playable
  - `readonly`: visible but not playable
  - `hidden`: neither visible nor playable

`pixel` stores the pixels placed on a canvas:
- `id` (uuid, primary key)
- `canvas_id` (bigint, foreign key to `canvas`): deleting a canvas deletes its pixels
- `x`, `y` (integer), unique per canvas
- `color` (text): 20 characters max for new pixels (a migrated database keeps longer legacy colors until they are repainted). The commands refuse colors the browser can't parse, and the board draws older invalid ones in black.

A CHECK constraint can't read another table, so the bounds that depend on the canvas size are enforced by triggers (`pgsql/canvas-bounds.sql`): a pixel must fit in its canvas, and a canvas can't shrink below the pixels it holds. To shrink one, delete the pixels outside in the same transaction:

```sql
begin;
-- lock the canvas row, then wait for the pixels being placed on canvas 1
-- and hold back the new ones (same order as a plain update of the canvas)
select 1 from public.canvas where id = 1 for no key update;
select pg_advisory_xact_lock(public.canvas_lock_key(1));
delete from public.pixel where canvas_id = 1 and (x >= 50 or y >= 50);
update public.canvas set width = 50, height = 50 where id = 1;
commit;
```

Changing the `state` or size of a canvas waits for the pixels being placed on it, and holds back the new ones until the change is committed, so keep such transactions short and change one canvas at a time. Take those two locks first in any transaction that writes pixels of a canvas and then changes it, as above, otherwise it can deadlock with the players. Pixels must be written in READ COMMITTED transactions (the default).

To delete a canvas while players may be on it, hide it first, so that no placement is in progress when its pixels are deleted:

```sql
update public.canvas set state = 'hidden' where id = 1;
delete from public.canvas where id = 1;
```

The front end uses supabase's realtime API to listen for changes in the database and update the UI accordingly. With RLS enabled, supabase only sends the id of a deleted pixel, so pixels deleted by an admin disappear after a page reload.

To fetch all the pixels of a canvas, you can use the `supabase.rpc("get_pixels_matrix", { pcanvas_id })` method. It uses supabase remote procedure call to fetch the data from the database by using a stored procedure named "get_pixels_matrix" in the database.

It's the same logic for placing pixels (`PlacePixel`, and `place_pixels_batch` for up to 1000 pixels at once), which also check that the canvas is playable. The postgresql scripts can be found in the `pgsql` directory. Run them in this order in your postgres database:

1. `schema.sql` for a new database, or `migrations/001-multi-canvas.sql` to upgrade a database from the single-canvas version (it also renames `canvas.heigth` to `height`, and keeps the 101 x 101 board of the existing canvas)
2. `canvas-bounds.sql`
3. `getpixels.sql`
4. `placepixels.sql`
5. `rls.sql`: players can only read visible canvases and can only write through the functions above. Without it, anyone with the anon key can change a canvas state or size, or write pixels directly into the tables, so `readonly` and `hidden` would mean nothing. Warning: it replaces every existing policy on `canvas` and `pixel`.

When upgrading, run the five steps in one go and deploy the new front end right after: the previous front end stops working once the migration has run, and the new one doesn't work before it.

## 📝 License
This project is licensed under the MIT License — feel free to fork, improve, and share!
