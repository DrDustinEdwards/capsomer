import type { ReactNode } from "react";
import type { MediaData, MediaRevision } from "../content/content.ts";
import type { FormComponent } from "../content/content.react.tsx";
import { byteSize, type MediaRecord } from "../media/media.ts";
import { Glyph } from "../status/status.react.tsx";
import { dayWords, inspectorOffers, licenseEnded, momentWords, oversized, turnMakesCopy } from "./media-library.ts";

// The inspector's sections for site-api v0.13.0's media ideas, each shown only where the kit offers it
// and the person may run it: the files holding the same bytes, what the file itself said at upload,
// the model's suggestions, credit and license, turns and mirrors, shrinking to the site's size, and the
// file's earlier bytes with a revert. Each is a form (`Tool`) posting the kit's own intent, so it works
// with no script; inside the autosaving inspector `Tool` hands its fields to the library's `submit`.

const REASON_WORDS: Record<MediaRevision["reason"], string> = { upload: "Uploaded", import: "Imported", replace: "Replaced", transform: "Turned", resize: "Shrunk", revert: "Reverted" };

const TURNS: Array<[string, string]> = [
  ["rotate-270", "Rotate left"],
  ["rotate-90", "Rotate right"],
  ["flip-h", "Flip horizontally"],
  ["flip-v", "Flip vertically"],
];

export interface MediaMoreProps {
  item: MediaRecord;
  data: Pick<MediaData, "offers" | "can" | "history" | "suggestions">;
  Tool: FormComponent;
  ident: (intent: string) => ReactNode;
  base: string;
  action: string;
  // Where another file's inspector is (a twin), and where this one is with the model asked or not.
  inspectHref: (key: string) => string;
  suggestHref: string;
  unsuggestHref: string;
}

export function MediaMore({ item, data, Tool, ident, base, action, inspectHref, suggestHref, unsuggestHref }: MediaMoreProps) {
  const o = inspectorOffers(data);
  const img = item.kind === "image";
  const live = item.state !== "binned";
  const versioned = !!item.version;
  const history = o.revert || data.offers.history ? (data.history ?? []) : [];
  const ended = licenseEnded(item.licenseExpires);
  const suggestions = data.suggestions;
  const credits = data.offers.credit;
  const taken = o.embedded && item.takenAt ? dayWords(item.takenAt) : null;
  const altFromFile = o.embedded && data.offers.alt && data.can.edit && img && live && versioned && !item.alt.trim() && item.altState !== "decorative" && item.caption.trim() ? item.caption.trim() : "";

  return (
    <>
      {o.twins && item.twins && item.twins.length > 0 ? (
        <section className="cap-media-section" aria-labelledby={`${base}-twins-l`} data-cap-part="twins">
          <h3 id={`${base}-twins-l`}>Same file as</h3>
          <p className="cap-media-note">These hold exactly the same bytes. Pages may use either one, so check where each is used before you move one to Trash.</p>
          <ul className="cap-media-used">
            {item.twins.map((t) => (
              <li key={t.key}>
                <a href={inspectHref(t.key)}>{t.name}</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {taken || altFromFile ? (
        <section className="cap-media-section" aria-labelledby={`${base}-embedded-l`} data-cap-part="embedded">
          <h3 id={`${base}-embedded-l`}>From the file</h3>
          <p className="cap-media-note">What the file itself said when it was uploaded. Where it named a credit, license or caption, the site filled the empty field with it.</p>
          {taken ? (
            <dl className="cap-media-facts">
              <dt>Taken</dt>
              <dd>{taken}</dd>
            </dl>
          ) : null}
          {altFromFile ? (
            <Tool method="post" action={action} className="cap-media-field-form cap-media-tool" aria-label="Alt text from the file's caption">
              {ident("alt")}
              <div className="cap-field">
                <label className="cap-field-label" htmlFor={`${base}-alt-embedded`}>
                  Start the alt text from the caption
                </label>
                <textarea className="cap-input" id={`${base}-alt-embedded`} name="alt" rows={2} defaultValue={altFromFile} aria-describedby={`${base}-alt-embedded-help`} />
                <p className="cap-field-help" id={`${base}-alt-embedded-help`}>
                  A caption says what is around the picture; alt text says what it shows. Change it to fit, then save.
                </p>
              </div>
              <div className="cap-media-tool-actions">
                <button type="submit" className="cap-btn" data-size="sm">
                  Save as alt text
                </button>
              </div>
            </Tool>
          ) : null}
        </section>
      ) : null}

      {o.suggest && img && live && versioned ? (
        <section className="cap-media-section" aria-labelledby={`${base}-suggest-l`} data-cap-part="suggestions">
          <h3 id={`${base}-suggest-l`}>Suggestions</h3>
          {suggestions === undefined ? (
            <>
              <div className="cap-media-tool-actions">
                <a className="cap-btn" data-size="sm" href={suggestHref}>
                  Suggest tags and alt
                </a>
              </div>
              <p className="cap-media-note">Asks the site's model about this picture. Nothing changes until you accept a suggestion.</p>
            </>
          ) : suggestions === null ? (
            <>
              <p className="cap-media-note" role="status">
                The site could not suggest anything just now.
              </p>
              <div className="cap-media-tool-actions">
                <a className="cap-btn" data-size="sm" href={suggestHref}>
                  Try again
                </a>
                <a className="cap-btn" data-size="sm" data-variant="quiet" href={unsuggestHref}>
                  Dismiss
                </a>
              </div>
            </>
          ) : (
            <>
              <p className="cap-media-note">From {suggestions.model}. Accept each one you agree with; the rest are left as they are.</p>
              {data.offers.tags && suggestions.tags.length > 0 ? (
                <ul className="cap-media-tags" aria-label="Suggested tags">
                  {suggestions.tags.map((t) => (
                    <li key={t}>
                      <Tool method="post" action={action} className="cap-media-lib-accept" aria-label={`Suggested tag ${t}`}>
                        {ident("tag-add")}
                        <input type="hidden" name="tags" value={t} />
                        <button type="submit" className="cap-chip" aria-label={`Add suggested tag ${t}`}>
                          + {t}
                        </button>
                      </Tool>
                    </li>
                  ))}
                </ul>
              ) : null}
              {data.offers.alt && suggestions.alt ? (
                <Tool method="post" action={action} className="cap-media-field-form cap-media-tool" aria-label="Suggested alt text">
                  {ident("alt")}
                  <div className="cap-field">
                    <label className="cap-field-label" htmlFor={`${base}-alt-suggested`}>
                      Suggested alt text
                    </label>
                    <textarea className="cap-input" id={`${base}-alt-suggested`} name="alt" rows={2} defaultValue={suggestions.alt} aria-describedby={`${base}-alt-suggested-help`} />
                    <p className="cap-field-help" id={`${base}-alt-suggested-help`}>
                      Read it against the picture and change what is wrong. Using it replaces the alt text this file has.
                    </p>
                  </div>
                  <div className="cap-media-tool-actions">
                    <button type="submit" className="cap-btn" data-size="sm">
                      Use this alt text
                    </button>
                  </div>
                </Tool>
              ) : null}
              {!(data.offers.tags && suggestions.tags.length) && !(data.offers.alt && suggestions.alt) ? <p className="cap-media-note">Nothing to suggest: the file already has what the model would say.</p> : null}
              <div className="cap-media-tool-actions">
                <a className="cap-btn" data-size="sm" data-variant="quiet" href={unsuggestHref}>
                  Dismiss suggestions
                </a>
              </div>
            </>
          )}
        </section>
      ) : null}

      {credits && (o.credit || item.credit || item.license || item.sourceUrl || item.licenseExpires) ? (
        <section className="cap-media-section" aria-labelledby={`${base}-credit-l`} data-cap-part="credit">
          <h3 id={`${base}-credit-l`}>Credit and license</h3>
          {ended ? (
            // A lasting fact about the file, not an event, so no live role: the alert's look, shape and word.
            <div className="cap-alert" data-tone="warn" data-cap-part="license-ended">
              <Glyph name="warn" />
              <span className="cap-alert-text">
                License ended on {dayWords(item.licenseExpires ?? "")}. Renew it, or replace the file where pages use it.
              </span>
            </div>
          ) : null}
          {o.credit && versioned ? (
            <Tool method="post" action={action} className="cap-media-field-form cap-media-tool" aria-label="Credit and license" key={`credit:${item.key}:${item.version ?? ""}`}>
              {ident("credit")}
              <div className="cap-field">
                <label className="cap-field-label" htmlFor={`${base}-credit`}>
                  Credit
                </label>
                <input className="cap-input" id={`${base}-credit`} name="credit" type="text" autoComplete="off" maxLength={300} defaultValue={item.credit ?? ""} aria-describedby={`${base}-credit-help`} />
                <p className="cap-field-help" id={`${base}-credit-help`}>
                  Who made it, as they ask to be named.
                </p>
              </div>
              <div className="cap-field">
                <label className="cap-field-label" htmlFor={`${base}-license`}>
                  License
                </label>
                <input className="cap-input" id={`${base}-license`} name="license" type="text" autoComplete="off" maxLength={300} defaultValue={item.license ?? ""} />
              </div>
              <div className="cap-field">
                <label className="cap-field-label" htmlFor={`${base}-source`}>
                  Source address
                </label>
                <input className="cap-input" id={`${base}-source`} name="sourceUrl" type="url" autoComplete="off" defaultValue={item.sourceUrl ?? ""} />
              </div>
              <div className="cap-field">
                <label className="cap-field-label" htmlFor={`${base}-expires`}>
                  License ends
                </label>
                <input className="cap-input" id={`${base}-expires`} name="licenseExpires" type="date" defaultValue={item.licenseExpires ?? ""} aria-describedby={`${base}-expires-help`} />
                <p className="cap-field-help" id={`${base}-expires-help`}>
                  Leave it empty for a license with no end. The License ended filter lists files past theirs.
                </p>
              </div>
              <div className="cap-media-tool-actions">
                <button type="submit" className="cap-btn" data-size="sm">
                  Save credit
                </button>
              </div>
            </Tool>
          ) : (
            <dl className="cap-media-facts">
              {item.credit ? (
                <>
                  <dt>Credit</dt>
                  <dd>{item.credit}</dd>
                </>
              ) : null}
              {item.license ? (
                <>
                  <dt>License</dt>
                  <dd>{item.license}</dd>
                </>
              ) : null}
              {item.sourceUrl ? (
                <>
                  <dt>Source</dt>
                  <dd>
                    <a href={item.sourceUrl}>{item.sourceUrl}</a>
                  </dd>
                </>
              ) : null}
              {item.licenseExpires ? (
                <>
                  <dt>License ends</dt>
                  <dd>{dayWords(item.licenseExpires)}</dd>
                </>
              ) : null}
            </dl>
          )}
        </section>
      ) : null}

      {img && live && versioned && (o.transform || oversized(item, o.resize)) ? (
        <section className="cap-media-section" aria-labelledby={`${base}-turn-l`} data-cap-part="turns">
          <h3 id={`${base}-turn-l`}>Turn and size</h3>
          {o.transform ? (
            <Tool method="post" action={action} className="cap-media-tool" aria-label="Turn or mirror the picture">
              {ident("transform")}
              <div className="cap-media-tool-actions">
                {TURNS.map(([op, label]) => (
                  <button key={op} type="submit" className="cap-btn" data-size="sm" name="op" value={op}>
                    {label}
                  </button>
                ))}
              </div>
              <p className="cap-media-note">
                {turnMakesCopy(item, data.offers)
                  ? "A quarter turn saves the turned picture as a new file, since this site's addresses carry the size; pages that use this one keep it. A flip changes this one in place."
                  : "Every page that uses it shows the turned picture."}
                {data.offers.history ? " Its history keeps the bytes it had." : ""}
              </p>
            </Tool>
          ) : null}
          {o.resize != null && oversized(item, o.resize) ? (
            <Tool method="post" action={action} className="cap-media-tool" aria-label="Shrink to the site's size">
              {ident("resize")}
              <div className="cap-media-tool-actions">
                <button type="submit" className="cap-btn" data-size="sm">
                  Shrink to {o.resize} pixels
                </button>
              </div>
              <p className="cap-media-note">
                Its longer edge is {Math.max(item.width ?? 0, item.height ?? 0)} pixels; this site keeps {o.resize}. The site asks before it stores the smaller picture, which every page that uses it then shows.
              </p>
            </Tool>
          ) : null}
        </section>
      ) : null}

      {history.length > 0 ? (
        <section className="cap-media-section" aria-labelledby={`${base}-history-l`} data-cap-part="history">
          <h3 id={`${base}-history-l`}>History</h3>
          <ol className="cap-media-lib-history">
            {history.map((r) => {
              const when = momentWords(r.at);
              return (
                <li key={r.rev} aria-current={r.current ? "true" : undefined}>
                  <span className="cap-media-lib-history-what">
                    {REASON_WORDS[r.reason]} {when}
                  </span>
                  <span className="cap-media-lib-history-facts">{[r.width && r.height ? `${r.width} by ${r.height}` : null, byteSize(r.bytes), r.current ? "now" : null].filter(Boolean).join(" · ")}</span>
                  {!r.current && o.revert && live && versioned ? (
                    <Tool method="post" action={action} className="cap-media-lib-revert" aria-label={`Go back to the version of ${when}`}>
                      {ident("revert")}
                      <input type="hidden" name="to" value={r.rev} />
                      <button type="submit" className="cap-btn" data-size="sm">
                        Go back to this<span className="cap-sr-only"> version, {when}</span>
                      </button>
                    </Tool>
                  ) : null}
                </li>
              );
            })}
          </ol>
          {o.revert ? <p className="cap-media-note">Going back stores those bytes again as the newest version, so it can be undone. Set the focal point again if it had one.</p> : null}
        </section>
      ) : null}
    </>
  );
}
