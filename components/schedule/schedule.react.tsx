import type { ReactNode } from "react";
import {
  NO_DATE,
  dayLabel,
  slotParts,
  tracksLabel,
  zoneLine,
  type ScheduleDay,
  type ScheduleSlot,
} from "./schedule.ts";
import { plainLink } from "../hooks/hooks.react.tsx";

type Level = 2 | 3 | 4;

export interface ScheduleLinkProps {
  href: string;
  className: string;
  "aria-current"?: "page";
  children: ReactNode;
}

export interface ScheduleDayNavProps {
  days: readonly string[];
  current: string | null;
  hrefFor: (key: string) => string;
  label?: string;
  noDate?: string;
  year?: boolean;
  children?: ReactNode;
  renderLink?: (props: ScheduleLinkProps) => ReactNode;
}

// The days as links, not tabs: each day has its own address, so Back and a shared link land on the same day.
export function ScheduleDayNav({
  days,
  current,
  hrefFor,
  label = "Days",
  noDate,
  year = false,
  children,
  renderLink = plainLink,
}: ScheduleDayNavProps) {
  if (days.length === 0 && children == null) return null;
  return (
    <div className="cap-schedule-daybar">
      <nav className="cap-schedule-daynav" aria-label={label}>
        <ul>
          {days.map((key) => (
            <li key={key}>
              {renderLink({
                href: hrefFor(key),
                className: "cap-schedule-day-link",
                "aria-current": key === current ? "page" : undefined,
                children:
                  key === NO_DATE ? (
                    dayLabel(key, { noDate })
                  ) : (
                    <time dateTime={key}>{dayLabel(key, { year })}</time>
                  ),
              })}
            </li>
          ))}
        </ul>
      </nav>
      {children != null && <div className="cap-schedule-daybar-extra">{children}</div>}
    </div>
  );
}

export interface ScheduleProps<T> {
  days: readonly ScheduleDay<T>[];
  zone?: string;
  // Draws one item; `level` is the heading level for its title, one under the slot's.
  renderItem: (item: T, level: Level | 5) => ReactNode;
  keyOf: (item: T) => string;
  // The track's name shown above a parallel item; unnamed tracks are "Track 1", "Track 2".
  trackOf?: (item: T) => string | null | undefined;
  level?: 2 | 3;
  dayHeadings?: boolean;
  zoneNote?: boolean;
  idPrefix?: string;
  noDate?: string;
  year?: boolean;
  empty?: ReactNode;
  slotFooter?: (slot: ScheduleSlot<T>) => ReactNode;
}

function SlotTime({ slot, zone }: { slot: ScheduleSlot<unknown>; zone: string }) {
  return (
    <>
      {slotParts(slot.start, slot.end, zone).map((p, i) =>
        typeof p === "string" ? (
          p
        ) : (
          <time key={i} dateTime={new Date(p.at).toISOString()}>
            {p.text}
          </time>
        ),
      )}
    </>
  );
}

// Each day is a section with its heading, each slot a list item with its time as the heading, and
// parallel tracks a list of named tracks: it reads in time order with or without styles.
export function Schedule<T>({
  days,
  zone = "UTC",
  renderItem,
  keyOf,
  trackOf,
  level = 2,
  dayHeadings = true,
  zoneNote = true,
  idPrefix,
  noDate = "To be scheduled",
  year = false,
  empty = "Nothing scheduled.",
  slotFooter,
}: ScheduleProps<T>) {
  const DayH = `h${level}` as "h2" | "h3";
  const slotLevel = (dayHeadings ? level + 1 : level) as Level;
  const SlotH = `h${slotLevel}` as "h2" | "h3" | "h4";
  const itemLevel = (slotLevel + 1) as Level | 5;
  const first = days.flatMap((d) => d.slots).find((s) => s.start !== null)?.start ?? null;
  return (
    <div className="cap-schedule">
      {zoneNote && first !== null && <p className="cap-schedule-zone">{zoneLine(first, zone)}</p>}
      {days.map((day) => (
        <section
          key={day.key}
          className="cap-schedule-day"
          id={idPrefix ? `${idPrefix}${day.key}` : undefined}
        >
          {dayHeadings && (
            <DayH className="cap-schedule-day-title">
              {day.key === NO_DATE ? (
                dayLabel(day.key, { noDate })
              ) : (
                <time dateTime={day.key}>{dayLabel(day.key, { year })}</time>
              )}
            </DayH>
          )}
          {day.slots.length === 0 ? (
            <p className="cap-schedule-empty">{empty}</p>
          ) : (
            <ol className="cap-schedule-slots">
              {day.slots.map((slot, i) => (
                <li
                  key={slot.items[0] ? keyOf(slot.items[0]) : i}
                  className="cap-schedule-slot"
                  data-parallel={slot.parallel ? "" : undefined}
                >
                  <div className="cap-schedule-when">
                    <SlotH className="cap-schedule-time">
                      <SlotTime slot={slot} zone={zone} />
                    </SlotH>
                    {slot.parallel && (
                      <p className="cap-schedule-count">{tracksLabel(slot.items.length)}</p>
                    )}
                  </div>
                  <div className="cap-schedule-body">
                    {slot.parallel ? (
                      <ul className="cap-schedule-tracks" role="list">
                        {slot.items.map((item, n) => (
                          <li key={keyOf(item)} className="cap-schedule-track">
                            <p className="cap-schedule-track-name">
                              {trackOf?.(item) || `Track ${n + 1}`}
                            </p>
                            {renderItem(item, itemLevel)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      slot.items.map((item) => {
                        const track = trackOf?.(item);
                        return (
                          <div key={keyOf(item)} className="cap-schedule-track">
                            {track ? <p className="cap-schedule-track-name">{track}</p> : null}
                            {renderItem(item, itemLevel)}
                          </div>
                        );
                      })
                    )}
                    {slotFooter?.(slot)}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}
    </div>
  );
}

export interface ScheduleSessionProps {
  title: ReactNode;
  level: Level | 5;
  meta?: ReactNode;
  children?: ReactNode;
}

export function ScheduleSession({ title, level, meta, children }: ScheduleSessionProps) {
  const H = `h${level}` as "h3" | "h4" | "h5";
  return (
    <article className="cap-schedule-session">
      <H className="cap-schedule-session-title">{title}</H>
      {meta != null && <div className="cap-schedule-session-meta">{meta}</div>}
      {children}
    </article>
  );
}
