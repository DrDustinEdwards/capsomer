// Mounts the specimens: ApprovalQueue as a host would hold it, with a small in-memory queue
// standing in for the app's action, so every decision can be tried on one page.
import {
  StrictMode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { setStaticHtml } from "../trusted-html/trusted-html.ts";
import {
  ApprovalQueue,
  type ApprovalAction,
  type ApprovalItem,
  type FormComponent,
} from "./approval-queue.react.tsx";

const NOW = Date.parse("2026-11-10T12:00:00Z");

const approve: ApprovalAction = { intent: "approve", label: "Approve", variant: "primary" };
const edit: ApprovalAction = { intent: "edit", label: "Save and check again" };
const byHand: ApprovalAction = { intent: "by-hand", label: "I posted it by hand" };
const reject: ApprovalAction = {
  intent: "reject",
  label: "Reject",
  variant: "danger",
  confirm: {
    title: "Reject this post?",
    lead: "It will not be posted, and it cannot be brought back. A new draft can still be written.",
    action: "Reject post",
  },
};

const ITEMS: ApprovalItem[] = [
  {
    id: "p-1",
    who: "Example Co on Bluesky",
    status: { tone: "info", word: "Awaiting approval" },
    context: 'Drafted by the routine · for "Spring update"',
    text: "The spring update is out: three new guides and a faster search. Read it at example.com/spring",
    editable: true,
    at: "2026-11-10T10:40:00Z",
    actions: [approve, edit, reject],
  },
  {
    id: "p-2",
    who: "Example Co on X",
    status: { tone: "warn", word: "Held by the check" },
    context: 'From the template · for "Release notes" · $0.015 through the API',
    findings: ["Longer than 280 characters", "The link is missing"],
    text: "Release notes for November: every change to the reader, the editor and the search, with the reasons behind each one, and what is coming in the next release after that, all in one long post.",
    editable: true,
    at: "2026-11-10T09:05:00Z",
    actions: [edit, reject],
  },
  {
    id: "p-3",
    who: "Alex Rivera on Bluesky",
    status: { tone: "info", word: "Awaiting approval" },
    context: 'Drafted by the routine · for "Field notes"',
    text: "New field notes: what a season of reading taught me about keeping a list.",
    editable: true,
    at: "2026-11-09T18:20:00Z",
    actions: [approve, edit, byHand, reject],
  },
];

// The app's action, in memory: approve, by hand and reject take the item off the queue; edit
// keeps it and checks the text again.
function Live({ start }: { start: ApprovalItem[] }) {
  const [items, setItems] = useState(start);
  const [said, setSaid] = useState("");
  const current = useRef(items);
  useLayoutEffect(() => {
    current.current = items;
  });
  // One form component for the life of the specimen, so a decision does not remount every form.
  const SpecimenForm = useMemo<FormComponent>(
    () => (props) => (
      <form
        {...props}
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
          const id = String(data.get("id"));
          const intent = String(data.get("intent"));
          const who = current.current.find((i) => i.id === id)?.who ?? id;
          if (intent === "edit") {
            const text = String(data.get("text") ?? "");
            setItems((all) =>
              all.map((i) =>
                i.id === id
                  ? {
                      ...i,
                      text,
                      findings: text.length > 280 ? ["Longer than 280 characters"] : [],
                      status:
                        text.length > 280
                          ? { tone: "warn", word: "Held by the check" }
                          : { tone: "info", word: "Awaiting approval" },
                      actions: text.length > 280 ? [edit, reject] : [approve, edit, reject],
                    }
                  : i,
              ),
            );
            setSaid(`Saved the text for ${who} and checked it again.`);
            return;
          }
          setItems((all) => all.filter((i) => i.id !== id));
          setSaid(
            `${intent === "reject" ? "Rejected" : intent === "approve" ? "Approved" : "Marked as posted by hand"}: ${who}.`,
          );
        }}
      />
    ),
    [],
  );
  return (
    <>
      <ApprovalQueue items={items} label="Waiting on you" Form={SpecimenForm} now={NOW} />
      <p className="cap-muted" role="status">
        {said}
      </p>
    </>
  );
}

function Closed() {
  return (
    <ApprovalQueue
      items={[{ ...ITEMS[0]!, id: "r-1", editable: false, actions: [approve, reject] }]}
      label="Read only text"
      now={NOW}
    />
  );
}

const mounts: Record<string, () => ReactElement> = {
  queue: () => <Live start={ITEMS} />,
  readonly: () => <Closed />,
  pending: () => (
    <ApprovalQueue
      items={ITEMS.slice(0, 1).map((i) => ({ ...i, id: "b-1" }))}
      label="Waiting on you"
      pending
      now={NOW}
    />
  ),
  empty: () => (
    <ApprovalQueue
      items={[]}
      label="Waiting on you"
      empty={{ title: "All clear", text: "Nothing is waiting." }}
    />
  ),
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const make = mounts[el.dataset.mount ?? ""];
  if (make) createRoot(el).render(<StrictMode>{make()}</StrictMode>);
}

const staticHost = document.getElementById("approval-static");
if (staticHost)
  setStaticHtml(
    staticHost,
    renderToStaticMarkup(
      <ApprovalQueue items={ITEMS.slice(0, 2)} label="Waiting on you (delivered)" now={NOW} />,
      { identifierPrefix: "static" },
    ),
  );
