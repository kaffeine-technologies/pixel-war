// CanvasPage.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { supabase } from "@/hooks/supabase";
import placePixel, { placePixelsBatch } from "./place-pixel";
import { type Canvas, fetchVisibleCanvases, pickDefaultCanvas } from "./canvases";
import { colorToRgba } from "~/utils/color";
import PixelCanvas from "~/components/organisms/pixel-canvas";
import CanvasTopMenu from "~/components/organisms/canvas-topbar";

const CanvasPage: React.FC = () => {
  const navigate = useNavigate();
  const { canvasId } = useParams();
  const [showHelp, setShowHelp] = useState(false);
  const [command, setCommand] = useState("");
  const { t } = useTranslation();
  const [canvases, setCanvases] = useState<Canvas[] | null>(null);
  const [canvasesError, setCanvasesError] = useState(false);
  const canvasesLoad = useRef({ running: false, again: false });
  // The board as RGBA bytes, row by row, updated in place
  const boardRef = useRef(new Uint8ClampedArray(0));
  const [boardVersion, setBoardVersion] = useState(0);

  // "/canvas" shows the default canvas, "/canvas/:canvasId" a specific one
  const canvas = canvases
    ? canvasId
      ? canvases.find((c) => String(c.id) === canvasId)
      : pickDefaultCanvas(canvases)
    : undefined;
  const currentCanvasId = canvas?.id;
  const canvasWidth = canvas?.width;
  const canvasHeight = canvas?.height;
  const isPlayable = canvas?.state === "playable";

  // One request at a time: calls made meanwhile trigger one more load
  const loadCanvases = useCallback(async () => {
    const load = canvasesLoad.current;
    if (load.running) {
      load.again = true;
      return;
    }
    load.running = true;
    try {
      do {
        load.again = false;
        setCanvasesError(false);
        const { data, error } = await fetchVisibleCanvases(supabase);
        if (error) {
          console.error("Error fetching canvases:", error);
          setCanvasesError(true);
        } else {
          setCanvases(data);
        }
      } while (load.again);
    } finally {
      load.running = false;
    }
  }, []);

  useEffect(() => {
    loadCanvases();

    // New canvases, states and sizes show up when coming back to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") loadCanvases();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [loadCanvases]);

  useEffect(() => {
    if (
      currentCanvasId === undefined ||
      canvasWidth === undefined ||
      canvasHeight === undefined
    )
      return;
    let isMounted = true;
    let fetchSeq = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let retryDelay = 1000;
    // Changes received while a fetch is in flight, applied on top of its result
    let inFlight: Map<number, string | null> | null = null;
    // Changes not drawn yet, applied once per frame
    const pending = new Map<number, string | null>();
    let frame: number | undefined;
    boardRef.current = new Uint8ClampedArray(canvasWidth * canvasHeight * 4);
    setBoardVersion((v) => v + 1);

    const paint = (
      board: Uint8ClampedArray,
      index: number,
      color: string | null
    ) => {
      if (color === null) board.fill(0, index * 4, index * 4 + 4);
      else board.set(colorToRgba(color), index * 4);
    };

    const applyChange = (x: number, y: number, color: string | null) => {
      // The canvas grew since the list was loaded
      if (x >= canvasWidth || y >= canvasHeight) {
        loadCanvases();
        return;
      }
      const index = y * canvasWidth + x;
      inFlight?.set(index, color);
      pending.set(index, color);
      frame ??= requestAnimationFrame(() => {
        frame = undefined;
        pending.forEach((c, i) => paint(boardRef.current, i, c));
        pending.clear();
        setBoardVersion((v) => v + 1);
      });
    };

    // Retried with a growing delay: without a snapshot the board misses the
    // changes made meanwhile
    const retryLater = () => {
      retryTimer = setTimeout(fetchAllPixels, retryDelay);
      retryDelay = Math.min(retryDelay * 3, 30000);
    };

    async function fetchAllPixels() {
      clearTimeout(retryTimer);
      const seq = ++fetchSeq;
      const changes = new Map<number, string | null>();
      inFlight = changes;
      const { data, error } = await supabase.rpc("get_pixels_matrix", {
        pcanvas_id: currentCanvasId,
      });
      // A newer fetch has a newer snapshot
      if (!isMounted || seq !== fetchSeq) return;
      inFlight = null;
      if (error) {
        console.error("Error fetching pixel matrix:", error);
        return retryLater();
      }
      if (
        !Array.isArray(data) ||
        data.length !== canvasHeight ||
        data[0]?.length !== canvasWidth
      ) {
        // Hidden, deleted or resized since the list was loaded
        console.error("Invalid data:", data);
        loadCanvases();
        return retryLater();
      }
      retryDelay = 1000;

      const board = new Uint8ClampedArray(data.length * data[0].length * 4);

      data.forEach((row: (string | null)[], y: number) => {
        row.forEach((color, x) => {
          if (color && color !== "null") {
            // Skip null/placeholder pixels
            paint(board, y * row.length + x, color);
          }
        });
      });

      // Realtime changes received while fetching are newer than the snapshot,
      // and the ones not drawn yet are older or among them
      changes.forEach((color, index) => paint(board, index, color));
      pending.clear();
      boardRef.current = board;
      setBoardVersion((v) => v + 1);
    }

    const filter = `canvas_id=eq.${currentCanvasId}`;
    const channel = supabase
      .channel(`pixel_changes:${currentCanvasId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pixel", filter },
        (payload) => {
          const px = payload.new;
          applyChange(px.x, px.y, px.color);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pixel", filter },
        (payload) => {
          const px = payload.new;
          applyChange(px.x, px.y, px.color);
        }
      )
      .on(
        // Not filtered: check the canvas here. With RLS, payload.old only has
        // the id, so the deletion shows after a reload.
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "pixel" },
        (payload) => {
          const px = payload.old;
          if (Number(px.canvas_id) !== currentCanvasId) return;
          applyChange(px.x, px.y, null);
        }
      )
      .on("system", {}, (payload) => {
        // The database subscription is ready (also after a reconnect): reload
        // the board so the changes made before it are not missed
        if (payload?.extension === "postgres_changes" && payload?.status === "ok")
          fetchAllPixels();
      })
      .subscribe();

    // Show the board without waiting for Realtime
    fetchAllPixels();

    return () => {
      isMounted = false;
      clearTimeout(retryTimer);
      if (frame !== undefined) cancelAnimationFrame(frame);
      // Not removeChannel(): with no channel left it disconnects the shared
      // socket, and a channel subscribed in the next 100 ms never connects
      channel.unsubscribe();
    };
  }, [currentCanvasId, canvasWidth, canvasHeight, loadCanvases]);

  // The canvas may have been made read-only, hidden or resized since the list
  // was loaded
  const handlePlaceError = (label: string, error: string | null) => {
    if (!error) return;
    console.error(label, error);
    if (/not playable|does not exist|outside canvas/.test(error)) loadCanvases();
  };

  const handleQuit = () => navigate("/");
  const handleHelpToggle = () => setShowHelp((p) => !p);
  const handleSelectCanvas = (id: number) => navigate(`/canvas/${id}`);
  const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setCommand(e.target.value);
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canvas || !isPlayable) return;

    const trimmedCommand = command.trim().toLowerCase();

    switch (true) {
      case trimmedCommand.startsWith("/json"): {
        try {
          const obj = JSON.parse(command.replace(/^\/json\s*/i, ""));
          placePixelsBatch(supabase, canvas, obj).then((res) =>
            handlePlaceError("Batch error:", res.error)
          );
        } catch (err) {
          console.error("Invalid JSON:", err);
        }
        break;
      }

      case trimmedCommand.startsWith("/nuke"): {
        alert(t("canvas.nukeCommand"));
        window.open("/nuke.mp4");
        break;
      }

      default: {
        placePixel(supabase, canvas.id, command).then((res) =>
          handlePlaceError("Place error:", res.error)
        );
        break;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-900 via-sky-700 to-indigo-900 text-white flex flex-col">
      <CanvasTopMenu
        onQuit={handleQuit}
        onHelpToggle={handleHelpToggle}
        canvases={canvases ?? []}
        selectedCanvasId={currentCanvasId}
        onSelectCanvas={handleSelectCanvas}
        t={t}
      />

      {/* Canvas with scroll on mobile */}
      <main className="flex-grow flex flex-col items-center justify-center p-3 sm:p-6 space-y-6 overflow-x-auto">
        {!canvases && canvasesError ? (
          <div className="flex flex-col items-center space-y-4 text-center">
            <p className="font-mono">{t("canvas.loadError")}</p>
            <button
              onClick={loadCanvases}
              className="px-3 py-1 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 rounded-md shadow font-semibold"
            >
              {t("canvas.retry")}
            </button>
          </div>
        ) : !canvases ? (
          <p className="font-mono">{t("canvas.loading")}</p>
        ) : !canvas ? (
          <div className="flex flex-col items-center space-y-4 text-center">
            <p className="font-mono">
              {canvases.length > 0 ? t("canvas.notFound") : t("canvas.noCanvas")}
            </p>
            {canvases.length > 0 && (
              <button
                onClick={() => navigate("/canvas")}
                className="px-3 py-1 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 rounded-md shadow font-semibold"
              >
                {t("canvas.backToDefault")}
              </button>
            )}
          </div>
        ) : (
          <>
            <PixelCanvas
              width={canvas.width}
              height={canvas.height}
              board={boardRef.current}
              version={boardVersion}
            />
            <form
              onSubmit={handleCommandSubmit}
              className="w-full max-w-3xl bg-blue-800 rounded-lg p-3 sm:p-4 font-mono text-white shadow-lg"
            >
              {!isPlayable && (
                <p role="status" className="mb-2 text-sm text-cyan-200">
                  {t("canvas.readonlyNotice")}
                </p>
              )}
              <input
                id="commandInput"
                type="text"
                value={command}
                onChange={handleCommandChange}
                disabled={!isPlayable}
                placeholder={t("canvas.commandPlaceholder")}
                className="w-full bg-blue-900 rounded-md px-3 py-2 sm:px-4 sm:py-3 border border-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed"
                autoComplete="off"
              />
            </form>
          </>
        )}
      </main>

      {showHelp && (
        <div
          onClick={handleHelpToggle}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-blue-900 rounded-lg max-w-xl p-4 sm:p-6 shadow-xl"
          >
            <h2 className="text-lg sm:text-2xl font-semibold mb-4">
              {t("canvas.helpTitle")}
            </h2>
            <ul className="list-disc ml-5 space-y-2 text-sm sm:text-base">
              {(t("canvas.helpItems", { returnObjects: true }) as string[]).map(
                (item, idx) => (
                  <li key={idx}>{item}</li>
                )
              )}
            </ul>
            <button
              onClick={handleHelpToggle}
              className="mt-4 sm:mt-6 px-3 py-1 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 rounded-md shadow font-semibold"
            >
              {t("canvas.helpClose")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasPage;
