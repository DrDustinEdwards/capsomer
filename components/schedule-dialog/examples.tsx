// Mounts the React specimens: an opening button, the dialog, and the ISO time it sent.
import { StrictMode, useState, type JSX } from "react";
import { createRoot } from "react-dom/client";
import { ScheduleDialog } from "./schedule-dialog.react.tsx";

function Demo({ id, current }: { id: string; current?: string }) {
  const [open, setOpen] = useState(false);
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const [sent, setSent] = useState("Nothing scheduled.");
  return (
    <>
      <button
        type="button"
        className="cap-btn"
        aria-haspopup="dialog"
        onClick={(e) => {
          setOpener(e.currentTarget);
          setOpen(true);
        }}
      >
        {current ? "Replace the update" : "Schedule"}
      </button>
      <ScheduleDialog
        open={open}
        onClose={() => setOpen(false)}
        returnTo={opener}
        current={current}
        title={current ? "Replace the scheduled update" : "Schedule this post"}
        description={
          current
            ? "The live post stays as it is. The site publishes the text in the editor at the time you choose, in place of the update scheduled now."
            : "The site publishes it at the time you choose. Revert to draft takes it back."
        }
        confirm={current ? "Replace the update" : "Schedule"}
        onSchedule={(iso) => setSent(`Scheduled for ${iso}.`)}
      />
      <p className="cap-muted" id={id}>
        {sent}
      </p>
    </>
  );
}

const inAWeek = new Date(Date.now() + 7 * 24 * 3_600_000);
inAWeek.setSeconds(0, 0);
const mounts: Record<string, () => JSX.Element> = {
  new: () => <Demo id="sent-new" />,
  replace: () => <Demo id="sent-replace" current={inAWeek.toISOString()} />,
};
for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const make = mounts[el.dataset.mount ?? ""];
  if (make) createRoot(el).render(<StrictMode>{make()}</StrictMode>);
}
