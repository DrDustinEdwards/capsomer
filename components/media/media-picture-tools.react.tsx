import { type MouseEvent, Suspense, lazy, useState } from "react";
import { Disclosure } from "../disclosure/disclosure.react.tsx";
import type { MediaRecord } from "./media.ts";
import { MediaFocus, focusWords } from "./media-focus.react.tsx";
import { Ident } from "./media-inspector-parts.react.tsx";
import type { MediaInspectorProps } from "./media.react.tsx";

// The crop editor, loaded the first time Crop is pressed, so a library page does not carry it.
const MediaCrop = lazy(() => import("./media-crop.react.tsx"));

// The tools that change the picture: the focal point, crop, and replace, each folded away (they are
// used now and then, and open each is as tall as the rest of the inspector). In form mode each is its
// own form; inside the autosaving form (`nested`) each is a group whose button hands its fields to
// `onTool`, since a form cannot sit inside a form.
export function PictureTools({
  item,
  base,
  tools,
  action,
  Tool,
}: {
  item: MediaRecord;
  base: string;
  tools: NonNullable<MediaInspectorProps["tools"]>;
  action: string;
  Tool: NonNullable<MediaInspectorProps["Form"]>;
}) {
  const [cropOpen, setCropOpen] = useState(false);
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const ident = (intent: string) => <Ident item={item} intent={intent} />;
  const size =
    item.width && item.height ? `${item.width} by ${item.height} pixels` : "the size of this one";
  const crop = tools.crop;
  return (
    <div className="cap-media-section" data-cap-part="tools">
      {tools.focus && item.thumb ? (
        <Disclosure
          summary={
            <>
              Focal point <span className="cap-media-summary-note">{focusWords(item.focus)}</span>
            </>
          }
        >
          <MediaFocus
            key={`${item.key}:${item.version ?? ""}`}
            name={item.name}
            src={item.thumb}
            focus={item.focus}
            action={action}
            Form={Tool}
            ident={ident("focus")}
            base={base}
          />
        </Disclosure>
      ) : null}
      {crop || tools.replace ? (
        <Disclosure
          summary={
            crop && tools.replace
              ? "Crop or replace the file"
              : tools.replace
                ? "Replace the file"
                : "Crop"
          }
        >
          {crop ? (
            <div className="cap-media-tool" data-inline="">
              <button
                type="button"
                className="cap-btn"
                data-size="sm"
                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                  setOpener(e.currentTarget);
                  setCropOpen(true);
                }}
              >
                Crop<span className="cap-sr-only"> {item.name}</span>
              </button>
              <p className="cap-media-note">
                {tools.keepsSize
                  ? "Cut out part of the picture as a new file. This site takes a replacement only at the original's size, so a crop never replaces this one."
                  : `Cut out part of the picture, as a new file${crop.inPlace ? " or in place of this one" : ""}.`}
              </p>
              {opener ? (
                <Suspense fallback={null}>
                  <MediaCrop
                    name={item.name}
                    src={crop.src}
                    asNew={crop.asNew}
                    inPlace={crop.inPlace && !tools.keepsSize}
                    keepsSize={tools.keepsSize}
                    onSave={crop.onSave}
                    open={cropOpen}
                    opener={opener}
                    onClose={() => setCropOpen(false)}
                  />
                </Suspense>
              ) : null}
            </div>
          ) : null}
          {tools.replace ? (
            <Tool
              method="post"
              action={action}
              encType="multipart/form-data"
              className="cap-media-field-form cap-media-tool"
              aria-label="Replace the file"
              key={`replace:${item.key}:${item.version ?? ""}`}
            >
              {ident("replace")}
              <div className="cap-field">
                <label className="cap-field-label" htmlFor={`${base}-replace`}>
                  The new file
                </label>
                <p className="cap-field-help" id={`${base}-replace-help`}>
                  {tools.replace.hint}{" "}
                  {tools.keepsSize
                    ? `It must be ${size}: this site sizes its pages by them and refuses any other size. `
                    : ""}
                  It goes under the same address, so every page that shows this file shows the new
                  one, and the old one is gone from the site. Alt text, caption and tags stay; the
                  focal point is cleared. Readers who already loaded the old picture may see it
                  until their browser's cache expires.
                </p>
                <input
                  className="cap-input"
                  id={`${base}-replace`}
                  type="file"
                  name="file"
                  accept={tools.replace.accept}
                  required
                  aria-describedby={`${base}-replace-help`}
                />
              </div>
              <div className="cap-media-tool-actions">
                <button type="submit" className="cap-btn" data-size="sm" data-variant="danger">
                  Replace<span className="cap-sr-only"> {item.name}</span>
                </button>
              </div>
            </Tool>
          ) : null}
        </Disclosure>
      ) : null}
    </div>
  );
}

// A tool inside the autosaving form: a group, not a form, whose submit buttons hand its named fields
// (and the pressed button's) to the handler the ref holds.
export function nestedTool(handler: {
  current: ((form: FormData) => void) | undefined;
}): NonNullable<MediaInspectorProps["Form"]> {
  return function NestedTool({ children, className, "aria-label": label }) {
    return (
      <div
        className={className}
        role="group"
        aria-label={label}
        onClickCapture={(e) => {
          const button = (e.target as Element).closest("button");
          if (!button || button.type !== "submit") return;
          e.preventDefault();
          e.stopPropagation();
          const data = new FormData();
          for (const el of (e.currentTarget as HTMLElement).querySelectorAll<HTMLInputElement>(
            "input[name], textarea[name], select[name]",
          )) {
            if ((el.type === "checkbox" || el.type === "radio") && !el.checked) continue;
            if (el.type === "file") {
              if (!el.reportValidity()) return;
              for (const f of el.files ?? []) data.append(el.name, f);
            } else data.append(el.name, el.value);
          }
          if (button.name) data.append(button.name, button.value);
          handler.current?.(data);
          button.closest("details")?.removeAttribute("open");
        }}
      >
        {children}
      </div>
    );
  };
}
