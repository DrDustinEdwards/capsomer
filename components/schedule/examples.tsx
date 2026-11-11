// Mounts the schedule specimens. Every element with data-mount="<state>" gets that state.
import { StrictMode, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { dayKeys, dayRange, groupByDay, pickDay } from "./schedule.ts";
import { Schedule, ScheduleDayNav, ScheduleSession } from "./schedule.react.tsx";

interface Session {
  id: string;
  title: string;
  starts: string | null;
  ends: string | null;
  room: string | null;
  chair?: string;
  talks?: string[];
  order: number;
}

const SESSIONS: Session[] = [
  {
    id: "s1",
    title: "Welcome and getting started",
    starts: "2027-03-05T14:00:00Z",
    ends: "2027-03-05T14:30:00Z",
    room: "Main hall",
    chair: "Alex Rivera",
    order: 1,
  },
  {
    id: "s2",
    title: "Field notes",
    starts: "2027-03-05T14:45:00Z",
    ends: "2027-03-05T16:00:00Z",
    room: "Room A",
    chair: "Sam Lee",
    talks: ["Notes from the spring survey", "What the logs showed"],
    order: 2,
  },
  {
    id: "s3",
    title: "Release notes",
    starts: "2027-03-05T14:45:00Z",
    ends: "2027-03-05T15:45:00Z",
    room: "Room B",
    chair: "Jordan Park",
    talks: ["Version 4 in practice", "Moving off the old importer"],
    order: 3,
  },
  {
    id: "s4",
    title: "Annual report",
    starts: "2027-03-05T15:00:00Z",
    ends: "2027-03-05T16:00:00Z",
    room: "Room C",
    talks: ["The year in numbers"],
    order: 4,
  },
  {
    id: "s5",
    title: "Spring update",
    starts: "2027-03-06T15:00:00Z",
    ends: "2027-03-06T16:30:00Z",
    room: "Main hall",
    chair: "Alex Rivera",
    talks: ["Example Co's plans for the year"],
    order: 5,
  },
  {
    id: "s6",
    title: "Poster walk",
    starts: null,
    ends: null,
    room: null,
    order: 6,
  },
];

const times = (s: Session) => ({ start: s.starts, end: s.ends, track: s.room, order: s.order });

function Item({ s, level }: { s: Session; level: 3 | 4 | 5 | 2 }) {
  return (
    <ScheduleSession
      title={s.title}
      level={level}
      meta={s.chair ? <p>Chaired by {s.chair}</p> : undefined}
    >
      {s.talks?.length ? (
        <ol className="cap-schedule-talks">
          {s.talks.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
      ) : null}
    </ScheduleSession>
  );
}

function Program({ zone = "UTC", name }: { zone?: string; name: string }) {
  const days = groupByDay(SESSIONS, times, zone);
  return (
    <div className="schedule-col">
      <ScheduleDayNav
        days={dayKeys(days)}
        current={null}
        hrefFor={(k) => `#${name}-day-${k}`}
        label={`Meeting days (${name})`}
        noDate="To be scheduled"
      />
      <Schedule
        days={days}
        zone={zone}
        level={3}
        idPrefix={`${name}-day-`}
        keyOf={(s) => s.id}
        trackOf={(s) => s.room}
        renderItem={(s, level) => <Item s={s} level={level} />}
      />
    </div>
  );
}

// The builder's form: one day at a time, chosen from the nav; the app keeps the day in ?day=.
function OneDay({ empty = false }: { empty?: boolean }) {
  const days = groupByDay(SESSIONS, times);
  const range = dayRange("2027-03-05T14:00:00Z", "2027-03-07T18:00:00Z");
  const [added, setAdded] = useState<string | null>(null);
  const keys = dayKeys(days, range, added);
  const [wanted, setWanted] = useState(empty ? "2027-03-07" : "2027-03-05");
  const current = pickDay(keys, wanted);
  const day = days.find((d) => d.key === current) ?? { key: current ?? "", slots: [] };
  const id = empty ? "add-empty" : "add-day";
  return (
    <div className="schedule-col">
      <ScheduleDayNav
        days={keys}
        current={current}
        hrefFor={(k) => `?day=${k}`}
        label={empty ? "Meeting days (empty day)" : "Meeting days"}
        renderLink={({ href, children, ...rest }) => (
          <a
            {...rest}
            href={href}
            onClick={(e) => {
              e.preventDefault();
              setWanted(href.slice(5));
            }}
          >
            {children}
          </a>
        )}
      >
        <label className="cap-field-label" htmlFor={id}>
          Add a day
        </label>
        <input
          id={id}
          type="date"
          className="cap-input"
          value=""
          onChange={(e) => {
            if (e.target.value) {
              setAdded(e.target.value);
              setWanted(e.target.value);
            }
          }}
        />
      </ScheduleDayNav>
      <Schedule
        days={[day]}
        level={3}
        keyOf={(s) => s.id}
        trackOf={(s) => s.room}
        renderItem={(s, level) => <Item s={s} level={level} />}
      />
    </div>
  );
}

const SPECIMENS: Record<string, () => ReactNode> = {
  program: () => <Program name="program" />,
  day: () => <OneDay />,
  zone: () => <Program zone="America/Chicago" name="zone" />,
  empty: () => <OneDay empty />,
  narrow: () => (
    <Schedule
      days={groupByDay(SESSIONS.slice(1, 4), times)}
      level={3}
      keyOf={(s) => s.id}
      trackOf={(s) => s.room}
      renderItem={(s, level) => <Item s={s} level={level} />}
    />
  ),
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
