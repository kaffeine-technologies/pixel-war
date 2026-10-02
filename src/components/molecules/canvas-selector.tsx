import { useTranslation } from "react-i18next";
import type { Canvas } from "~/routes/canvas/canvases";

type CanvasSelectorProps = {
  canvases: Canvas[];
  selectedId?: number;
  onSelect: (id: number) => void;
};

export default function CanvasSelector({
  canvases,
  selectedId,
  onSelect,
}: CanvasSelectorProps) {
  const { t } = useTranslation();

  return (
    <select
      aria-label={t("canvas.selectLabel")}
      title={t("canvas.selectLabel")}
      value={selectedId ?? ""}
      onChange={(e) => onSelect(Number(e.target.value))}
      className="bg-blue-800 text-white text-sm rounded-md px-2 py-1 border border-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full lg:w-auto lg:max-w-64"
    >
      {selectedId === undefined && (
        <option value="" disabled>
          {t("canvas.selectLabel")}
        </option>
      )}
      {canvases.map((canvas) => (
        <option key={canvas.id} value={canvas.id}>
          {canvas.name +
            (canvas.state === "readonly"
              ? ` · ${t("canvas.readonlyBadge")}`
              : "")}
        </option>
      ))}
    </select>
  );
}
