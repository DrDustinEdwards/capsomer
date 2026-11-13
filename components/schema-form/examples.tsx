// Mounts the schema-form specimens: one set of specs drawn as a posting form, the same form as
// a server answers a refused post, and a form held in React state with an app's own kind.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { FieldFromSpec, SchemaFields, SettingsForm } from "./schema-form.react.tsx";
import type { FieldSpec } from "./schema-form.ts";

const SPECS: FieldSpec[] = [
  { key: "org", label: "Display name", kind: "text", required: true },
  { key: "contact", label: "Contact email", kind: "email", help: "Shown in the footer." },
  {
    key: "plan",
    label: "Plan",
    kind: "choice",
    options: [
      { value: "free", label: "Free" },
      { value: "team", label: "Team" },
    ],
  },
  { key: "opens", label: "Registration opens", kind: "datetime", timeZone: "America/Chicago" },
  { key: "fee", label: "Fee", kind: "money" },
  { key: "public", label: "List on the home page", kind: "checkbox" },
  { key: "topics", label: "Topics", kind: "lines", help: "One per line." },
  { key: "hosts", label: "Hosts", kind: "json", help: "A JSON array of names." },
];

const VALUES = {
  org: "Example Co",
  contact: "team@example.com",
  plan: "team",
  opens: new Date("2026-12-01T15:00:00Z"),
  fee: 2500,
  public: true,
  topics: ["Getting started", "Spring update"],
  hosts: ["Alex Rivera", "Sam Lee"],
};

function Held() {
  const [values, setValues] = useState<Record<string, unknown>>({
    id: "job_7f3a",
    title: "Field notes",
    rating: 3,
  });
  const specs: FieldSpec[] = [
    { key: "id", label: "Id", kind: "readonly" },
    { key: "title", label: "Title", kind: "text" },
    {
      key: "rating",
      label: "Rating",
      kind: "stars",
      help: "An app's own kind, drawn by its renderer.",
    },
  ];
  return (
    <>
      <SchemaFields
        specs={specs}
        values={values}
        idPrefix="held"
        onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
        renderers={{
          stars: ({ spec, value, onChange }) => (
            <FieldFromSpec
              spec={{ ...spec, kind: "number", min: 1, max: 5 }}
              idPrefix="held"
              value={value}
              onChange={onChange}
            />
          ),
        }}
      />
      <p className="cap-muted">Title is now: {String(values.title ?? "")}</p>
    </>
  );
}

const MOUNTS = {
  settings: (
    <SettingsForm specs={SPECS} values={VALUES} action="#" idPrefix="a" status="Settings saved." />
  ),
  errors: (
    <SettingsForm
      specs={SPECS.slice(0, 2)}
      values={{ org: "", contact: "team-at-example" }}
      action="#"
      idPrefix="b"
      errors={[
        { key: "org", text: "Enter display name." },
        { key: "contact", text: "Enter an email address, like name@example.com." },
      ]}
    />
  ),
  held: <Held />,
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const node = MOUNTS[el.dataset.mount as keyof typeof MOUNTS];
  if (node) createRoot(el).render(<StrictMode>{node}</StrictMode>);
}
