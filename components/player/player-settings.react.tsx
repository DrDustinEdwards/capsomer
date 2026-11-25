// The player's settings, in the phone's sheet and behind a popover or a menu in the dock and on a
// track's surface: speed, volume, the sleep timer and chapters. They read the one provider (usePlayer).
import { useId } from "react";
import { Icon, iconList, iconMute, iconTimer, iconVolume } from "../icons/icons.react.tsx";
import { Menu } from "../menu/menu.react.tsx";
import { Range } from "../field/field.react.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "../popover/popover.react.tsx";
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
  type SleepMode,
} from "./player.ts";
import { usePlayer } from "./player-context.react.tsx";

const VolumeIcon = () => <Icon d={iconVolume} className="cap-player-icon" />;
const MutedIcon = () => <Icon d={iconMute} className="cap-player-icon" />;

// Settings: inline in the phone's sheet, and behind a popover or a menu in the dock and on the surface.

// The speed presets as radios (one tab stop, the arrow keys choose) and a fine range from 0.5 to 3.
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

// The sleep timer as radios, for the phone's sheet.
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

// The sleep timer as a menu of radio items (the shared menu).
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

// The chapters as a menu of radio items: the one playing is checked, choosing one seeks to it.
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

// The chapters as a list of buttons, the one playing marked aria-current.
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

// The chapters as buttons, for the phone's sheet: the one playing is aria-current.
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
