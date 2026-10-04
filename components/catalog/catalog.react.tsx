import { useEffect, useRef, type ReactNode } from "react";
import { Empty } from "../empty/empty.react.tsx";
import { Pagination } from "../pagination/pagination.react.tsx";
import { attachCatalog } from "./catalog.ts";
import { countText, type CatalogDefinition, type CatalogField, type CatalogResult } from "./catalog-core.ts";

export interface CatalogProps<T> {
  definition: CatalogDefinition<T>;
  // What `queryCatalog` returned for this request's address.
  result: CatalogResult<T>;
  // The first column's cell: the item's name, usually a link to it.
  title: (item: T) => ReactNode;
  // A field's cell, when its plain words (the values joined) are not enough.
  cells?: Partial<Record<string, (item: T) => ReactNode>>;
  // The page's heading id, which names the results region.
  labelledBy: string;
  // What to say when the collection itself is empty, and the sentence under "No protocols match".
  emptyText?: { nothingYet?: ReactNode; noMatch?: ReactNode };
  // Beside the count: downloads, a view switch.
  actions?: ReactNode;
}

const sortGlyph = (
  <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
    <path className="cap-table-sort-up" d="M5 1 9 5H1z" />
    <path className="cap-table-sort-down" d="M5 11 1 7h8z" />
  </svg>
);

const plain = <T,>(field: CatalogField<T>, item: T): string => {
  const value = field.value(item);
  const list = (Array.isArray(value) ? value : [value]).filter((v) => v !== null && v !== undefined && v !== "");
  return list.map(String).join(", ");
};

// The whole catalog, from the HTML contract in catalog.md. It is a form that submits with GET to the page's own
// address, so every control works with no script; the enhancement (catalog.ts) only swaps the regions in place.
// Everything here is drawn from `result`, which a server computes, so the page is the same either way.
export function Catalog<T>({ definition: def, result, title, cells, labelledBy, emptyText, actions }: CatalogProps<T>) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => (ref.current ? attachCatalog(ref.current) : undefined), []);
  const id = def.id;
  // Under headings a column that only repeats the heading (a Year column under year headings) is left out.
  const columns = def.fields.filter((f) => f.column && !(result.groups && f.column.hideWhenGrouped));
  const [first, ...rest] = columns;
  const active = result.state.q !== "" || result.chips.length > 0;
  const facetCount = result.facets.reduce((n, f) => n + f.selected, 0);
  const noun = def.noun[1];
  const nextSort = (key: string) => (result.state.sort === key || (!result.state.sort && def.defaultSort === key) ? `-${key}` : key);
  const currentSort = result.sorts.find((s) => s.selected)?.value ?? "";
  const ariaSort = (key: string) => (currentSort === key ? "ascending" : currentSort === `-${key}` ? "descending" : undefined);

  return (
    <form ref={ref} className="cap-catalog" data-cap="catalog" data-catalog={id} data-catalog-href={result.href()} method="get" action={def.basePath} aria-labelledby={labelledBy}>
      <div className="cap-catalog-bar">
        <div className="cap-field cap-catalog-search">
          <label className="cap-field-label" htmlFor={`${id}-q`}>
            Search {noun}
          </label>
          <input className="cap-input" id={`${id}-q`} type="search" name="q" defaultValue={result.state.q} autoComplete="off" enterKeyHint="search" />
        </div>
        <div className="cap-field cap-catalog-sort">
          <label className="cap-field-label" htmlFor={`${id}-sort`}>
            Sort
          </label>
          <select className="cap-input" id={`${id}-sort`} name="sort" defaultValue={currentSort}>
            {result.sorts.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="cap-btn cap-catalog-apply" data-variant="primary">
          Apply
        </button>
        <a className="cap-btn cap-catalog-tray-open" href={`#${id}-filters`} data-catalog-tray="open">
          Filters{facetCount > 0 ? ` (${facetCount})` : ""}
        </a>
      </div>

      <div className="cap-catalog-body">
        <div className="cap-catalog-filters" id={`${id}-filters`} role="group" aria-label="Filters" data-catalog-region="filters">
          <div className="cap-catalog-tray-head">
            <p className="cap-catalog-tray-title">Filters</p>
            <a className="cap-btn" href={`#${id}-results`} data-catalog-tray="close">
              Show {result.count} {result.count === 1 ? def.noun[0] : noun}
            </a>
          </div>
          {result.facets.map((facet) => {
            const shown = facet.options.filter((o, i) => i < facet.limit || o.selected);
            const hidden = facet.options.length - shown.length;
            return (
              <fieldset className="cap-field cap-catalog-facet" key={facet.key} data-general={facet.general ? "" : undefined}>
                <legend className="cap-field-label">{facet.label}</legend>
                <div className="cap-field-options">
                  {facet.kind === "one" ? (
                    <label className="cap-check">
                      <input type="radio" name={facet.key} value="" defaultChecked={facet.selected === 0} /> Any
                    </label>
                  ) : null}
                  {shown.map((o) => (
                    <label className="cap-check" key={o.value}>
                      <input type={facet.kind === "one" ? "radio" : "checkbox"} name={facet.key} value={o.value} defaultChecked={o.selected} />
                      <span>{o.label}</span> <span className="cap-catalog-n">{o.count}</span>
                    </label>
                  ))}
                  {hidden > 0 ? (
                    <details className="cap-catalog-more">
                      <summary>Show {hidden} more</summary>
                      <div className="cap-field-options">
                        {facet.options
                          .filter((o) => !shown.includes(o))
                          .map((o) => (
                            <label className="cap-check" key={o.value}>
                              <input type={facet.kind === "one" ? "radio" : "checkbox"} name={facet.key} value={o.value} defaultChecked={o.selected} />
                              <span>{o.label}</span> <span className="cap-catalog-n">{o.count}</span>
                            </label>
                          ))}
                      </div>
                    </details>
                  ) : null}
                </div>
              </fieldset>
            );
          })}
        </div>

        <div className="cap-catalog-main">
          <div className="cap-catalog-status">
            <p className="cap-catalog-count" role="status" aria-live="polite" data-catalog-region="count">
              {countText(def, result)}
            </p>
            {actions ? <div className="cap-catalog-actions">{actions}</div> : null}
          </div>

          <div data-catalog-region="chips">
            {result.chips.length > 0 ? (
              <ul className="cap-catalog-chips" aria-label="Active filters">
                {result.chips.map((chip) => (
                  <li key={chip.id}>
                    <a className="cap-catalog-chip" href={chip.href}>
                      {chip.label}
                      <span className="cap-sr-only"> (remove this filter)</span>
                      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                        <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                      </svg>
                    </a>
                  </li>
                ))}
                {result.clearHref ? (
                  <li>
                    <a className="cap-catalog-clear" href={result.clearHref}>
                      Clear all
                    </a>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>

          <div data-catalog-region="results" aria-busy="false">
            {result.rows.length === 0 ? (
              active ? (
                <Empty kind="no-match" title={`No ${noun} match`} action={result.clearHref ? <a className="cap-btn" href={result.clearHref}>Clear filters</a> : undefined}>
                  {emptyText?.noMatch ?? `${result.total} ${result.total === 1 ? def.noun[0] : noun} are hidden by these filters.`}
                </Empty>
              ) : (
                <Empty kind="nothing-yet" title={`No ${noun} yet`}>
                  {emptyText?.nothingYet}
                </Empty>
              )
            ) : (
              <div className="cap-table-wrap" data-cap="table" data-reflow="" role="region" aria-labelledby={labelledBy} tabIndex={0}>
                <table className="cap-table">
                  <thead>
                    <tr>
                      {[first, ...rest].filter(Boolean).map((field, i) => {
                        const f = field as CatalogField<T>;
                        const header = f.column?.header ?? f.label;
                        return (
                          <th key={f.key} scope="col" aria-sort={ariaSort(f.key)} data-num={f.column?.align === "end" ? "" : undefined} data-drop={i > 0 ? f.column?.drop : undefined}>
                            {f.sort ? (
                              <a className="cap-table-sort" href={result.href({ sort: nextSort(f.key), page: 1 })}>
                                {header}
                                {sortGlyph}
                              </a>
                            ) : (
                              header
                            )}
                            {f.column?.note ? <span className="cap-table-note">{f.column.note}</span> : null}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  {(result.groups ?? [{ value: "", label: "", rows: result.rows }]).map((group) => (
                    <tbody key={group.value || "all"}>
                      {result.groups ? (
                        <tr className="cap-catalog-group">
                          <th scope="rowgroup" colSpan={columns.length} id={`${id}-group-${group.value}`}>
                            {group.label}
                          </th>
                        </tr>
                      ) : null}
                      {group.rows.map((item) => (
                        <tr key={def.itemKey(item)}>
                          {first ? <th scope="row">{title(item)}</th> : null}
                          {rest.map((f) => (
                            <td key={f.key} data-label={f.column?.header ?? f.label} data-num={f.column?.align === "end" ? "" : undefined} data-drop={f.column?.drop}>
                              {cells?.[f.key]?.(item) ?? plain(f, item)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  ))}
                </table>
              </div>
            )}
          </div>

          <div data-catalog-region="pages">
            <Pagination page={result.page} pageCount={result.pageCount} hrefFor={(n) => result.href({ page: n })} total={result.count} perPage={def.pageSize} noun={noun} label={`${noun} pages`} />
          </div>
        </div>
      </div>
    </form>
  );
}
