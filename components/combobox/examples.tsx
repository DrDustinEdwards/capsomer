// Mounts the combobox specimens. Every element with data-mount="<state>" gets that state.
// The open states sit in <template data-specimen> frames of their own, so one open popup
// never covers another.
import { StrictMode, useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Combobox, ComboboxMultiple, type ComboboxOption, type ComboboxProps } from "./combobox.react.tsx";

const SITES: ComboboxOption[] = [
  { value: "admin", label: "Admin portal" },
  { value: "docs", label: "Docs" },
  { value: "design", label: "Design system site" },
  { value: "news", label: "example.edu" },
  { value: "charts", label: "Charts demo" },
  { value: "shop", label: "shop.example.com" },
  { value: "shop-staging", label: "shop.example.com staging" },
  { value: "blog", label: "example.org" },
  { value: "billing", label: "Billing app" },
  { value: "billing-admin", label: "Billing admin" },
  { value: "events", label: "events" },
  { value: "field-notes", label: "Field notes" },
  { value: "reading-list", label: "Reading list" },
  { value: "uptime-probe", label: "Uptime probe" },
  { value: "watcher", label: "Watcher" },
  { value: "writing-hub-preview", label: "Writing hub preview" },
];

// The same sites under two headings, for the grouped list.
const GROUPED: ComboboxOption[] = SITES.map((s, i) => ({ ...s, group: i < 8 ? "Live sites" : "Previews and tools" }));

// A combobox that holds its own value, as an app's form would, and writes the chosen value
// beside it so a test can read what was chosen.
function Held(props: Omit<ComboboxProps, "value" | "onValueChange"> & { initial?: string | null }) {
  const { initial = null, ...rest } = props;
  const [value, setValue] = useState<string | null>(initial);
  return (
    <>
      <Combobox {...rest} value={value} onValueChange={setValue} />
      <p className="cap-muted" data-chosen={value ?? ""}>
        Chosen: {value ?? "nothing"}
      </p>
    </>
  );
}

// Tag suggestions: a tag field takes these or anything typed.
const TAGS: ComboboxOption[] = [
  { value: "news", label: "news" },
  { value: "release", label: "release" },
  { value: "field notes", label: "field notes" },
  { value: "search", label: "search" },
  { value: "uptime", label: "uptime" },
];

// A tag field that holds its own values, with the values written beside it for a test.
function Tags(props: { defaultValues?: string[]; defaultOpen?: boolean; defaultInputValue?: string }) {
  const [values, setValues] = useState<string[]>(props.defaultValues ?? []);
  return (
    <>
      <ComboboxMultiple label="Tags" items={TAGS} creatable values={values} onValuesChange={setValues} placeholder="Add a tag" help="Pick a suggestion or type a new tag and press Enter." name="tags" defaultOpen={props.defaultOpen} defaultInputValue={props.defaultInputValue} />
      <p className="cap-muted" data-tags={values.join("|")}>
        Tags: {values.length ? values.join(", ") : "none"}
      </p>
    </>
  );
}

// Highlights an option the way a keyboard does, for the static picture. The spec checks
// the real keys.
function Highlighted() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const input = ref.current?.querySelector<HTMLInputElement>(".cap-combobox-input");
      if (!input) return;
      input.focus();
      for (let i = 0; i < 2; i++) input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", code: "ArrowDown", bubbles: true }));
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div ref={ref}>
      <Held label="Site" items={SITES} placeholder="For example: docs" defaultOpen />
    </div>
  );
}

const SPECIMENS: Record<string, () => ReactNode> = {
  closed: () => <Held label="Site" items={SITES} placeholder="For example: docs" help="Type to filter. Only a listed site can be chosen." />,
  chosen: () => <Held label="Deploy to" items={SITES} initial="shop" />,
  clearable: () => <Held label="Primary site" items={SITES} initial="blog" clearable help="Clear it to choose again." />,
  chips: () => <ComboboxMultiple label="Sites to back up" items={SITES} defaultValues={["admin", "shop", "blog"]} help="Type to add another. Remove one with its button." />,
  tags: () => <Tags defaultValues={["news", "annual report"]} />,
  "open-tags": () => <Tags defaultValues={["news"]} defaultOpen defaultInputValue="ann" />,
  comfortable: () => (
    <div data-density="comfortable">
      <Held label="Deploy to" items={SITES} initial="shop" clearable />
    </div>
  ),
  disabled: () => <Held label="Site to back up" items={SITES} initial="admin" disabled help="Locked while the admin portal deploys. It unlocks when the deploy ends." />,
  invalid: () => <Held label="Site to watch" items={SITES} required error="Choose a site from the list. The watcher only checks sites it knows." />,
  open: () => <Held label="Site" items={SITES} placeholder="For example: docs" defaultOpen />,
  filtered: () => <Held label="Site" items={SITES} defaultOpen defaultInputValue="shop" />,
  "no-match": () => <Held label="Site" items={SITES} defaultOpen defaultInputValue="shoop" />,
  highlighted: () => <Highlighted />,
  "open-chips": () => <ComboboxMultiple label="Sites to back up" items={SITES} defaultValues={["admin", "shop"]} defaultOpen />,
  grouped: () => <Held label="Site" items={GROUPED} placeholder="For example: docs" defaultOpen />,
  loading: () => <Held label="Site" items={[]} loading loadingText="Loading sites" defaultOpen />,
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
