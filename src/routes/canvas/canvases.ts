import { SupabaseClient } from "@supabase/supabase-js";

// Mirrors the public.canvas_state enum
export type CanvasState = "playable" | "readonly" | "hidden";

export type Canvas = {
  id: number;
  name: string;
  created_at: string;
  active: boolean;
  width: number;
  height: number;
  state: CanvasState;
};

// Visible canvases, most recent first
export async function fetchVisibleCanvases(
  supabase: SupabaseClient
): Promise<{ data: Canvas[]; error: string | null }> {
  const { data, error } = await supabase
    .from("canvas")
    .select("id, name, created_at, active, width, height, state")
    .neq("state", "hidden")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  return {
    data: (data as Canvas[] | null) ?? [],
    error: error ? error.message : null,
  };
}

// The canvas loaded by default: the most recent active one, else the most recent one
export function pickDefaultCanvas(canvases: Canvas[]): Canvas | undefined {
  return canvases.find((canvas) => canvas.active) ?? canvases[0];
}
