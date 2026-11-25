import { useState } from "react";
import { isImeEnter } from "../shortcuts/shortcuts.ts";
import { parseTags, type MediaFields, type MediaRecord } from "./media.ts";
import { Wrap } from "./media-inspector-parts.react.tsx";
import type { MediaInspectorProps } from "./media.react.tsx";

type Edit = (patch: Partial<MediaFields>, now?: boolean) => void;

// The removable tag chips, the field that adds one, then the suggestions: the autosaving form's tags.
function TagsEditor({
  base,
  item,
  fields,
  edit,
}: {
  base: string;
  item: MediaRecord;
  fields: MediaFields;
  edit: Edit;
}) {
  const [tagText, setTagText] = useState("");
  const addTag = (text: string) => {
    const add = parseTags(text);
    if (add.length)
      edit({ tags: [...fields.tags, ...add.filter((t) => !fields.tags.includes(t))] }, true);
    setTagText("");
  };
  return (
    <div className="cap-media-section" role="group" aria-labelledby={`${base}-tags-l`}>
      <span className="cap-field-label" id={`${base}-tags-l`}>
        Tags
      </span>
      <ul className="cap-media-tags" data-cap-part="tags">
        {fields.tags.map((t) => (
          <li key={t}>
            <button
              type="button"
              className="cap-chip"
              aria-label={`Remove tag ${t}`}
              onClick={() => edit({ tags: fields.tags.filter((x) => x !== t) }, true)}
            >
              {t} <span aria-hidden="true">×</span>
            </button>
          </li>
        ))}
      </ul>
      <input type="hidden" name="tags" value={fields.tags.join(", ")} data-cap-part="tags-value" />
      <label className="cap-sr-only" htmlFor={`${base}-tag-input`}>
        Add a tag
      </label>
      <input
        className="cap-input"
        id={`${base}-tag-input`}
        type="text"
        autoComplete="off"
        placeholder="Add a tag, then press Enter"
        data-cap-part="tag-input"
        value={tagText}
        onChange={(e) => setTagText(e.target.value)}
        onKeyDown={(e) => {
          // legacy-scan:keep ime-safe-enter-submit isImeEnter (shortcuts.ts) checks isComposing and keyCode 229; the scanner cannot follow it.
          if ((e.key === "Enter" && !isImeEnter(e.nativeEvent)) || e.key === ",") {
            e.preventDefault();
            addTag(tagText);
          }
        }}
        onBlur={() => tagText.trim() && addTag(tagText)}
      />
      <ul className="cap-media-tags" data-cap-part="suggestions">
        {(item.suggestedTags ?? [])
          .filter((t) => !fields.tags.includes(t))
          .map((t) => (
            <li key={t}>
              <button
                type="button"
                className="cap-chip"
                aria-label={`Add suggested tag ${t}`}
                onClick={() => edit({ tags: [...fields.tags, t] }, true)}
              >
                + {t}
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}

// The editable fields: alt text and Decorative (images), title and caption, and tags. In form mode
// each group is its own form (Wrap); otherwise they sit in the autosaving form.
export function InspectorFields({
  item,
  base,
  fields,
  edit,
  formMode,
  F,
  action,
  shows,
  firstRef,
}: {
  item: MediaRecord;
  base: string;
  fields: MediaFields;
  edit: Edit;
  formMode: boolean;
  F: NonNullable<MediaInspectorProps["Form"]>;
  action?: string;
  shows: { alt: boolean; title: boolean; caption: boolean; tags: boolean };
  firstRef: { current: HTMLElement | null };
}) {
  const img = item.kind === "image";
  return (
    <>
      {img && shows.alt ? (
        <Wrap
          on={formMode}
          F={F}
          action={action}
          label="Alt text"
          intent="alt"
          item={item}
          save="Save alt text"
        >
          <div className="cap-field" data-cap-part="alt-field">
            <label className="cap-field-label" htmlFor={`${base}-alt`}>
              Alt text
            </label>
            <textarea
              ref={(el) => {
                if (el && !el.disabled) firstRef.current = el;
              }}
              className="cap-input"
              id={`${base}-alt`}
              name="alt"
              data-cap-part="alt"
              rows={2}
              placeholder="Describe what the picture shows"
              aria-describedby={`${base}-alt-help`}
              disabled={fields.decorative && !formMode}
              value={fields.decorative ? "" : fields.alt}
              onChange={(e) => edit({ alt: e.target.value })}
            />
            <p className="cap-field-help" id={`${base}-alt-help`}>
              Leave out “image of”.
            </p>
          </div>
          <div className="cap-field" data-cap-part="decorative-field">
            <label className="cap-check">
              <input
                type="checkbox"
                name="decorative"
                data-cap-part="decorative"
                checked={fields.decorative}
                onChange={(e) =>
                  edit(
                    { decorative: e.target.checked, alt: e.target.checked ? "" : fields.alt },
                    true,
                  )
                }
              />{" "}
              Decorative image
            </label>
          </div>
        </Wrap>
      ) : !img ? (
        <p className="cap-field-help" data-cap-part="alt-document">
          A document takes no alt text. What a reader hears is the link text, and that lives in the
          post.
        </p>
      ) : null}
      {shows.title || shows.caption ? (
        <Wrap
          on={formMode}
          F={F}
          action={action}
          label={shows.title ? "Title and caption" : "Caption"}
          intent={shows.title ? "save-details" : "caption"}
          item={item}
          save={shows.title ? "Save title and caption" : "Save caption"}
        >
          {shows.title ? (
            <div className="cap-field">
              <label className="cap-field-label" htmlFor={`${base}-title-field`}>
                Title
              </label>
              <input
                className="cap-input"
                id={`${base}-title-field`}
                data-cap-part="title-field"
                name="title"
                type="text"
                autoComplete="off"
                value={fields.title}
                onChange={(e) => edit({ title: e.target.value })}
              />
            </div>
          ) : null}
          {shows.caption ? (
            <div className="cap-field">
              <label className="cap-field-label" htmlFor={`${base}-caption`}>
                Caption
              </label>
              <textarea
                className="cap-input"
                id={`${base}-caption`}
                data-cap-part="caption"
                name="caption"
                rows={2}
                value={fields.caption}
                onChange={(e) => edit({ caption: e.target.value })}
              />
            </div>
          ) : null}
        </Wrap>
      ) : null}
      {shows.tags && formMode ? (
        <Wrap on F={F} action={action} label="Tags" intent="tags" item={item} save="Save tags">
          <div className="cap-field">
            <label className="cap-field-label" htmlFor={`${base}-tags-text`}>
              Tags
            </label>
            <input
              className="cap-input"
              id={`${base}-tags-text`}
              name="tags"
              type="text"
              autoComplete="off"
              aria-describedby={`${base}-tags-help`}
              value={fields.tags.join(", ")}
              onChange={(e) => edit({ tags: parseTags(e.target.value) })}
            />
            <p className="cap-field-help" id={`${base}-tags-help`}>
              Separate tags with commas.
            </p>
          </div>
        </Wrap>
      ) : null}
      {shows.tags && !formMode ? (
        <TagsEditor base={base} item={item} fields={fields} edit={edit} />
      ) : null}
    </>
  );
}
