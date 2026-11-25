import type { ReactNode } from "react";
import type { MediaData } from "../content/content.ts";
import type { FormComponent } from "../plain-form/plain-form.react.tsx";

// The inspector's Suggestions section: the site's model asked about one picture, each suggestion
// accepted by its own form.
export function MediaSuggest({
  base,
  Tool,
  ident,
  action,
  offers,
  suggestions,
  suggestHref,
  unsuggestHref,
}: {
  base: string;
  Tool: FormComponent;
  ident: (intent: string) => ReactNode;
  action: string;
  offers: MediaData["offers"];
  suggestions: MediaData["suggestions"];
  suggestHref: string;
  unsuggestHref: string;
}) {
  return (
    <section
      className="cap-media-section"
      aria-labelledby={`${base}-suggest-l`}
      data-cap-part="suggestions"
    >
      <h3 id={`${base}-suggest-l`}>Suggestions</h3>
      {suggestions === undefined ? (
        <>
          <div className="cap-media-tool-actions">
            <a className="cap-btn" data-size="sm" href={suggestHref}>
              Suggest tags and alt
            </a>
          </div>
          <p className="cap-media-note">
            Asks the site's model about this picture. Nothing changes until you accept a suggestion.
          </p>
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
          <p className="cap-media-note">
            From {suggestions.model}. Accept each one you agree with; the rest are left as they are.
          </p>
          {offers.tags && suggestions.tags.length > 0 ? (
            <ul className="cap-media-tags" aria-label="Suggested tags">
              {suggestions.tags.map((t) => (
                <li key={t}>
                  <Tool
                    method="post"
                    action={action}
                    className="cap-media-lib-accept"
                    aria-label={`Suggested tag ${t}`}
                  >
                    {ident("tag-add")}
                    <input type="hidden" name="tags" value={t} />
                    <button
                      type="submit"
                      className="cap-chip"
                      aria-label={`Add suggested tag ${t}`}
                    >
                      + {t}
                    </button>
                  </Tool>
                </li>
              ))}
            </ul>
          ) : null}
          {offers.alt && suggestions.alt ? (
            <Tool
              method="post"
              action={action}
              className="cap-media-field-form cap-media-tool"
              aria-label="Suggested alt text"
            >
              {ident("alt")}
              <div className="cap-field">
                <label className="cap-field-label" htmlFor={`${base}-alt-suggested`}>
                  Suggested alt text
                </label>
                <textarea
                  className="cap-input"
                  id={`${base}-alt-suggested`}
                  name="alt"
                  rows={2}
                  defaultValue={suggestions.alt}
                  aria-describedby={`${base}-alt-suggested-help`}
                />
                <p className="cap-field-help" id={`${base}-alt-suggested-help`}>
                  Read it against the picture and change what is wrong. Using it replaces the alt
                  text this file has.
                </p>
              </div>
              <div className="cap-media-tool-actions">
                <button type="submit" className="cap-btn" data-size="sm">
                  Use this alt text
                </button>
              </div>
            </Tool>
          ) : null}
          {!(offers.tags && suggestions.tags.length) && !(offers.alt && suggestions.alt) ? (
            <p className="cap-media-note">
              Nothing to suggest: the file already has what the model would say.
            </p>
          ) : null}
          <div className="cap-media-tool-actions">
            <a className="cap-btn" data-size="sm" data-variant="quiet" href={unsuggestHref}>
              Dismiss suggestions
            </a>
          </div>
        </>
      )}
    </section>
  );
}
