// Mounts the needs list specimens: a person's work queue with Later. Every element with
// data-mount="<state>" gets that state. The row form stands in for an app's router: a submit is
// held in the page and the row stays away, as it would while its fetcher is under way.
import { StrictMode, useState, type ComponentProps } from "react";
import { createRoot } from "react-dom/client";
import { MessageProvider } from "../message/message.react.tsx";
import type { RowForm } from "../row-list/row-list.react.tsx";
import { NeedsList, type Need } from "./attention-list.react.tsx";

const NEEDS: Need[] = [
  {
    id: "flag-1",
    group: "flags",
    urgency: "blocking",
    title: "A broken link in Spring update",
    detail: "dustinedwards.info",
    action: { label: "Fix", href: "#flag-1" },
    at: "2026-10-01T09:00:00Z",
  },
  {
    id: "ai-1",
    group: "ai",
    urgency: "waiting",
    title: "AI draft of the October letter",
    detail: "Letters",
    action: { label: "Review", href: "#ai-1" },
    at: "2026-10-02T09:00:00Z",
  },
  {
    id: "due-1",
    group: "due",
    urgency: "waiting",
    title: "Field notes, due today",
    action: { label: "Open", href: "#due-1" },
    at: null,
  },
  {
    id: "ai-2",
    group: "ai",
    urgency: "waiting",
    title: "AI draft of the reading list",
    action: { label: "Review", href: "#ai-2" },
    at: "2026-09-30T09:00:00Z",
    later: "2026-10-03T13:00:00Z",
  },
];

function useHeldRowForm(): RowForm {
  const [pending, setPending] = useState(false);
  // One form component for the row's life, as a router's fetcher form is.
  const [Form] = useState(() => ({ onSubmit, ...props }: ComponentProps<"form">) => (
    <form
      {...props}
      onSubmit={(e) => {
        onSubmit?.(e);
        e.preventDefault();
        setPending(true);
      }}
    />
  ));
  return { Form: Form as RowForm["Form"], pending };
}

const SPECIMENS: Record<string, () => React.ReactNode> = {
  needs: () => (
    <NeedsList
      needs={NEEDS}
      show="all"
      zone="America/Chicago"
      useRowForm={useHeldRowForm}
      searchKey="Ctrl"
    />
  ),
  later: () => (
    <NeedsList needs={NEEDS} show="later" zone="America/Chicago" useRowForm={useHeldRowForm} />
  ),
  empty: () => <NeedsList needs={[]} show="all" zone="UTC" />,
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render)
    createRoot(el).render(
      <StrictMode>
        <MessageProvider>{render()}</MessageProvider>
      </StrictMode>,
    );
}
