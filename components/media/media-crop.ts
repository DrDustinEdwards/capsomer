// The crop editor's arithmetic (media-crop.react.tsx), pure so it can be tested without a canvas: the
// shapes it offers, a rectangle kept inside the picture at a ratio, the largest centered one, and the new
// file's name. Ported from Carrel's crop dialog.

export type CropRect = { x: number; y: number; w: number; h: number };

export const CROP_SHAPES = [
  { value: "free", label: "Free" },
  { value: "original", label: "As the original" },
  { value: "1:1", label: "Square, 1:1" },
  { value: "4:3", label: "4:3" },
  { value: "3:2", label: "3:2" },
  { value: "16:9", label: "Wide, 16:9" },
  { value: "4:5", label: "Tall, 4:5" },
];

// The types the crop editor opens and writes back: rasters a browser's canvas exports. Never an SVG,
// which served from the host's own origin would be script running as the host.
export const CROPPABLE: readonly string[] = ["image/jpeg", "image/png", "image/webp"];

// A content type without its parameters, lower case.
export function bareType(type: string): string {
  return (type.split(";")[0] ?? "").trim().toLowerCase();
}

export function ratioOf(shape: string, width: number, height: number): number | null {
  if (shape === "free") return null;
  if (shape === "original") return width / height;
  const [a, b] = shape.split(":").map(Number);
  return a && b ? a / b : null;
}

// A rectangle kept inside the picture, whole pixels, at least 1 by 1, and at the ratio when one is set.
export function fitRect(r: CropRect, width: number, height: number, ratio: number | null): CropRect {
  let w = Math.max(1, Math.min(width, Math.round(r.w)));
  let h = Math.max(1, Math.min(height, Math.round(r.h)));
  if (ratio) {
    if (w / h > ratio) w = Math.max(1, Math.round(h * ratio));
    else h = Math.max(1, Math.round(w / ratio));
    if (h > height) {
      h = height;
      w = Math.max(1, Math.round(h * ratio));
    }
  }
  const x = Math.min(Math.max(0, Math.round(r.x)), width - w);
  const y = Math.min(Math.max(0, Math.round(r.y)), height - h);
  return { x, y, w, h };
}

// The largest centered rectangle at the ratio, or the whole picture.
export function centered(width: number, height: number, ratio: number | null): CropRect {
  if (!ratio) return { x: 0, y: 0, w: width, h: height };
  const w = Math.min(width, height * ratio);
  const h = w / ratio;
  return fitRect({ x: (width - w) / 2, y: (height - h) / 2, w, h }, width, height, ratio);
}

// The new file's name: the old one with "-crop" and the extension of what the canvas wrote.
export function cropName(name: string, type: string): string {
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  return `${name.replace(/\.[a-z0-9]+$/i, "")}-crop.${ext}`;
}

// A focal point as a site stores it ("XxY", each 0 to 1 from the top left) as percents for a form;
// the center when there is none.
export function focusPercents(focus: string | null | undefined): { x: number; y: number } {
  const m = focus ? /^([\d.]+)x([\d.]+)$/.exec(focus) : null;
  return m ? { x: Math.round(Number(m[1]) * 1000) / 10, y: Math.round(Number(m[2]) * 1000) / 10 } : { x: 50, y: 50 };
}
