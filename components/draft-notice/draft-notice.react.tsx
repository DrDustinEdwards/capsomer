import type { ReactNode } from "react";

export interface DraftNoticeProps {
  // Draws nothing when false, so a page writes `<DraftNotice show={draft} />` in place of a conditional.
  show?: boolean;
  // The word in the box.
  label?: string;
  // The sentence after it: who can see the page.
  children?: ReactNode;
}

// The line at the top of a draft page that only its author can see. Which viewer may see a draft is
// the server's decision (site-runtime's draftGate); this only says so on the page it lets through.
export function DraftNotice({
  show = true,
  label = "Draft",
  children = "Only you can see this page.",
}: DraftNoticeProps) {
  if (!show) return null;
  return (
    <p className="cap-draft-notice">
      <span className="cap-draft-notice-tag">
        {label}
        <span className="cap-sr-only">:</span>
      </span>
      <span>{children}</span>
    </p>
  );
}
