# 🎨 Pixel War

> A developer-style twist on the classic Pixel War — this time, you don’t click… you **/place** your pixels.

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

The database only has one table: `pixels` which stores the pixel data.

The table has the following columns:
- `id` (integer, primary key)
- `x` (integer)
- `y` (integer)
- `color` (text)

The front end uses supabase's realtime API to listen for changes in the database and update the UI accordingly.

To fetch all the pixels from the database, you can use the `supabase.rpc("get_pixels_matrix")` method. It uses supabse remote procedure call to fetch the data from the database by using a stored procedure named "get_pixels_matrix" in the database.

It's the same logic for placing pixels. The postgresql functions behind those RPCs can be found in the `pgsql` directory. Just copy them to your postgres database and run them. Make sure the RLS on the table either allow everyone to read/write or remove the RLS.

## 📝 License
This project is licensed under the MIT License — feel free to fork, improve, and share!
