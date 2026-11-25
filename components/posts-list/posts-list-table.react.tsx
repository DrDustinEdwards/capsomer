import { useEffect, useRef, type ComponentProps, type KeyboardEvent } from "react";
import { type PostRow, type PostsData } from "../content/content.ts";
import { FormMenu } from "../menu/menu.react.tsx";
import { Pill, Status } from "../status/status.react.tsx";
import { Time } from "../time/time.react.tsx";
import { authorLine, rowActions, rowStatus, type RowAction } from "./posts-list.ts";

function HeadCheck({
  checked,
  mixed,
  label,
  onChange,
}: {
  checked: boolean;
  mixed: boolean;
  label: string;
  onChange: (on: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = mixed;
  }, [mixed]);
  return (
    <label className="cap-check">
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="cap-sr-only">{label}</span>
    </label>
  );
}

export function PostsTable({
  uid,
  data,
  action,
  title,
  noun,
  plural,
  formId,
  inTrash,
  selectable,
  mounted,
  selected,
  setOne,
  setAll,
  onKeyDown,
  clock,
  now,
  menuItems,
}: {
  uid: string;
  data: PostsData;
  action: string;
  title: string;
  noun: string;
  plural: string;
  formId: string;
  inTrash: boolean;
  selectable: boolean;
  mounted: boolean;
  selected: string[];
  setOne: (id: string, on: boolean) => void;
  setAll: (on: boolean) => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  clock: number;
  now?: number;
  menuItems: (row: PostRow, list: RowAction[]) => ComponentProps<typeof FormMenu>["items"];
}) {
  const { rows } = data;
  const extraColumns = data.extra?.columns ?? [];
  const withMenus = rows.some((r) => rowActions(r, data).length > 0);
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- delegates the events of the controls inside it
    <div
      className="cap-table-wrap cap-posts-wrap"
      data-reflow=""
      role="region"
      aria-labelledby={`${uid}-cap`}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <table className="cap-table cap-posts-table">
        <caption id={`${uid}-cap`} className="cap-sr-only">
          {inTrash ? `${title} in Trash` : title} on {data.site.name}
        </caption>
        <thead>
          <tr>
            {selectable ? (
              <th scope="col" className="cap-posts-check">
                {mounted ? (
                  <HeadCheck
                    checked={selected.length > 0 && selected.length === rows.length}
                    mixed={selected.length > 0 && selected.length < rows.length}
                    label={`Select all ${rows.length} ${rows.length === 1 ? noun : plural}`}
                    onChange={setAll}
                  />
                ) : (
                  <span className="cap-sr-only">Select</span>
                )}
              </th>
            ) : null}
            <th scope="col">Title</th>
            <th scope="col">Status</th>
            <th scope="col">Updated</th>
            {extraColumns.map((c) => (
              <th key={c.id} scope="col">
                {c.label}
              </th>
            ))}
            {withMenus ? (
              <th scope="col">
                <span className="cap-sr-only">Actions</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const st = rowStatus(row, clock);
            const name = row.title || "Untitled";
            const items = rowActions(row, data);
            return (
              <tr
                key={row.id}
                data-status={row.status}
                data-selected={selected.includes(row.id) ? "" : undefined}
              >
                {selectable ? (
                  <td className="cap-posts-check">
                    <label className="cap-check">
                      <input
                        type="checkbox"
                        name="ids"
                        value={row.id}
                        form={formId}
                        checked={selected.includes(row.id)}
                        onChange={(e) => setOne(row.id, e.target.checked)}
                      />
                      <span className="cap-sr-only">Select {name}</span>
                    </label>
                  </td>
                ) : null}
                <th scope="row" className="cap-posts-title">
                  <a className="cap-table-open" href={row.href}>
                    {name}
                  </a>
                  <span className="cap-posts-meta">
                    <span className="cap-posts-path">{row.path ?? "Not on the site yet"}</span>
                    {data.kinds.length > 1 ? (
                      <span className="cap-posts-kind">{row.kind}</span>
                    ) : null}
                    {row.authors?.length ? (
                      <span className="cap-posts-authors">{authorLine(row.authors)}</span>
                    ) : null}
                  </span>
                  {row.excerpt ? <span className="cap-posts-excerpt">{row.excerpt}</span> : null}
                  {row.notes?.length ? (
                    <span className="cap-posts-notes">
                      {row.notes.map((n) =>
                        n.tone ? (
                          <Pill key={n.text} tone={n.tone}>
                            {n.text}
                          </Pill>
                        ) : (
                          <Pill key={n.text} variant="secondary">
                            {n.text}
                          </Pill>
                        ),
                      )}
                    </span>
                  ) : null}
                </th>
                <td className="cap-posts-status" data-label="Status">
                  <Status tone={st.tone}>{st.word}</Status>
                  {st.note ? <span className="cap-posts-when"> · {st.note}</span> : null}
                </td>
                <td className="cap-posts-updated" data-label="Updated">
                  {row.updatedAt ? (
                    <Time at={row.updatedAt} now={now} />
                  ) : (
                    <span className="cap-posts-none">No date</span>
                  )}
                </td>
                {extraColumns.map((c) => (
                  <td key={c.id} className="cap-posts-extra-cell" data-label={c.label}>
                    {c.cells[row.id] ?? ""}
                  </td>
                ))}
                {withMenus ? (
                  <td className="cap-posts-actions">
                    {items.length ? (
                      <FormMenu
                        label="Actions"
                        aria-label={`Actions for ${name}`}
                        action={action}
                        hidden={{ ids: row.id }}
                        items={menuItems(row, items)}
                      />
                    ) : null}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
