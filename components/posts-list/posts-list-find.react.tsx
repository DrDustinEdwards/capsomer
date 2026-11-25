import { type PostsData } from "../content/content.ts";
import { type FormComponent } from "../plain-form/plain-form.react.tsx";
import { NO_FILTERS, SORTS, filtered, withFilter } from "./posts-list.ts";

export function PostsFind({
  uid,
  query,
  kinds,
  tags,
  authors,
  dates,
  action,
  Form,
  plural,
  href,
}: {
  uid: string;
  query: PostsData["query"];
  kinds: string[];
  tags: string[];
  authors: string[];
  dates: boolean;
  action: string;
  Form: FormComponent;
  plural: string;
  href: (q: PostsData["query"]) => string;
}) {
  return (
    <Form
      method="get"
      action={action.split("?")[0]}
      className="cap-field-row"
      role="search"
      aria-label={`Find ${plural}`}
    >
      {query.status && !query.trashed ? (
        <input type="hidden" name="status" value={query.status} />
      ) : null}
      {query.trashed ? <input type="hidden" name="trashed" value="1" /> : null}
      <div className="cap-field cap-field-wide">
        <label className="cap-field-label" htmlFor={`${uid}-q`}>
          Search
        </label>
        <input
          className="cap-input"
          type="search"
          id={`${uid}-q`}
          name="q"
          defaultValue={query.q ?? ""}
        />
      </div>
      {kinds.length > 1 ? (
        <div className="cap-field">
          <label className="cap-field-label" htmlFor={`${uid}-kind`}>
            Kind
          </label>
          <div className="cap-select-wrap" data-native="">
            <select
              className="cap-select"
              id={`${uid}-kind`}
              name="kind"
              defaultValue={query.kind ?? ""}
            >
              <option value="">Any kind</option>
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}
      {tags.length > 0 || query.tag ? (
        <div className="cap-field">
          <label className="cap-field-label" htmlFor={`${uid}-tag`}>
            Tag
          </label>
          <div className="cap-select-wrap" data-native="">
            <select
              className="cap-select"
              id={`${uid}-tag`}
              name="tag"
              defaultValue={query.tag ?? ""}
            >
              <option value="">Any tag</option>
              {Array.from(new Set([...tags, ...(query.tag ? [query.tag] : [])])).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}
      {authors.length ? (
        <div className="cap-field">
          <label className="cap-field-label" htmlFor={`${uid}-author`}>
            Author
          </label>
          <div className="cap-select-wrap" data-native="">
            <select
              className="cap-select"
              id={`${uid}-author`}
              name="author"
              defaultValue={query.author ?? ""}
            >
              <option value="">Any author</option>
              {authors.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}
      {dates ? (
        <>
          <div className="cap-field">
            <label className="cap-field-label" htmlFor={`${uid}-from`}>
              Published from
            </label>
            <input
              className="cap-input"
              type="date"
              id={`${uid}-from`}
              name="from"
              defaultValue={query.from ?? ""}
            />
          </div>
          <div className="cap-field">
            <label className="cap-field-label" htmlFor={`${uid}-to`}>
              Published to
            </label>
            <input
              className="cap-input"
              type="date"
              id={`${uid}-to`}
              name="to"
              defaultValue={query.to ?? ""}
            />
          </div>
        </>
      ) : null}
      <div className="cap-field">
        <label className="cap-field-label" htmlFor={`${uid}-sort`}>
          Sort by
        </label>
        <div className="cap-select-wrap" data-native="">
          <select
            className="cap-select"
            id={`${uid}-sort`}
            name="sort"
            defaultValue={query.sort ?? "updated"}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" className="cap-btn">
        Show
      </button>
      {filtered(query) ? (
        <a className="cap-btn" data-variant="quiet" href={href(withFilter(query, NO_FILTERS))}>
          Clear filters
        </a>
      ) : null}
    </Form>
  );
}
