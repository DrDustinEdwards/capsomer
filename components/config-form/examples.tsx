// Mounts the config form specimen: a list of sites with Add and Edit, the form and its hint.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Field } from "../field/field.react.tsx";
import { ConfigForm, useConfigForm, useEditor } from "./config-form.react.tsx";

interface Site {
  name: string;
  origin: string;
}

function SiteForm({ initial, onClose }: { initial: Site | null; onClose: () => void }) {
  const { f, first } = useConfigForm();
  const [name, setName] = useState(initial?.name ?? "");
  const [origin, setOrigin] = useState(initial?.origin ?? "");
  const [hint, setHint] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  return (
    <ConfigForm
      f={f}
      first={first}
      title={initial ? `Edit ${initial.name}` : "Add a site"}
      src="Saved in the settings table"
      hint={hint}
      onSubmit={() => (name.trim() ? (setHint(null), setSent(true)) : setHint("A name is needed."))}
      onClose={onClose}
      danger={
        initial ? (
          <button type="button" className="cap-btn" data-variant="danger">
            Remove {initial.name}
          </button>
        ) : undefined
      }
    >
      <Field label="Name">
        <input
          className="cap-input"
          id={f("name")}
          ref={first}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="Origin" help="The site's address, with https.">
        <input
          className="cap-input"
          id={f("origin")}
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        />
      </Field>
      {sent ? (
        <p className="cap-config-full" role="status">
          Preview opened.
        </p>
      ) : null}
    </ConfigForm>
  );
}

function Editor() {
  const sites: Site[] = [
    { name: "example.com", origin: "https://example.com" },
    { name: "docs", origin: "https://docs.example.com" },
  ];
  const ed = useEditor<Site>();
  return (
    <>
      <div className="cap-config-actions">
        <button
          type="button"
          className="cap-btn"
          data-variant="primary"
          onClick={ed.add}
          disabled={ed.editing?.kind === "add"}
        >
          Add site
        </button>
      </div>
      {ed.editing && (
        <SiteForm
          key={ed.formKey}
          initial={ed.editing.kind === "edit" ? ed.editing.row : null}
          onClose={ed.close}
        />
      )}
      <ul>
        {sites.map((s) => (
          <li key={s.name}>
            {s.name}{" "}
            <button
              type="button"
              className="cap-link-btn"
              aria-pressed={ed.isEditing(s.name)}
              onClick={() => ed.edit(s, s.name)}
            >
              Edit {s.name}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

const el = document.querySelector<HTMLElement>("[data-mount='editor']");
if (el)
  createRoot(el).render(
    <StrictMode>
      <Editor />
    </StrictMode>,
  );
