// The parts around a track's player: its chapters as a list, its key moments, its hosts, and the
// inline audio button that plays a short clip inside running text.
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Avatar } from "../avatar/avatar.react.tsx";
import {
  activeChapterIndex,
  enhance,
  formatTime,
  type PlayerChapter,
  type PlayerTrack,
} from "./player.ts";
import { usePlayer } from "./player-context.react.tsx";

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Seeks the loaded track, or loads this one at that time.
function useSeekTrack(track: PlayerTrack) {
  const p = usePlayer();
  const active = p.current?.id === track.id;
  return {
    now: active ? p.currentTime : -1,
    go: (seconds: number) => (active ? p.seek(seconds) : p.playTrackAt(track, seconds)),
  };
}

export interface ChapterListProps {
  track: PlayerTrack;
  // The track's chapters by default.
  chapters?: readonly PlayerChapter[];
  heading?: string;
  // The heading's level, 2 by default.
  level?: 2 | 3;
}

// Every chapter, the one playing marked (aria-current) and a press seeks to it.
export function ChapterList({
  track,
  chapters,
  heading = "Chapters",
  level = 2,
}: ChapterListProps) {
  const list = chapters ?? track.chapters ?? [];
  const { now, go } = useSeekTrack(track);
  const id = useId();
  if (!list.length) return null;
  const cur = now < 0 ? -1 : activeChapterIndex(list, now);
  const H = level === 3 ? "h3" : "h2";
  return (
    <section className="cap-player-list" aria-labelledby={id}>
      <H className="cap-player-list-heading" id={id}>
        {heading}
      </H>
      <ol className="cap-player-chapters">
        {list.map((c, i) => (
          <li key={`${c.start}-${c.title}`}>
            <button
              type="button"
              className="cap-player-chapter"
              aria-current={i === cur ? "true" : undefined}
              onClick={() => go(c.start)}
            >
              <span className="cap-player-at">{formatTime(c.start)}</span>
              <span className="cap-player-chapter-title">{c.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

export interface KeyMoment {
  seconds: number;
  label: string;
}

export interface KeyMomentsProps {
  track: PlayerTrack;
  moments: readonly KeyMoment[];
  heading?: string;
  level?: 2 | 3;
  // The id of the player surface to bring into view after a jump.
  playerId?: string;
}

// The moments worth jumping to, as a grid of time and label. A press seeks there, brings the player
// into view, and says where it went in a status line under the list (in the page, not a toast).
export function KeyMoments({
  track,
  moments,
  heading = "Key moments",
  level = 2,
  playerId,
}: KeyMomentsProps) {
  const { now, go } = useSeekTrack(track);
  const [said, setSaid] = useState("");
  const timer = useRef<number | undefined>(undefined);
  const id = useId();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  if (!moments.length) return null;
  const H = level === 3 ? "h3" : "h2";
  return (
    <section className="cap-player-list" aria-labelledby={id}>
      <H className="cap-player-list-heading" id={id}>
        {heading}
      </H>
      <ol className="cap-player-moments">
        {moments.map((m, i) => {
          const nextAt = moments[i + 1]?.seconds ?? Infinity;
          const on = now >= m.seconds && now < nextAt;
          return (
            <li key={`${m.seconds}-${m.label}`}>
              <button
                type="button"
                className="cap-player-moment"
                aria-current={on ? "true" : undefined}
                onClick={() => {
                  go(m.seconds);
                  if (playerId)
                    document.getElementById(playerId)?.scrollIntoView({
                      behavior: reduced() ? "auto" : "smooth",
                      block: "center",
                    });
                  setSaid(`Jumped to ${formatTime(m.seconds)}`);
                  window.clearTimeout(timer.current);
                  timer.current = window.setTimeout(() => setSaid(""), 1800);
                }}
              >
                <span className="cap-player-at">{formatTime(m.seconds)}</span>
                <span className="cap-player-moment-label">{m.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="cap-player-said" role="status">
        {said}
      </p>
    </section>
  );
}

export interface PlayerHost {
  name: string;
  role?: string;
  // Their own page: the link is rel="me".
  href?: string;
  // A picture.
  img?: string;
}

export interface HostsProps {
  hosts: readonly PlayerHost[];
  heading?: string;
  level?: 2 | 3;
  // Draws a host's picture (a site's own responsive picture, or its mark when there is none).
  // The shared avatar, with initials, by default.
  avatar?: (host: PlayerHost) => ReactNode;
}

// Who hosts it: a picture, the name (linked to their own page) and their role.
export function Hosts({ hosts, heading = "Hosts", level = 2, avatar }: HostsProps) {
  const id = useId();
  if (!hosts.length) return null;
  const H = level === 3 ? "h3" : "h2";
  return (
    <section className="cap-player-list" aria-labelledby={id}>
      <H className="cap-player-list-heading" id={id}>
        {heading}
      </H>
      <ul className="cap-player-hosts">
        {hosts.map((h) => (
          <li key={h.name} className="cap-player-host">
            {avatar ? avatar(h) : <Avatar name={h.name} src={h.img} size="lg" />}
            <span className="cap-player-host-text">
              {h.href ? (
                <a className="cap-player-host-name" href={h.href} rel="me">
                  {h.name}
                </a>
              ) : (
                <span className="cap-player-host-name">{h.name}</span>
              )}
              {h.role ? <span className="cap-player-meta">{h.role}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// A speaker with two sound waves; the waves carry the playing state in CSS.
const SpeakerIcon = () => (
  <svg
    className="cap-player-clip-icon"
    viewBox="0 0 24 24"
    width="20"
    height="20"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
    <path
      className="cap-player-clip-wave"
      d="M15 9.2a4 4 0 0 1 0 5.6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      className="cap-player-clip-wave"
      data-wave="2"
      d="M17.6 6.6a7.6 7.6 0 0 1 0 10.8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export interface PlayClipProps {
  // The short clip.
  src: string;
  // What it plays: "Hear how Capsomer is pronounced".
  label: string;
}

// The inline audio button. The markup is complete with no script (a link to the clip); the behavior
// module shows the button and plays the clip in place. Playing is the element's own state
// (aria-pressed, set by the module), as the popover's open state is, not React state.
export function PlayClip({ src, label }: PlayClipProps) {
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => (root.current ? enhance(root.current) : undefined), []);
  return (
    <span ref={root} className="cap-player-clip" data-cap="player" data-kind="clip">
      <a className="cap-player-clip-link" href={src} aria-label={label}>
        <SpeakerIcon />
      </a>
      <button
        type="button"
        className="cap-player-clip-button"
        data-src={src}
        aria-label={label}
        aria-pressed="false"
        hidden
      >
        <SpeakerIcon />
      </button>
    </span>
  );
}
