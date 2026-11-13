// Mounts the React specimens: each holds its file in state and shows it under the boxes, so a
// change is seen landing in the text.
import { StrictMode, useState, type JSX } from "react";
import { createRoot } from "react-dom/client";
import {
  FrontmatterFields,
  type FieldSpec,
  type FrontmatterFieldsProps,
} from "./frontmatter-fields.react.tsx";

const SCENE = `---
title: Getting started
date: 2026-10-04
characters: [Alex Rivera, Sam Lee]
reviewed: false
beats:
  - "Arrives late, then early."
  - Finds the note
summary: |
  Two lines
  of text.
---
The scene starts here.
`;

const POST = `---
title: "Spring update"
tags: [release notes, field notes]
---
The post starts here.
`;

const POST_FIELDS: FieldSpec[] = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description", box: "text" },
  { key: "tags", label: "Tags", box: "list" },
  { key: "takeaways", label: "Key takeaways", box: "lines" },
  {
    key: "banner",
    label: "Draft banner",
    box: "flag",
    flag: { on: "Draft", off: null },
    help: 'Shows the word "Draft" on the page until you are satisfied with it.',
  },
];

const RECIPE = `---
servings: 4
steps:
  - mix: flour
  - bake: 20 minutes
---
Notes.
`;

function Held({
  start,
  id,
  ...rest
}: { start: string; id: string } & Partial<FrontmatterFieldsProps>) {
  const [source, setSource] = useState(start);
  return (
    <>
      <FrontmatterFields source={source} onChange={setSource} {...rest} />
      <pre className="cap-mono" id={id}>
        {source}
      </pre>
    </>
  );
}

const mounts: Record<string, () => JSX.Element> = {
  typed: () => <Held start={SCENE} id="typed-source" legend="Scene details" />,
  specs: () => (
    <Held start={POST} id="specs-source" legend="Post details" fields={POST_FIELDS} extra="text" />
  ),
  readonly: () => (
    <FrontmatterFields source={POST} fields={POST_FIELDS} legend="Post details" readOnly />
  ),
  text: () => <Held start={RECIPE} id="text-source" legend="Recipe details" extra="text" />,
  none: () => (
    <FrontmatterFields
      source="Just a body."
      legend="Details"
      empty={
        <p className="cap-muted">This file has no frontmatter, so it has no details to set.</p>
      }
    />
  ),
};
for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const make = mounts[el.dataset.mount ?? ""];
  if (make) createRoot(el).render(<StrictMode>{make()}</StrictMode>);
}
