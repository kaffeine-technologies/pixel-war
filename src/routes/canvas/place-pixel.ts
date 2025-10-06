import { SupabaseClient } from "@supabase/supabase-js";

// Utility function to escape HTML special chars (simple sanitation)
function escapeHtml(text: string) {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

// Parse a command line string like:
// /place -x 1 -y 1 -c red or /place -x 1 -y 1 -c #000000
function parsePlaceCommand(command: string) {
  // Quick validation: command should start with "/place"
  if (!command.trim().toLowerCase().startsWith("/place")) {
    throw new Error("Unknown or invalid command");
  }

  // Extract tokens matching flags and values: -x, -y, -c
  // This is a simple RegExp based parser
  const regex = /-(x|y|c)\s+([\S]+)/gi;
  const args: { [key: string]: string } = {};
  let match;
  while ((match = regex.exec(command)) !== null) {
    args[match[1]] = match[2];
  }

  // Validate presence of required params
  if (
    !args.x ||
    !args.y ||
    !args.c ||
    isNaN(Number(args.x)) ||
    isNaN(Number(args.y))
  ) {
    throw new Error("Missing or invalid parameters");
  }

  // Sanitize color param with simple escape and length limit
  let pcolor = escapeHtml(args.c);
  if (pcolor.length > 20) {
    pcolor = pcolor.slice(0, 20); // limit length to prevent abuse
  }

  return {
    px: Number(args.x),
    py: Number(args.y),
    pcolor,
  };
}

async function placePixel(
  supabase: SupabaseClient,
  command: string
): Promise<{ error: string | null }> {
  try {
    const { px, py, pcolor } = parsePlaceCommand(command);

    const { error } = await supabase.rpc("PlacePixel", { px, py, pcolor });
    return { error: error ? error.message : null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export async function placePixelsBatch(
  supabase: SupabaseClient,
  obj: Record<string, string>
): Promise<{ error: string | null }> {
  try {
    const keys = Object.keys(obj);
    const batchSize = 1000;
    let errorMessage: string | null = null;

    for (let i = 0; i < keys.length; i += batchSize) {
      const chunkKeys = keys.slice(i, i + batchSize);
      const chunk: Record<string, string> = {};

      for (const k of chunkKeys) {
        // simple key check like "x:y"
        if (!/^\d+:\d+$/.test(k)) continue;
        let color = obj[k].trim();
        if (color.length > 20) color = color.slice(0, 20);
        chunk[k] = color;
      }

      if (Object.keys(chunk).length === 0) continue;

      const { error } = await supabase.rpc("place_pixels_batch", {
        pixels: chunk,
      });
      if (error) {
        errorMessage = error.message;
        break;
      }
    }

    return { error: errorMessage };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}
export default placePixel;
