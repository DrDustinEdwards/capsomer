import { withMedia } from "./media-library.ts";
import type { Model } from "./media-library-model.react.tsx";

// The picker's alt step: the chosen picture, the alt text this use needs (the model's, if the host
// read it, only when the person takes it), and Insert.
export function PickForm({ m }: { m: Model }) {
  const {
    Form,
    action,
    href,
    iOffers,
    mounted,
    offers,
    pick,
    pickAlt,
    pickSuggestion,
    query,
    setChosen,
    suggestions,
    uid,
  } = m;
  if (!pick) return null;
  return (
    <Form
      method="post"
      action={action}
      className="cap-media-pick"
      data-cap-part="pick"
      aria-labelledby={`${uid}-pick-h`}
    >
      <input type="hidden" name="intent" value="pick" />
      <input type="hidden" name="ids" value={pick.key} />
      <h3 className="cap-media-pick-title" id={`${uid}-pick-h`}>
        Alt text for {pick.name}
      </h3>
      {pick.thumb ? (
        <img className="cap-media-pick-preview" src={pick.thumb} alt="" width={160} height={160} />
      ) : null}
      <div className="cap-field">
        <label className="cap-field-label" htmlFor={`${uid}-pick-alt`}>
          Alt text (required)
        </label>
        <textarea
          ref={pickAlt}
          className="cap-input"
          id={`${uid}-pick-alt`}
          name="alt"
          rows={2}
          required
          defaultValue={pick.alt}
          aria-describedby={`${uid}-pick-help`}
        />
        <p className="cap-field-help" id={`${uid}-pick-help`}>
          What the picture shows here, or insert it as decorative.{" "}
          {pick.alt ? "It starts with the file's own alt text." : null}
        </p>
        {pickSuggestion ? (
          <p className="cap-field-help" data-cap-part="pick-suggestion">
            {suggestions?.model} suggests: “{pickSuggestion}”{" "}
            {mounted ? (
              <button
                type="button"
                className="cap-btn"
                data-variant="quiet"
                onClick={() => {
                  if (!pickAlt.current) return;
                  pickAlt.current.value = pickSuggestion;
                  pickAlt.current.focus();
                }}
              >
                Use it
              </button>
            ) : null}
          </p>
        ) : iOffers.suggest && offers.alt && suggestions === undefined ? (
          <p className="cap-field-help">
            <a href={href(withMedia(query, { pick: pick.key, suggest: true }))}>Suggest alt text</a>
          </p>
        ) : null}
      </div>
      <div className="cap-media-pick-actions">
        <button type="submit" className="cap-btn" data-variant="primary">
          Insert
        </button>
        <button type="submit" className="cap-btn" name="decorative" value="on" formNoValidate>
          Insert as decorative
        </button>
        <a
          className="cap-btn"
          data-variant="quiet"
          href={href(withMedia(query, { pick: undefined }))}
          onClick={(e) => {
            if (!mounted) return;
            e.preventDefault();
            setChosen(undefined);
          }}
        >
          Choose another
        </a>
      </div>
    </Form>
  );
}
