// Mounts the rich editor's specimens. startPage() runs first, as in a site's client entry, so the
// page has the network's Trusted Types default policy before anything renders.
import { startPage } from "@dustinedwards/site-runtime/page-client";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

import { RichEditor } from "./rich-editor.react.tsx";

startPage();

const targets = [
  { href: "/writing/getting-started", title: "Getting started" },
  { href: "/writing/spring-update", title: "Spring update", note: "not live yet (draft)" },
  { href: "/writing/field-notes", title: "Field notes" },
];
const scaffolds = [
  {
    id: "note",
    label: "Note",
    hint: "A boxed aside",
    text: ":::note\nWrite the note here.\n:::",
    cursorAfter: ":::note\n",
  },
];
const opening = `## Release notes

The **spring update** moves the checks to the edge, so one _slow_ network no longer pages anyone at night. See [Getting started](/writing/getting-started).

- Checks every 5 minutes
- A quiet hour is the default
`;
const source = `---
title: Annual report
---

Prose is formatted, and the rest keeps its Markdown.

| Quarter | Posts |
| ------- | ----- |
| Q1      | 12    |

:::note
A directive the editor does not format.
:::
`;

/** A pretend upload: answers with a path after a moment, or fails for a file named fail.png. */
async function upload(file: File, _image: unknown, signal: AbortSignal) {
  await new Promise((done, fail) => {
    const t = setTimeout(done, 300);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      fail(new Error("Canceled."));
    });
  });
  if (file.name === "fail.png") throw new Error("The upload failed: the server said no.");
  return { url: `/media/${file.name}` };
}

function Default() {
  const [text, setText] = useState(opening);
  return (
    <>
      <RichEditor
        ariaLabel="Body, formatted"
        value={text}
        onChange={setText}
        readOnly={false}
        dialect="site"
        scaffolds={scaffolds}
        linkTargets={targets}
        onUpload={upload}
        accept="image/*"
      />
      <p>Markdown the app is given:</p>
      <pre className="cap-mono" id="rich-md">
        {text}
      </pre>
    </>
  );
}

const mounts: Record<string, () => React.ReactNode> = {
  default: () => <Default />,
  source: () => (
    <RichEditor
      ariaLabel="Report, formatted"
      value={source}
      onChange={() => {}}
      readOnly={false}
      dialect="site"
    />
  ),
  readonly: () => (
    <RichEditor
      ariaLabel="Release notes, formatted"
      value={opening}
      onChange={() => {}}
      readOnly
      dialect="site"
    />
  ),
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]"))
  createRoot(el).render(<StrictMode>{mounts[el.dataset.mount!]!()}</StrictMode>);
