import type { ReactNode } from "react";
import { Icon, iconMail, markFacebook, markLinkedin, markX } from "../icons/icons.react.tsx";
import { awayRel, awayWords } from "../link/link.react.tsx";
import { SHARE_NAMES, shareHref, type ShareTarget } from "./share-row.ts";

// The services' marks, the icon set's (a mark is filled). Bluesky's is not in the set yet: its
// butterfly on a 14-unit grid.
const MARKS: Record<ShareTarget, { d: string; fill?: boolean; box?: number }> = {
  x: markX,
  linkedin: markLinkedin,
  bluesky: {
    d: "M3.03 1.6C4.64 2.8 6.37 5.25 7 6.56c.63-1.31 2.36-3.76 3.97-4.96C12.13.73 14 .06 14 2.2c0 .43-.25 3.6-.39 4.11-.5 1.79-2.33 2.25-3.96 1.97 2.85.49 3.58 2.1 2.01 3.7-2.97 3.05-4.27-.76-4.6-1.74L7 10.06l-.06.18c-.33.98-1.63 4.79-4.6 1.74-1.57-1.6-.84-3.21 2.01-3.7-1.63.28-3.46-.18-3.96-1.97C.25 5.8 0 2.63 0 2.2 0 .06 1.87.73 3.03 1.6Z",
    fill: true,
    box: 14,
  },
  facebook: markFacebook,
  email: { d: iconMail },
};

export interface ShareRowProps {
  // The page's own address and title.
  url: string;
  title: string;
  // The services, in order. Default: X and LinkedIn.
  targets?: ShareTarget[];
  label?: ReactNode;
  // More controls after the links: Capsomer's copy button for "Copy link".
  children?: ReactNode;
}

// The HTML contract in share-row.md.
export function ShareRow({
  url,
  title,
  targets = ["x", "linkedin"],
  label = "Share",
  children,
}: ShareRowProps) {
  return (
    <div className="cap-share" role="group" aria-label="Share this page">
      <span className="cap-share-label" aria-hidden="true">
        {label}
      </span>
      {targets.map((t) => (
        <a
          key={t}
          className="cap-share-link"
          href={shareHref(t, url, title)}
          aria-label={`Share on ${SHARE_NAMES[t]}${t === "email" ? "" : awayWords()}`}
          {...(t === "email" ? {} : { rel: awayRel() })}
        >
          <Icon {...MARKS[t]} />
          {SHARE_NAMES[t]}
        </a>
      ))}
      {children}
    </div>
  );
}
