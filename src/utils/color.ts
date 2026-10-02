const hexColor = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const hexBytes = new Uint8ClampedArray(4);
const cache = new Map<string, Uint8ClampedArray>();
let context: CanvasRenderingContext2D | null = null;

// Any CSS color to its RGBA bytes (transparent when invalid).
// The result may be reused by the next call: copy it.
export function colorToRgba(color: string): Uint8ClampedArray {
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

  let rgba = cache.get(color);
  if (rgba) return rgba;

  // Other colors (names, rgb(), hsl()...) are resolved by a 1x1 canvas
  if (!context) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    context = canvas.getContext("2d", { willReadFrequently: true });
  }
  if (!context) return new Uint8ClampedArray(4);
  context.clearRect(0, 0, 1, 1);
  // An invalid color keeps the previous fillStyle: it stays transparent
  context.fillStyle = "transparent";
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  rgba = context.getImageData(0, 0, 1, 1).data;

  // Colors come from the players: keep the cache bounded
  if (cache.size >= 4096) cache.clear();
  cache.set(color, rgba);
  return rgba;
}
