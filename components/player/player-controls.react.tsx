// The player's controls, shared by the dock and a track's own surface so both offer the same capability and
// keys. Transport and the scrubber take an optional `track`: on a track's page they act on that track
// without taking over a different one that is playing; the dock passes none and drives the current one.
import { useId, type ReactNode } from "react";
import { clamp } from "../hooks/hooks.ts";
import {
  Icon,
  iconCaptions,
  iconFastForward,
  iconList,
  iconMute,
  iconPause,
  iconPlay,
  iconRewind,
  iconSkipNext,
  iconTimer,
  iconVolume,
} from "../icons/icons.react.tsx";
import { Menu } from "../menu/menu.react.tsx";
import { Range } from "../field/field.react.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "../popover/popover.react.tsx";
import { plainLink } from "../hooks/hooks.react.tsx";
import type { LinkProps } from "../shell/shell.react.tsx";
import {
  RATE_MAX,
  RATE_MIN,
  RATE_STEP,
  SLEEP_MINUTES,
  SPEEDS,
  activeChapterIndex,
  formatRate,
  formatTime,
  type PlayerChapter,
  sleepLabel,
  spokenTime,
  type PlayerTrack,
  type SleepMode,
} from "./player.ts";
import { usePlayer } from "./player-context.react.tsx";

export type RenderLink = (props: LinkProps) => ReactNode;

// Icons are aria-hidden; the control carries the name.

const PlayIcon = () => <Icon d={iconPlay} fill className="cap-player-icon" />;
const PauseIcon = () => <Icon d={iconPause} fill className="cap-player-icon" />;
const VolumeIcon = () => <Icon d={iconVolume} className="cap-player-icon" />;
const MutedIcon = () => <Icon d={iconMute} className="cap-player-icon" />;

function useTarget(track?: PlayerTrack) {
  const p = usePlayer();
  const isThis = !track || p.current?.id === track.id;
  return { p, isThis };
}

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

// Plays a track from a listing. data-play-intent, data-audio-src and data-track-id let a page with no React
// yet start the press itself (startTrack in player.ts) and hand it to this button once React is live.
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

// The seek control: a native range with its own keys (no drag needed, WCAG 2.5.7).
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

export function SpeedOptions() {
  const p = usePlayer();
  const name = useId();
  return (
    <div className="cap-player-options">
      <fieldset className="cap-player-choices" data-layout="grid">
        <legend className="cap-player-legend">Speed</legend>
        {SPEEDS.map((s) => {
          const on = Math.abs(s - p.rate) < 0.001;
          return (
            <label key={s} className="cap-check">
              <input
                type="radio"
                name={name}
                value={s}
                checked={on}
                // Focus lands on the chosen speed when the popover opens.
                ref={(el) => {
                  el?.toggleAttribute("autofocus", on);
                }}
                onChange={() => p.setRate(s)}
              />
              {formatRate(s)}
            </label>
          );
        })}
      </fieldset>
      <span className="cap-player-fine">
        <Range
          aria-label="Fine playback speed"
          min={RATE_MIN}
          max={RATE_MAX}
          step={RATE_STEP}
          value={p.rate}
          aria-valuetext={`${p.rate.toFixed(2)} times speed`}
          onChange={(e) => p.setRate(Number(e.target.value))}
        />
      </span>
    </div>
  );
}

const off = (a: number, b: number) => Math.abs(a - b) > 0.001;

export function SpeedControl({ side = "bottom" }: { side?: "top" | "bottom" }) {
  const p = usePlayer();
  return (
    <Popover>
      <PopoverTrigger
        className="cap-player-btn"
        data-part="setting"
        data-active={off(p.rate, 1) ? "" : undefined}
        aria-label={`Playback speed, currently ${formatRate(p.rate)}`}
      >
        <span className="cap-player-rate">{formatRate(p.rate)}</span>
      </PopoverTrigger>
      <PopoverContent side={side} align="end" size="sm" aria-label="Playback speed">
        <SpeedOptions />
      </PopoverContent>
    </Popover>
  );
}

// Mute and a volume range. Not on a touch screen (`data-part="volume"` is hidden under a coarse
// pointer): phones set volume with their own buttons, and iOS ignores a page's volume (MDN,
// HTMLMediaElement.volume).
export function VolumeControl({ side = "bottom" }: { side?: "top" | "bottom" }) {
  const p = usePlayer();
  const silent = p.muted || p.volume === 0;
  const shown = p.muted ? 0 : p.volume;
  return (
    <span className="cap-player-volume">
      <Popover>
        <PopoverTrigger
          className="cap-player-btn"
          data-part="setting"
          data-active={silent ? "" : undefined}
          aria-label={silent ? "Volume, muted" : `Volume, ${Math.round(p.volume * 100)} percent`}
        >
          {silent ? <MutedIcon /> : <VolumeIcon />}
        </PopoverTrigger>
        <PopoverContent side={side} align="end" size="auto" aria-label="Volume">
          <div className="cap-player-volume-row">
            <button
              type="button"
              className="cap-player-btn"
              data-part="setting"
              aria-label={p.muted ? "Unmute" : "Mute"}
              onClick={p.toggleMute}
            >
              {silent ? <MutedIcon /> : <VolumeIcon />}
            </button>
            <span className="cap-player-fine">
              <Range
                aria-label="Volume"
                ref={(el) => el?.setAttribute("autofocus", "")}
                min={0}
                max={1}
                step={0.05}
                value={shown}
                aria-valuetext={`${Math.round(shown * 100)} percent`}
                onChange={(e) => p.setVolume(Number(e.target.value))}
              />
            </span>
          </div>
        </PopoverContent>
      </Popover>
    </span>
  );
}

const sleepValue = (s: SleepMode | null) => (s == null ? "off" : String(s));
const sleepFrom = (v: string): SleepMode | null =>
  v === "off" ? null : v === "end" ? "end" : Number(v);
const sleepItems = (noun: string) => [
  { value: "off", label: "Off" },
  { value: "end", label: `End of ${noun}` },
  ...SLEEP_MINUTES.map((m) => ({ value: String(m), label: `${m} minutes` })),
];

export function SleepOptions() {
  const p = usePlayer();
  const name = useId();
  return (
    <fieldset className="cap-player-choices">
      <legend className="cap-player-legend">Sleep timer</legend>
      {sleepItems(p.noun).map((o) => (
        <label key={o.value} className="cap-check">
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={sleepValue(p.sleep) === o.value}
            onChange={() => p.setSleep(sleepFrom(o.value))}
          />
          {o.label}
        </label>
      ))}
    </fieldset>
  );
}

export function SleepControl({ container }: { container?: HTMLElement | null }) {
  const p = usePlayer();
  return (
    <span className="cap-player-menu" data-active={p.sleep != null ? "" : undefined}>
      <Menu
        label={<Icon d={iconTimer} className="cap-player-icon" />}
        aria-label={`Sleep timer, ${sleepLabel(p.sleep, p.noun)}`}
        chevron={false}
        container={container}
        items={[
          {
            type: "radio-group",
            label: "Sleep timer",
            value: sleepValue(p.sleep),
            onValueChange: (v) => p.setSleep(sleepFrom(v)),
            items: sleepItems(p.noun),
          },
        ]}
      />
    </span>
  );
}

export function ChaptersControl({ container }: { container?: HTMLElement | null }) {
  const p = usePlayer();
  const chapters = p.current?.chapters ?? [];
  if (!chapters.length) return null;
  const cur = activeChapterIndex(chapters, p.currentTime);
  return (
    <span className="cap-player-menu">
      <Menu
        label={<Icon d={iconList} className="cap-player-icon" />}
        aria-label="Chapters"
        chevron={false}
        container={container}
        items={[
          {
            type: "radio-group",
            label: "Chapters",
            closeOnClick: true,
            value: String(cur),
            onValueChange: (v) => {
              const c = chapters[Number(v)];
              if (c) p.seek(c.start);
            },
            items: chapters.map((c, i) => ({
              value: String(i),
              label: `${formatTime(c.start)} ${c.title}`,
            })),
          },
        ]}
      />
    </span>
  );
}

export function ChapterButtons({
  chapters,
  current,
  onGo,
}: {
  chapters: readonly PlayerChapter[];
  current: number;
  onGo: (seconds: number) => void;
}) {
  return (
    <ol className="cap-player-chapters">
      {chapters.map((c, i) => (
        <li key={`${c.start}-${c.title}`}>
          <button
            type="button"
            className="cap-player-chapter"
            aria-current={i === current ? "true" : undefined}
            onClick={() => onGo(c.start)}
          >
            <span className="cap-player-at">{formatTime(c.start)}</span>
            <span className="cap-player-chapter-title">{c.title}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

export function ChapterOptions({ onSelect }: { onSelect?: () => void }) {
  const p = usePlayer();
  const chapters = p.current?.chapters ?? [];
  if (!chapters.length) return null;
  const cur = activeChapterIndex(chapters, p.currentTime);
  return (
    <section className="cap-player-options" aria-label="Chapters">
      <p className="cap-player-legend" aria-hidden="true">
        Chapters
      </p>
      <ChapterButtons
        chapters={chapters}
        current={cur}
        onGo={(seconds) => {
          p.seek(seconds);
          onSelect?.();
        }}
      />
    </section>
  );
}

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
