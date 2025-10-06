// CanvasPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { supabase } from "@/hooks/supabase";
import placePixel, { placePixelsBatch } from "./place-pixel";
import PixelCanvas from "~/components/organisms/pixel-canvas";
import CanvasTopMenu from "~/components/organisms/canvas-topbar";

const CanvasPage: React.FC = () => {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const [command, setCommand] = useState("");
  const { t } = useTranslation();
  const [pixels, setPixels] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let isMounted = true;

    async function fetchAllPixels() {
      const { data, error } = await supabase.rpc("get_pixels_matrix");
      if (error) return console.error("Error fetching pixel matrix:", error);
      if (!data || !Array.isArray(data))
        return console.error("Invalid data:", data);

      const map = new Map<string, string>();

      data.forEach((row: (string | null)[], y: number) => {
        row.forEach((color, x) => {
          if (color && color !== "null") {
            // Skip null/placeholder pixels
            map.set(`${x}:${y}`, color);
          }
        });
      });

      if (isMounted) setPixels(map);
    }

    fetchAllPixels();

    const channel = supabase
      .channel("pixel_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pixel" },
        (payload) => {
          const px = payload.new;
          setPixels((prev) => {
            const next = new Map(prev);
            next.set(`${px.x}:${px.y}`, px.color);
            return new Map(next);
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pixel" },
        (payload) => {
          const px = payload.new;
          setPixels((prev) => {
            const next = new Map(prev);
            next.set(`${px.x}:${px.y}`, px.color);
            return new Map(next);
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "pixel" },
        (payload) => {
          const px = payload.old;
          setPixels((prev) => {
            const next = new Map(prev);
            next.delete(`${px.x}:${px.y}`);
            return new Map(next);
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleQuit = () => navigate("/");
  const handleHelpToggle = () => setShowHelp((p) => !p);
  const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setCommand(e.target.value);
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedCommand = command.trim().toLowerCase();

    switch (true) {
      case trimmedCommand.startsWith("/json"): {
        try {
          const obj = JSON.parse(command.replace(/^\/json\s*/i, ""));
          placePixelsBatch(supabase, obj).then((res) => {
            if (res.error) {
              console.error("Batch error:", res.error);
            }
          });
        } catch (err) {
          console.error("Invalid JSON:", err);
        }
        setCommand("");
        break;
      }

      case trimmedCommand.startsWith("/nuke"): {
        alert(t("canvas.nukeCommand"));
        window.open("/nuke.mp4");
        setCommand("");
        break;
      }

      default: {
        placePixel(supabase, command).then((res) => {
          if (res.error) console.error("Place error:", res.error);
        });
        setCommand("");
        break;
      }
    }

    setCommand("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-900 via-sky-700 to-indigo-900 text-white flex flex-col">
      <CanvasTopMenu
        onQuit={handleQuit}
        onHelpToggle={handleHelpToggle}
        t={t}
      />

      {/* Canvas with scroll on mobile */}
      <main className="flex-grow flex flex-col items-center justify-center p-3 sm:p-6 space-y-6 overflow-x-auto">
        <PixelCanvas width={101} height={101} pixels={pixels} />
        <form
          onSubmit={handleCommandSubmit}
          className="w-full max-w-3xl bg-blue-800 rounded-lg p-3 sm:p-4 font-mono text-white shadow-lg"
        >
          <input
            id="commandInput"
            type="text"
            value={command}
            onChange={handleCommandChange}
            placeholder={t("canvas.commandPlaceholder")}
            className="w-full bg-blue-900 rounded-md px-3 py-2 sm:px-4 sm:py-3 border border-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base"
            autoComplete="off"
          />
        </form>
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
