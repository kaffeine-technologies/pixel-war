import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import LanguageSwitcher from "@/components/molecules/change-lang";
import { useTranslation } from "react-i18next";
import { supabase } from "@/hooks/supabase"; // <-- your shared client import
import placePixel from "./place-pixel";
import PixelCanvas from "~/components/organisms/pixel-canvas";

const CanvasPage: React.FC = () => {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const [command, setCommand] = useState("");
  const { t } = useTranslation();

  const [pixels, setPixels] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let isMounted = true;

    async function fetchInitialPixels() {
      const { data, error } = await supabase.from("pixel").select();
      if (error) {
        console.error("Failed to load initial pixels:", error);
        return;
      }
      if (!isMounted) return;
      const map = new Map<string, string>();
      data?.forEach((px) => {
        map.set(`${px.x}:${px.y}`, px.color);
      });
      setPixels(map);
    }
    fetchInitialPixels();

    const channel = supabase
      .channel("pixel_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pixel" },
        (payload) => {
          const px = payload.new;
          console.log("INSERT", px);
          setPixels((prev) => {
            const next = new Map(prev);
            next.set(`${px.x}:${px.y}`, px.color);
            return new Map(next); // **Create a new Map instance again here to ensure React re-renders**
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pixel" },
        (payload) => {
          const px = payload.new;
          console.log("UPDATE", px);
          setPixels((prev) => {
            const next = new Map(prev);
            next.set(`${px.x}:${px.y}`, px.color);
            return new Map(next); // **Create a new Map instance again here to ensure React re-renders**
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "pixel" },
        (payload) => {
          const px = payload.old;
          console.log("DELETE", px);
          setPixels((prev) => {
            const next = new Map(prev);
            next.set(`${px.x}:${px.y}`, px.color);
            return new Map(next); // **Create a new Map instance again here to ensure React re-renders**
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    console.log("Pixels updated:", pixels);
  }, [pixels]);

  const handleQuit = () => {
    navigate("/");
  };

  const handleHelpToggle = () => {
    setShowHelp((prev) => !prev);
  };

  const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommand(e.target.value);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: implement command handling, input clearing for now
    placePixel(supabase, command);
    setCommand("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-900 via-sky-700 to-indigo-900 text-white flex flex-col">
      {/* Top Menu */}
      <div className="flex items-center justify-between bg-blue-950 px-6 py-4 shadow-lg sticky top-0 z-50">
        <h1 className="text-4xl font-extrabold font-mono tracking-wide text-white drop-shadow-lg animate-blue-glow select-none cursor-default">
          {t("canvas.menuTitle")}
        </h1>

        <div className="flex items-center space-x-6">
          <LanguageSwitcher />

          <button
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md shadow-md font-semibold transition-transform active:scale-95"
            onClick={handleQuit}
            type="button"
          >
            {t("canvas.quit")}
          </button>

          <button
            aria-label={t("canvas.helpTitle")}
            onClick={handleHelpToggle}
            title={t("canvas.helpTitle")}
            className="text-2xl font-bold bg-blue-700 hover:bg-blue-800 rounded-full w-10 h-10 flex items-center justify-center shadow-md transition-transform active:scale-95"
            type="button"
          >
            ?
          </button>
        </div>
      </div>

      {/* Canvas & Input */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 space-y-6">
        <PixelCanvas width={101} height={101} pixelSize={8} pixels={pixels} />


        <form
          onSubmit={handleCommandSubmit}
          className="w-full max-w-3xl bg-blue-800 rounded-lg p-4 font-mono text-white shadow-lg"
        >
          <label htmlFor="commandInput" className="sr-only">
            {t("canvas.helpTitle")}
          </label>
          <input
            id="commandInput"
            type="text"
            value={command}
            onChange={handleCommandChange}
            placeholder={t("canvas.commandPlaceholder")}
            className="w-full bg-blue-900 rounded-md px-4 py-3 border border-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            autoComplete="off"
          />
        </form>
      </main>

      {/* Help Modal */}
      {showHelp && (
        <div
          onClick={handleHelpToggle}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-blue-900 rounded-lg max-w-xl p-6 shadow-xl"
          >
            <h2 className="text-2xl font-semibold mb-4">
              {t("canvas.helpTitle")}
            </h2>
            <ul className="list-disc ml-5 space-y-2">
              {(t("canvas.helpItems", { returnObjects: true }) as string[]).map(
                (item, idx) => (
                  <li key={idx}>{item}</li>
                )
              )}
            </ul>
            <button
              onClick={handleHelpToggle}
              className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md shadow font-semibold"
              type="button"
            >
              {t("canvas.helpClose")}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blueGlow {
          0%, 100% {
            text-shadow:
              0 0 8px #38bdf8,
              0 0 20px #0ea5e9,
              0 0 30px #2563eb,
              0 0 40px #1d4ed8;
          }
          50% {
            text-shadow:
              0 0 12px #60a5fa,
              0 0 24px #3b82f6,
              0 0 36px #2563eb,
              0 0 48px #1e40af;
          }
        }
        .animate-blue-glow {
          animation: blueGlow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default CanvasPage;
