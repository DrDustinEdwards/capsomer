import { useRef } from "react";
import type { SubmitIntent } from "../content/content.ts";
import type { MediaFields } from "../media/media.react.tsx";
import type { MediaRecord } from "../media/media.ts";
import type { inspectorOffers } from "./media-library.ts";

// The inspector's autosave posts the content kit's own intents, one for each field group that
// changed (`alt`, `caption`, `tags`), each on the version the last write made (site-api's
// Outcome.version), so a host passes every form straight on. What was saved, and on which version,
// is kept per file until the host's rows catch up.
export function useInspectorSave(
  submit: SubmitIntent | undefined,
  rows: readonly MediaRecord[],
  inspected: MediaRecord | null,
  iOffers: ReturnType<typeof inspectorOffers>,
) {
  const savedRef = useRef(
    new Map<
      string,
      { base: string | undefined; version: string | undefined; fields: MediaFields }
    >(),
  );
  return async (key: string, fields: MediaFields) => {
    if (!submit) return;
    const item =
      rows.find((r) => r.key === key) ?? (inspected?.key === key ? inspected : undefined);
    const kept = savedRef.current.get(key);
    const fresh = !kept || (item?.version !== kept.base && item?.version !== kept.version);
    const was: MediaFields =
      !fresh && kept
        ? kept.fields
        : {
            alt: item?.alt ?? "",
            decorative: item?.altState === "decorative",
            title: item?.title ?? "",
            caption: item?.caption ?? "",
            tags: item?.tags ?? [],
          };
    let version = !fresh && kept ? kept.version : item?.version;
    const base = item?.version;
    const writes: Array<[string, (form: FormData) => void, (done: MediaFields) => MediaFields]> =
      [];
    if (iOffers.alt && (fields.alt !== was.alt || fields.decorative !== was.decorative)) {
      writes.push([
        "alt",
        (f) => {
          f.set("alt", fields.decorative ? "" : fields.alt);
          if (fields.decorative) f.set("decorative", "on");
        },
        (d) => ({ ...d, alt: fields.alt, decorative: fields.decorative }),
      ]);
    }
    if (iOffers.caption && fields.caption !== was.caption)
      writes.push([
        "caption",
        (f) => f.set("caption", fields.caption),
        (d) => ({ ...d, caption: fields.caption }),
      ]);
    if (iOffers.tags && fields.tags.join(", ") !== was.tags.join(", "))
      writes.push([
        "tags",
        (f) => f.set("tags", fields.tags.join(", ")),
        (d) => ({ ...d, tags: fields.tags }),
      ]);
    let done = was;
    for (const [intent, fill, after] of writes) {
      const form = new FormData();
      form.set("intent", intent);
      form.set("ids", key);
      if (version) form.set("versions", version);
      fill(form);
      const r = await submit(form);
      if (!r.ok) throw new Error(r.message);
      version = r.outcomes?.find((o) => o.id === key)?.version ?? version;
      done = after(done);
      savedRef.current.set(key, { base, version, fields: done });
    }
  };
}
