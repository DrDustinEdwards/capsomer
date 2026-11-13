// Mounts the repeater specimens, each held in React state as an app would.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { MessageProvider } from "../message/message.react.tsx";
import { RepeaterField } from "./repeater-field.react.tsx";

type Link = { label: string; url: string };

function Links({ error }: { error?: string }) {
  const [rows, setRows] = useState<Link[]>([
    { label: "Release notes", url: "https://example.com/notes" },
    { label: "Field notes", url: "https://example.org/field" },
    { label: "Annual report", url: "https://example.net/report" },
  ]);
  return (
    <form method="post" action="#">
      <RepeaterField
        legend="Footer links"
        help="Shown in the site's footer, in this order."
        error={error}
        rows={rows}
        onChange={setRows}
        newRow={() => ({ label: "", url: "" })}
        rowLabel={(i) => `Link ${i + 1}`}
        addLabel="Add a link"
        reorder
        name="links"
        json
      >
        {(row, { label, set, name }) => (
          <>
            <div className="cap-field">
              <label className="cap-field-label" htmlFor={`${name("label")}-in`}>
                Words<span className="cap-sr-only">, {label}</span>
              </label>
              <input
                className="cap-input"
                id={`${name("label")}-in`}
                name={name("label")}
                value={row.label}
                onChange={(e) => set({ label: e.target.value })}
              />
            </div>
            <div className="cap-field">
              <label className="cap-field-label" htmlFor={`${name("url")}-in`}>
                Address<span className="cap-sr-only">, {label}</span>
              </label>
              <input
                className="cap-input"
                id={`${name("url")}-in`}
                type="url"
                name={name("url")}
                value={row.url}
                aria-invalid={error && !row.url.startsWith("https://") ? true : undefined}
                onChange={(e) => set({ url: e.target.value })}
              />
            </div>
          </>
        )}
      </RepeaterField>
    </form>
  );
}

function Authors() {
  const [rows, setRows] = useState([{ name: "Alex Rivera" }, { name: "Sam Lee" }]);
  return (
    <RepeaterField
      legend="Authors"
      rows={rows}
      onChange={setRows}
      newRow={() => ({ name: "" })}
      rowLabel={(i) => `Author ${i + 1}`}
      addLabel="Add an author"
      min={1}
      max={4}
    >
      {(row, { index, label, set }) => (
        <div className="cap-field">
          <label className="cap-field-label" htmlFor={`author-${index}`}>
            {label}
          </label>
          <input
            className="cap-input"
            id={`author-${index}`}
            value={row.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </div>
      )}
    </RepeaterField>
  );
}

const MOUNTS = {
  links: <Links />,
  authors: <Authors />,
  error: <Links error="Every address starts https://." />,
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const node = MOUNTS[el.dataset.mount as keyof typeof MOUNTS];
  if (node)
    createRoot(el).render(
      <StrictMode>
        <MessageProvider>{node}</MessageProvider>
      </StrictMode>,
    );
}
