// PixelCanvas.tsx (responsive changes)
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
  const [cursorCoord, setCursorCoord] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [cursorPos, setCursorPos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const { t } = useTranslation();

  // Adjust pixelSize based on viewport width
  const [responsiveSize, setResponsiveSize] = useState(pixelSize);
  useEffect(() => {
    const updateSize = () => {
      if (window.innerWidth < 640) setResponsiveSize(4);
      else if (window.innerWidth < 1024) setResponsiveSize(6);
      else setResponsiveSize(pixelSize);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [pixelSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width * responsiveSize;
    canvas.height = height * responsiveSize;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pixels.forEach((color, key) => {
      const [xStr, yStr] = key.split(":");
      const x = Number(xStr);
      const y = Number(yStr);
      if (isNaN(x) || isNaN(y)) return;
      ctx.fillStyle = color;
      ctx.fillRect(
        x * responsiveSize,
        y * responsiveSize,
        responsiveSize,
        responsiveSize
      );
    });

    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * responsiveSize, 0);
      ctx.lineTo(x * responsiveSize, height * responsiveSize);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * responsiveSize);
      ctx.lineTo(width * responsiveSize, y * responsiveSize);
      ctx.stroke();
    }
  }, [width, height, responsiveSize, pixels]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / responsiveSize);
      const y = Math.floor((e.clientY - rect.top) / responsiveSize);

      if (x >= 0 && x < width && y >= 0 && y < height) {
        setCursorCoord({ x, y });

        if (containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          let left = e.clientX - containerRect.left + 15;
          let top = e.clientY - containerRect.top + 15;
          if (left > containerRect.width - 100)
            left = containerRect.width - 100;
          if (top > containerRect.height - 30) top = containerRect.height - 30;
          setCursorPos({ left, top });
        }
      } else {
        setCursorCoord(null);
        setCursorPos(null);
      }
    },
    [width, height, responsiveSize]
  );

  const handleMouseLeave = () => {
    setCursorCoord(null);
    setCursorPos(null);
  };

  return (
    <div
      className="relative select-none inline-block overflow-auto"
      ref={containerRef}
      style={{ maxWidth: "100%" }}
    >
      <div className="mb-2 text-white font-mono select-none text-xs sm:text-sm">
        {cursorCoord
          ? `${t("canvas.cursorInfoPrefix")}${cursorCoord.x}${t(
              "canvas.cursorInfoSeparator"
            )}${cursorCoord.y}`
          : t("canvas.cursorInfoPlaceholder")}
      </div>

      <canvas
        ref={canvasRef}
        className="bg-gray-800 cursor-crosshair block"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          imageRendering: "pixelated",
          width: width * responsiveSize,
          height: height * responsiveSize,
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
