// The player's controls, one set for the docked player and a track's own player surface, so both
// offer the same capability, icons, names and keys; they differ only in size and placement. Every
// control reads the one provider (usePlayer). Transport and the scrubber take an optional `track`:
// on a track's page they act on that track (switching the player to it on first use) without
// taking over a different track that is playing; the dock passes none and drives the current one.
import type { ReactNode } from "react";
import { clamp } from "../hooks/hooks.ts";
import {
  Icon,
  iconCaptions,
  iconFastForward,
  iconPause,
  iconPlay,
  iconRewind,
  iconSkipNext,
} from "../icons/icons.react.tsx";
import { Range } from "../field/field.react.tsx";
import { plainLink } from "../hooks/hooks.react.tsx";
import type { LinkProps } from "../shell/shell.react.tsx";
import { activeChapterIndex, formatTime, spokenTime, type PlayerTrack } from "./player.ts";
import { usePlayer } from "./player-context.react.tsx";

export type RenderLink = (props: LinkProps) => ReactNode;

// Icons, from the shared set. Each is aria-hidden; the control carries the name. player.css sizes
// them (.cap-player-icon) and draws them at the player's stroke.

const PlayIcon = () => <Icon d={iconPlay} fill className="cap-player-icon" />;
const PauseIcon = () => <Icon d={iconPause} fill className="cap-player-icon" />;

// Whether a control aimed at `track` acts on what is loaded.
function useTarget(track?: PlayerTrack) {
  const p = usePlayer();
  const isThis = !track || p.current?.id === track.id;
  return { p, isThis };
}

// Transport.

// Play and pause: the name changes with the state and there is no aria-pressed (APG Button: one,
// not both).
export function PlayPauseButton({
  track,
  size = "md",
}: {
  track?: PlayerTrack;
  size?: "md" | "lg";
}) {
  const { p, isThis } = useTarget(track);
  const playing = isThis && p.isPlaying;
  return (
    <button
      type="button"
      className="cap-player-btn"
      data-part="play"
      data-state={playing ? "playing" : undefined}
      data-size={size === "lg" ? "lg" : undefined}
      aria-label={playing ? "Pause" : "Play"}
      onClick={() => (isThis ? p.toggle() : track && p.playTrack(track))}
    >
      {playing ? <PauseIcon /> : <PlayIcon />}
    </button>
  );
}

export function SkipButton({ delta, track }: { delta: number; track?: PlayerTrack }) {
  const { p, isThis } = useTarget(track);
  const back = delta < 0;
  const secs = Math.abs(delta);
  return (
    <button
      type="button"
      className="cap-player-btn"
      data-part="skip"
      aria-label={back ? `Rewind ${secs} seconds` : `Skip forward ${secs} seconds`}
      onClick={() => (isThis ? p.skip(delta) : track && p.playTrackAt(track, Math.max(0, delta)))}
    >
      <Icon d={back ? iconRewind : iconFastForward} className="cap-player-icon" />
    </button>
  );
}

export function NextButton() {
  const p = usePlayer();
  return (
    <button
      type="button"
      className="cap-player-btn"
      data-part="next"
      aria-label={`Next ${p.noun}`}
      disabled={p.index >= p.queue.length - 1}
      onClick={p.next}
    >
      <Icon d={iconSkipNext} className="cap-player-icon" />
    </button>
  );
}

// Plays a track from a listing. With a queue it starts the whole queue at this track, so play goes
// on to the next. data-play-intent, data-audio-src and data-track-id let a page with no React yet
// start the press itself (startTrack in player.ts) and hand it to this button once React is live.
export function PlayTrackButton({
  track,
  queue,
  size = "md",
}: {
  track: PlayerTrack;
  queue?: PlayerTrack[];
  size?: "sm" | "md" | "lg";
}) {
  const p = usePlayer();
  const isCurrent = p.current?.id === track.id;
  const playing = isCurrent && p.isPlaying;
  return (
    <button
      type="button"
      className="cap-player-btn"
      data-part="play"
      data-state={playing ? "playing" : undefined}
      data-size={size === "md" ? undefined : size}
      data-play-intent=""
      data-audio-src={track.src}
      data-track-id={track.id}
      aria-label={`${playing ? "Pause" : "Play"} ${track.title}`}
      onClick={() => {
        if (isCurrent) return p.toggle();
        if (queue?.length) {
          const i = queue.findIndex((t) => t.id === track.id);
          p.playQueueAt(queue, i >= 0 ? i : 0);
        } else p.playTrack(track);
      }}
    >
      {playing ? <PauseIcon /> : <PlayIcon />}
    </button>
  );
}

// The seek control: a native range with its own keys (no drag needed, WCAG 2.5.7), the time spoken
// in aria-valuetext, the time and length beside it, and chapter ticks on the track.
export function Scrubber({ track, ticks = false }: { track?: PlayerTrack; ticks?: boolean }) {
  const { p, isThis } = useTarget(track);
  const dur = (isThis ? p.duration : 0) || track?.duration || p.current?.duration || 0;
  const pos = isThis ? p.currentTime : 0;
  const chapters = (isThis ? (track ?? p.current)?.chapters : track?.chapters) ?? [];
  const seekTo = (s: number) => {
    const to = clamp(s, 0, dur || s);
    if (isThis) p.seek(to);
    else if (track) p.playTrackAt(track, to);
  };
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const step = e.shiftKey ? 15 : 5;
    const to =
      e.key === "ArrowLeft" || e.key === "ArrowDown"
        ? pos - step
        : e.key === "ArrowRight" || e.key === "ArrowUp"
          ? pos + step
          : e.key === "PageDown"
            ? pos - 60
            : e.key === "PageUp"
              ? pos + 60
              : e.key === "Home"
                ? 0
                : e.key === "End"
                  ? dur
                  : null;
    if (to === null) return;
    e.preventDefault();
    seekTo(to);
  };
  return (
    <div className="cap-player-scrubber">
      <span className="cap-player-time">{formatTime(pos)}</span>
      <span className="cap-player-track">
        <Range
          className="cap-player-seek"
          min={0}
          max={dur || 1}
          step={1}
          value={Math.min(pos, dur || 1)}
          disabled={!dur}
          aria-label="Seek"
          aria-valuetext={`${spokenTime(pos)} of ${spokenTime(dur)}`}
          onChange={(e) => seekTo(Number(e.target.value))}
          onKeyDown={onKey}
        />
        {ticks && dur > 0 && chapters.length ? (
          <svg
            className="cap-player-ticks"
            viewBox="0 0 100 10"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            {chapters.map((c) => {
              const x = Math.min(100, (c.start / dur) * 100);
              return <line key={`${c.start}-${c.title}`} x1={x} x2={x} y1="0" y2="10" />;
            })}
          </svg>
        ) : null}
      </span>
      <span className="cap-player-time">{formatTime(dur)}</span>
    </div>
  );
}

// The way to the read-along transcript: `href` (the track's transcript, or "#transcript" on its
// own page), through the app's router link.
export function TranscriptLink({
  href,
  renderLink = plainLink,
}: {
  href: string;
  renderLink?: RenderLink;
}) {
  return renderLink({
    href,
    className: "cap-player-btn cap-player-transcript-link",
    children: (
      <>
        <Icon d={iconCaptions} className="cap-player-icon" /> Transcript
      </>
    ),
  });
}

// The player's state in words for a screen reader, politely: rendered once (in the dock) so it is
// never said twice, and outside anything the dock hides.
export function PlayerStatus() {
  const p = usePlayer();
  const chapters = p.current?.chapters ?? [];
  const idx = activeChapterIndex(chapters, p.currentTime);
  const chap = idx >= 0 ? chapters[idx] : null;
  const status = !p.current
    ? ""
    : p.errored
      ? "Error loading audio"
      : p.buffering
        ? "Buffering"
        : p.isPlaying
          ? `Playing${chap ? `, ${chap.title}` : ""}`
          : "Paused";
  return (
    <div className="cap-sr-only" aria-live="polite">
      {status}
    </div>
  );
}
