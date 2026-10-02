const hexColor = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const hexBytes = new Uint8ClampedArray(4);
// Invalid colors are drawn in the column default
const black = new Uint8ClampedArray([0, 0, 0, 255]);
const cache = new Map<string, Uint8ClampedArray | null>();
let context: CanvasRenderingContext2D | null = null;

// RGBA bytes of a CSS color, or null when the canvas can't parse it.
// The result may be reused by the next call: copy it.
function resolve(color: string): Uint8ClampedArray | null {
  if (hexColor.test(color)) {
    const hex =
      color.length === 4 ? color.replace(/[0-9a-f]/gi, "$&$&") : color;
    const value = parseInt(hex.slice(1), 16);
    hexBytes[0] = value >> 16;
    hexBytes[1] = (value >> 8) & 255;
    hexBytes[2] = value & 255;
    hexBytes[3] = 255;
    return hexBytes;
  }

  const cached = cache.get(color);
  if (cached !== undefined) return cached;

  // Other colors (names, rgb(), hsl()...) are resolved by a 1x1 canvas
  if (!context) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    context = canvas.getContext("2d", { willReadFrequently: true });
  }
  if (!context) return null;

  // An invalid color leaves fillStyle unchanged: try it on two different ones
  context.fillStyle = "#000000";
  context.fillStyle = color;
  const fromBlack = context.fillStyle;
  context.fillStyle = "#ffffff";
  context.fillStyle = color;
  let rgba: Uint8ClampedArray | null = null;
  if (context.fillStyle === fromBlack) {
    context.clearRect(0, 0, 1, 1);
    context.fillRect(0, 0, 1, 1);
    rgba = context.getImageData(0, 0, 1, 1).data;
  }

  // Colors come from the players: keep the cache bounded
  if (cache.size >= 4096) cache.clear();
  cache.set(color, rgba);
  return rgba;
}

export function isValidColor(color: string): boolean {
  return resolve(color) !== null;
}

// The result may be reused by the next call: copy it.
export function colorToRgba(color: string): Uint8ClampedArray {
  return resolve(color) ?? black;
}
