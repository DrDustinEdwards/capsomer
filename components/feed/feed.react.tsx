import { createElement, useId, type ReactNode } from "react";

export type FeedTone = "ok" | "warn" | "crit" | "info" | "nodata";

export interface FeedEvent {
  id: string;
  // event: one thing that happened. condensed: a routine run in one row. marker: where
  // an incident began, linked to the event it follows.
  kind?: "event" | "condensed" | "marker";
  tone: FeedTone;
  // What happened, with its own words for the status: "capsid deployed 366b902",
  // "germomics deploy failed". For a marker, the link's words.
  what: ReactNode;
  // Who, and any short detail: "Merged by seat."
  detail?: ReactNode;
  // Relative time as shown ("53 minutes ago") and the instant it names.
  when: ReactNode;
  at: string;
  // A condensed run's last instant: the row shows "09:10 to 11:40".
  until?: { when: ReactNode; at: string };
  // A marker's incident page.
  href?: string;
  // A marker's event: the id of the deploy it follows, which describes the link.
  about?: string;
}

export interface FeedDay {
  id: string;
  label: string;
  events: FeedEvent[];
}

export interface FeedProps {
  days: FeedDay[];
  // The day headings' level: 4 inside a panel whose title is an h3.
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

const paths: Record<FeedTone | "dot", ReactNode> = {
  crit: (
    <>
      <path fill="currentColor" d="M5 1h6l4 4v6l-4 4H5l-4-4V5z" />
      <path fill="var(--surface)" d="M7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z" />
    </>
  ),
  warn: (
    <>
      <path fill="currentColor" d="M8 1.2 15.4 14H.6z" />
      <path fill="var(--surface)" d="M7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z" />
    </>
  ),
  info: (
    <>
      <rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path fill="currentColor" d="M7.2 7h1.6v5H7.2zM7.2 4h1.6v1.7H7.2z" />
    </>
  ),
  ok: (
    <>
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <path fill="none" stroke="var(--surface)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="m4.6 8.3 2.3 2.3 4.5-4.9" />
    </>
  ),
  nodata: <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2.6 2.2" />,
  dot: <circle cx="8" cy="8" r="3.2" fill="currentColor" />,
};

function Glyph({ kind }: { kind: FeedTone | "dot" }) {
  return (
    <svg className="cap-feed-glyph" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {paths[kind]}
    </svg>
  );
}

export function Feed({ days, headingLevel = 4 }: FeedProps) {
  const prefix = useId();
  const whatId = (eventId: string) => `${prefix}-${eventId}-what`;

  return (
    <div className="cap-feed" data-cap="feed">
      {days.map((day) => {
        const headId = `${prefix}-${day.id}`;
        return (
          <div className="cap-feed-day" key={day.id}>
            {createElement(`h${headingLevel}`, { className: "cap-feed-day-title", id: headId }, day.label)}
            <ol className="cap-feed-list" aria-labelledby={headId}>
              {day.events.map((e) => {
                const kind = e.kind ?? "event";
                return (
                  <li className="cap-feed-row" data-tone={e.tone} data-kind={kind === "event" ? undefined : kind} key={e.id}>
                    <Glyph kind={kind === "condensed" ? "dot" : e.tone} />
                    <div className="cap-feed-what">
                      {kind === "marker" ? (
                        <a className="cap-feed-marker-link" href={e.href} aria-describedby={e.about ? whatId(e.about) : undefined}>
                          {e.what}
                        </a>
                      ) : (
                        <span id={whatId(e.id)}>{e.what}</span>
                      )}
                      {e.detail ? <div className="cap-feed-who">{e.detail}</div> : null}
                    </div>
                    {e.until ? (
                      <span className="cap-feed-when">
                        <time className="cap-time" dateTime={e.at}>
                          {e.when}
                        </time>{" "}
                        to{" "}
                        <time className="cap-time" dateTime={e.until.at}>
                          {e.until.when}
                        </time>
                      </span>
                    ) : (
                      <time className="cap-time cap-feed-when" dateTime={e.at}>
                        {e.when}
                      </time>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </div>
  );
}
