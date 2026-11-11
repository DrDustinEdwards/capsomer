// Mounts the specimens, each with its value shown beside it so a test can read what a form sends.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { RichTextField, type RichTextFieldProps } from "./rich-text-field.react.tsx";

function Shown(props: Omit<RichTextFieldProps, "onValueChange">) {
  const [value, setValue] = useState("");
  return (
    <>
      <RichTextField {...props} onValueChange={setValue} />
      <output className="cap-muted" data-value="">
        {value}
      </output>
    </>
  );
}

const specimens: Record<string, Omit<RichTextFieldProps, "onValueChange">> = {
  title: {
    name: "title",
    label: "Title",
    tags: ["em"],
    initialHTML: "Field notes on <em>Example species</em> in spring",
  },
  body: {
    name: "body",
    label: "Body",
    tags: ["em", "sup", "sub"],
    lines: "multi",
    wordCount: true,
    initialHTML:
      "Samples held at 4 °C reached 10<sup>6</sup> cells per mL in CO<sub>2</sub>-rich air.",
  },
  help: {
    name: "summary",
    label: "Summary",
    tags: ["em"],
    required: true,
    help: "One sentence. Italic is for names that are always italic.",
  },
  error: {
    name: "caption",
    label: "Caption",
    tags: ["em"],
    error: "Write a caption, or mark the figure decorative.",
  },
  all: {
    name: "note",
    label: "Note",
    tags: ["em", "strong", "sup", "sub", "code"],
    lines: "multi",
    initialHTML: "Run <code>npm test</code> <strong>before</strong> the <em>Spring update</em>.",
  },
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const props = specimens[el.dataset.mount ?? ""];
  if (!props) continue;
  createRoot(el).render(
    <StrictMode>
      <Shown {...props} />
    </StrictMode>,
  );
}
