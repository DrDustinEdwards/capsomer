// Mounts the React author lists into the mount points of examples.html.
import { StrictMode, useEffect, useRef, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { AuthorList } from "./author-list.react.tsx";

const owner = (name: string) => name === "Alex Rivera";
const MANY = [
  "Sam Lee",
  "Jordan Park",
  "Riley Chen",
  "Morgan Diaz",
  "Casey Brooks",
  "Alex Rivera",
  "Taylor Quinn",
  "Drew Patel",
];

// The opened specimen starts open, as after a click on its summary.
function Opened() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector("details")?.setAttribute("open", "");
  }, []);
  return (
    <div ref={ref}>
      <AuthorList authors={MANY} isOwner={owner} collapse={3} />
    </div>
  );
}

const specimens: Record<string, ReactNode> = {
  short: <AuthorList authors={["Sam Lee", "Alex Rivera", "Jordan Park"]} isOwner={owner} />,
  linked: (
    <AuthorList
      authors={[
        { name: "Alex Rivera", href: "https://example.com/people/alex-rivera" },
        "Sam Lee",
        { name: "Jordan Park", href: "https://example.org/jordan-park" },
      ]}
      isOwner={owner}
    />
  ),
  folded: (
    <AuthorList
      authors={["Sam Lee", "Alex Rivera", ...MANY.slice(1).filter((n) => n !== "Alex Rivera")]}
      isOwner={owner}
      collapse={3}
    />
  ),
  "owner-late": <AuthorList authors={MANY} isOwner={owner} collapse={3} />,
  open: <Opened />,
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const node = specimens[el.dataset.mount ?? ""];
  if (node) createRoot(el).render(<StrictMode>{node}</StrictMode>);
}
