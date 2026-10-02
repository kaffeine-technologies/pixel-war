// PixelCanvas.tsx (responsive changes)
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

type PixelCanvasProps = {
  width: number;
  height: number;
  pixelSize?: number;
  // RGBA bytes of the cells, row by row
  board: Uint8ClampedArray<ArrayBuffer>;
  // Changes when board is updated in place
  version: number;
};

const gridColor = "rgba(255, 255, 255, 0.2)";

const PixelCanvas: React.FC<PixelCanvasProps> = ({
  width,
  height,
  pixelSize = 8,
  board,
  version,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  // One canvas pixel per cell, scaled up by CSS: the grid and the hover glow
  // are separate elements, so neither is redrawn with the board
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    // Still the board of the previous canvas: wait for the new one
    if (board.length !== width * height * 4)
      return ctx.clearRect(0, 0, width, height);
    ctx.putImageData(new ImageData(board, width, height), 0, 0);
  }, [width, height, board, version]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / responsiveSize);
      const y = Math.floor((e.clientY - rect.top) / responsiveSize);

      if (x >= 0 && x < width && y >= 0 && y < height) {
        setCursorCoord((prev) =>
          prev && prev.x === x && prev.y === y ? prev : { x, y }
        );
        // In viewport coordinates: the board may be scrolled
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        setCursorPos({
          left: Math.min(e.clientX + 15, viewportWidth - 130),
          top: Math.min(e.clientY + 15, viewportHeight - 30),
        });
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

  const boardWidth = width * responsiveSize;
  const boardHeight = height * responsiveSize;

  return (
    <div
      className="relative select-none inline-block overflow-auto"
      style={{ maxWidth: "100%" }}
    >
      {/* Both texts share one cell, so the width doesn't change on hover */}
      <div className="sticky left-0 mb-2 grid text-white font-mono select-none text-xs sm:text-sm">
        <span
          className={`col-start-1 row-start-1 ${cursorCoord ? "invisible" : ""}`}
        >
          {t("canvas.cursorInfoPlaceholder")}
        </span>
        {cursorCoord && (
          <span className="col-start-1 row-start-1">
            {`${t("canvas.cursorInfoPrefix")}${cursorCoord.x}${t(
              "canvas.cursorInfoSeparator"
            )}${cursorCoord.y}`}
          </span>
        )}
      </div>

      <div className="relative" style={{ width: boardWidth, height: boardHeight }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="bg-gray-900 cursor-crosshair block"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            imageRendering: "pixelated",
            width: boardWidth,
            height: boardHeight,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
            backgroundSize: `${responsiveSize}px ${responsiveSize}px`,
            boxShadow: `inset -1px -1px 0 ${gridColor}`,
          }}
        />
        {/* Glow effect on hovered pixel */}
        {cursorCoord && (
          <div
            className="absolute pointer-events-none border-2 border-cyan-400"
            style={{
              left: cursorCoord.x * responsiveSize,
              top: cursorCoord.y * responsiveSize,
              width: responsiveSize,
              height: responsiveSize,
              boxShadow: `0 0 ${responsiveSize}px cyan`,
            }}
          />
        )}
      </div>

      {cursorPos && cursorCoord && (
        <div
          className="fixed bg-black bg-opacity-75 text-white text-xs rounded px-2 py-1 pointer-events-none select-none shadow-lg font-mono"
          style={{
            left: cursorPos.left,
            top: cursorPos.top,
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
