// Cropping one image, in the browser (MediaInspector's Crop button; ported from Carrel's crop dialog).
// It reads the file's own bytes from `src`, which must be on the page's own origin so the canvas can be
// exported (the host serves them: MediaLibrary's `bytesHref`), draws them on a canvas, and cuts the chosen
// rectangle at full resolution. The result is handed to `onSave` as a new file, or, where the site replaces
// files and keeps any size, in place of this one. Drag on the picture to choose; the four fields say the
// same in pixels and are the keyboard's way in. The picture is drawn on a canvas, not shown from a blob:
// address, so an app's image policy need allow only its own sites. This module is loaded only when Crop is
// first pressed (React.lazy in media.react.tsx), so a library page does not carry it.
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Alert } from "../banner/banner.react.tsx";
import { Button } from "../button/button.react.tsx";
import { Dialog, DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../dialog/dialog.react.tsx";
import { Field } from "../field/field.react.tsx";
import { Select } from "../select/select.react.tsx";
import { CROP_SHAPES, centered, cropName, fitRect, ratioOf, type CropRect } from "./media-crop.ts";

// The width the picture is drawn at, at most; the crop itself is cut from the full-size original.
const VIEW_WIDTH = 640;

export interface MediaCropProps {
  name: string;
  // The file's own bytes, on the page's own origin.
  src: string;
  // The crop may be saved as a new file (an upload) and in place of this one (a replace).
  asNew: boolean;
  inPlace: boolean;
  // The site refuses a replace of another size, so a crop is never saved in place: said up front.
  keepsSize?: boolean;
  // Saves the crop: reject with an Error that says why, and the dialog shows it and stays open.
  onSave: (file: File, how: "new" | "replace") => Promise<void>;
  open: boolean;
  // The Crop button, which focus returns to.
  opener: HTMLElement | null;
  onClose: () => void;
}

export default function MediaCrop({ name, src, asNew, inPlace, keepsSize, onSave, open, opener, onClose }: MediaCropProps) {
  const [image, setImage] = useState<{ bitmap: ImageBitmap; type: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shape, setShape] = useState("free");
  const [rect, setRect] = useState<CropRect>({ x: 0, y: 0, w: 1, h: 1 });
  const [saving, setSaving] = useState<"new" | "replace" | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ mode: "draw" | "move"; startX: number; startY: number; from: CropRect } | null>(null);

  const width = image?.bitmap.width ?? 1;
  const height = image?.bitmap.height ?? 1;
  const ratio = ratioOf(shape, width, height);
  const scale = Math.min(1, VIEW_WIDTH / width);

  // Reads the file once the dialog opens.
  useEffect(() => {
    if (!open || image) return;
    let canceled = false;
    (async () => {
      const response = await fetch(src);
      if (!response.ok) throw new Error(`The file did not open (${response.status}).`);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);
      if (canceled) return;
      setImage({ bitmap, type: blob.type || "image/jpeg" });
      setRect({ x: 0, y: 0, w: bitmap.width, h: bitmap.height });
    })().catch((e: unknown) => !canceled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      canceled = true;
    };
  }, [open, image, src]);

  // Draws the picture, dims what the crop leaves out, and outlines the crop.
  useEffect(() => {
    const el = canvas.current;
    if (!el || !image) return;
    el.width = Math.round(width * scale);
    el.height = Math.round(height * scale);
    const ctx = el.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(image.bitmap, 0, 0, el.width, el.height);
    const r = { x: rect.x * scale, y: rect.y * scale, w: rect.w * scale, h: rect.h * scale };
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, el.width, r.y);
    ctx.fillRect(0, r.y + r.h, el.width, el.height - r.y - r.h);
    ctx.fillRect(0, r.y, r.x, r.h);
    ctx.fillRect(r.x + r.w, r.y, el.width - r.x - r.w, r.h);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(r.x + 1, r.y + 1, Math.max(0, r.w - 2), Math.max(0, r.h - 2));
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "#000000";
    ctx.strokeRect(r.x + 1, r.y + 1, Math.max(0, r.w - 2), Math.max(0, r.h - 2));
  }, [image, rect, scale, width, height]);

  const close = () => {
    onClose();
    image?.bitmap.close();
    setImage(null);
    setError(null);
    setShape("free");
  };

  const at = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: ((event.clientX - box.left) / box.width) * width, y: ((event.clientY - box.top) / box.height) * height };
  };

  const cut = async (): Promise<File> => {
    if (!image) throw new Error("The picture is not open yet.");
    const out = document.createElement("canvas");
    out.width = rect.w;
    out.height = rect.h;
    out.getContext("2d")?.drawImage(image.bitmap, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
    const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, image.type, 0.92));
    if (!blob) throw new Error("The browser could not write the crop.");
    return new File([blob], cropName(name, blob.type || image.type), { type: blob.type || image.type });
  };

  const save = async (how: "new" | "replace") => {
    setSaving(how);
    setError(null);
    try {
      await onSave(await cut(), how);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(null);
    }
  };

  const field = (label: string, key: keyof CropRect, max: number) => (
    <Field label={label}>
      <input
        className="cap-input"
        type="number"
        min={key === "w" || key === "h" ? 1 : 0}
        max={max}
        value={rect[key]}
        onChange={(event) => {
          const n = Number(event.target.value);
          if (!Number.isFinite(n)) return;
          const next = { ...rect, [key]: n };
          // With a ratio, a new width sets the height and a new height the width.
          if (ratio && key === "w") next.h = n / ratio;
          if (ratio && key === "h") next.w = n * ratio;
          setRect(fitRect(next, width, height, ratio));
        }}
      />
    </Field>
  );

  const notReady = !image ? "The picture is not open yet." : undefined;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()} placement="center" size="lg" returnTo={opener} aria-labelledby="cap-crop-title" className="cap-media-crop">
      <DialogHeader divider>
        <DialogTitle id="cap-crop-title">Crop {name}</DialogTitle>
        <DialogDescription>Drag on the picture to choose what to keep, or set it in pixels below. The crop is cut from the full-size file.</DialogDescription>
      </DialogHeader>
      <DialogBody>
        <div className="cap-media-crop-body">
          {keepsSize ? <p className="cap-media-note">This site takes a replacement only at the original's size, so a crop is saved as a new file and this one stays as it is.</p> : null}
          {error ? <Alert tone="crit">{error}</Alert> : null}
          {!image && !error ? <p className="cap-media-note">Opening the picture…</p> : null}
          {image ? (
            <>
              <canvas
                ref={canvas}
                className="cap-media-crop-canvas"
                role="img"
                aria-label={`${name}, ${width} by ${height} pixels, with the crop marked: ${rect.w} by ${rect.h} from ${rect.x} across and ${rect.y} down.`}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  const p = at(event);
                  const inside = p.x >= rect.x && p.x <= rect.x + rect.w && p.y >= rect.y && p.y <= rect.y + rect.h;
                  drag.current = { mode: inside ? "move" : "draw", startX: p.x, startY: p.y, from: rect };
                }}
                onPointerMove={(event) => {
                  const d = drag.current;
                  if (!d) return;
                  const p = at(event);
                  if (d.mode === "move") setRect(fitRect({ ...d.from, x: d.from.x + p.x - d.startX, y: d.from.y + p.y - d.startY }, width, height, null));
                  else setRect(fitRect({ x: Math.min(d.startX, p.x), y: Math.min(d.startY, p.y), w: Math.abs(p.x - d.startX), h: Math.abs(p.y - d.startY) }, width, height, ratio));
                }}
                onPointerUp={() => {
                  drag.current = null;
                }}
              />
              <div className="cap-media-crop-fields">
                <Field label="Shape">
                  <Select
                    value={shape}
                    onChange={(event) => {
                      const next = event.target.value;
                      setShape(next);
                      setRect(centered(width, height, ratioOf(next, width, height)));
                    }}
                    options={CROP_SHAPES}
                  />
                </Field>
                {field("Left (px)", "x", width - 1)}
                {field("Top (px)", "y", height - 1)}
                {field("Width (px)", "w", width)}
                {field("Height (px)", "h", height)}
              </div>
              {inPlace ? <p className="cap-media-note">Replace this file keeps its address, so every page that shows it shows the crop, and the original is gone from the site.</p> : null}
            </>
          ) : null}
        </div>
      </DialogBody>
      <DialogFooter align="between">
        <DialogClose part="cancel">Cancel</DialogClose>
        <span className="cap-media-crop-actions">
          {inPlace ? (
            <Button variant="danger" pending={saving === "replace"} disabledReason={notReady} onClick={() => void save("replace")}>
              Replace this file
            </Button>
          ) : null}
          {asNew ? (
            <Button variant="primary" pending={saving === "new"} disabledReason={notReady} onClick={() => void save("new")}>
              Save as a new file
            </Button>
          ) : null}
        </span>
      </DialogFooter>
    </Dialog>
  );
}
