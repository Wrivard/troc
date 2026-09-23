export interface CoverFraming {
  x: number;
  y: number;
  zoom: number;
}
export const centeredFraming: CoverFraming = { x: 50, y: 50, zoom: 1 };
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export function boundedFraming(value: CoverFraming): CoverFraming {
  return {
    x: clamp(value.x, 0, 100),
    y: clamp(value.y, 0, 100),
    zoom: clamp(value.zoom, 1, 3),
  };
}
/** Percentage overflow alignment: 0 shows leading edge, 100 trailing edge.
 * Dimensions are browser-decoded (including supported EXIF orientation).
 * Cover then zoom; the image always covers the entire frame without stretching.
 */
export function coverGeometry(
  width: number,
  height: number,
  ratio: number,
  framing: CoverFraming,
) {
  if (
    ![width, height, ratio].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  )
    throw new Error("Invalid cover geometry");
  const f = boundedFraming(framing);
  const scale = Math.max(ratio / width, 1 / height) * f.zoom;
  const w = width * scale,
    h = height * scale;
  return {
    width: (w / ratio) * 100,
    height: h * 100,
    left: ((ratio - w) / ratio) * f.x,
    top: (1 - h) * f.y,
  };
}
export interface CoverImageRules {
  maxBytes: number;
  minWidth: number;
  minHeight: number;
  maxPixels: number;
  maxSide: number;
}
export const demoCoverRules: CoverImageRules = {
  maxBytes: 10 * 1024 * 1024,
  minWidth: 800,
  minHeight: 320,
  maxPixels: 40_000_000,
  maxSide: 10000,
};
export function validateCoverFile(
  file: Pick<File, "type" | "size">,
  rules: CoverImageRules,
): "type" | "size" | null {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return "type";
  return file.size <= 0 || file.size > rules.maxBytes ? "size" : null;
}
export function validateCoverDimensions(
  width: number,
  height: number,
  rules: CoverImageRules,
): "dimensions" | null {
  return !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < rules.minWidth ||
    height < rules.minHeight ||
    width > rules.maxSide ||
    height > rules.maxSide ||
    width * height > rules.maxPixels
    ? "dimensions"
    : null;
}
