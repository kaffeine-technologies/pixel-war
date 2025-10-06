import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

type PixelCanvasProps = {
  width: number;
  height: number;
  pixelSize?: number;
  pixels: Map<string, string>;
};

const PixelCanvas: React.FC<PixelCanvasProps> = ({
  width,
  height,
  pixelSize = 8,
  pixels,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursorCoord, setCursorCoord] = useState<{ x: number; y: number } | null>(
    null
  );
  const [cursorPos, setCursorPos] = useState<{ left: number; top: number } | null>(
    null
  );
  const { t } = useTranslation();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width * pixelSize;
    canvas.height = height * pixelSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pixels.forEach((color, key) => {
      const [xStr, yStr] = key.split(":");
      const x = Number(xStr);
      const y = Number(yStr);
      if (isNaN(x) || isNaN(y)) return;

      ctx.fillStyle = color;
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    });

    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * pixelSize, 0);
      ctx.lineTo(x * pixelSize, height * pixelSize);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * pixelSize);
      ctx.lineTo(width * pixelSize, y * pixelSize);
      ctx.stroke();
    }
  }, [width, height, pixelSize, pixels]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / pixelSize);
      const y = Math.floor((e.clientY - rect.top) / pixelSize);

      if (x >= 0 && x < width && y >= 0 && y < height) {
        setCursorCoord({ x, y });

        // Position floating box, adjust so it stays inside container
        if (containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          let left = e.clientX - containerRect.left + 15; // shift right
          let top = e.clientY - containerRect.top + 15; // shift down

          // Clamp horizontally
          const maxLeft = containerRect.width - 100; // box width approx 90-100px
          if (left > maxLeft) left = maxLeft;

          // Clamp vertically
          const maxTop = containerRect.height - 30; // box height approx 25-30px
          if (top > maxTop) top = maxTop;

          setCursorPos({ left, top });
        }
      } else {
        setCursorCoord(null);
        setCursorPos(null);
      }
    },
    [width, height, pixelSize]
  );

  const handleMouseLeave = () => {
    setCursorCoord(null);
    setCursorPos(null);
  };

  return (
    <div
      className="relative select-none inline-block"
      ref={containerRef}
      style={{
        width: width * pixelSize,
        height: height * pixelSize + 30, // extra for top coordinates display
      }}
    >
      <div className="mb-2 text-white font-mono select-none">
        {cursorCoord
          ? `${t("canvas.cursorInfoPrefix")}${cursorCoord.x}${t(
              "canvas.cursorInfoSeparator"
            )}${cursorCoord.y}`
          : t("canvas.cursorInfoPlaceholder", "Move cursor over the canvas to see coordinates")}
      </div>

      <canvas
        ref={canvasRef}
        className="bg-gray-800 cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          imageRendering: "pixelated",
          width: width * pixelSize,
          height: height * pixelSize,
          display: "block",
          userSelect: "none",
        }}
      />

      {cursorPos && cursorCoord && (
        <div
          className="absolute bg-black bg-opacity-75 text-white text-xs rounded px-2 py-1 pointer-events-none select-none shadow-lg font-mono"
          style={{
            left: cursorPos.left,
            top: cursorPos.top,
            width: 90,
            whiteSpace: "nowrap",
            zIndex: 10,
          }}
        >
          {`X: ${cursorCoord.x}, Y: ${cursorCoord.y}`}
        </div>
      )}
    </div>
  );
};

export default PixelCanvas;
