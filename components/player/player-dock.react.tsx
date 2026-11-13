// The docked player and a track's own player surface, both built from the same controls.
// - PlayerDock: fixed to the bottom while something is loaded. It measures its height into
//   --cap-player-dock-h on <html> (player.css pads the body and the scroll by it, so nothing ends
//   under it), hides itself (inert) while the loaded track's own surface is on screen, and on a
//   narrow screen keeps speed, sleep, chapters and the transcript in a bottom sheet (the dialog).
// - PlayerSurface: the player on a track's page: a waveform over the scrubber, the transport, and
//   the settings. It tells the provider when it is on screen, so the dock steps aside.
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useIsoLayoutEffect } from "../hooks/hooks.react.tsx";
import { Dialog, DialogBody, DialogHeader, DialogTitle } from "../dialog/dialog.react.tsx";
import { Icon, iconAlert, iconChevronUp, iconClose, iconSpinner } from "../icons/icons.react.tsx";
import { plainLink } from "../shell/shell.react.tsx";
import { activeChapterIndex } from "./player.ts";
import { usePlayer } from "./player-context.react.tsx";
import {
  ChapterOptions,
  ChaptersControl,
  NextButton,
  PlayPauseButton,
  PlayerStatus,
  Scrubber,
  SkipButton,
  SleepControl,
  SleepOptions,
  SpeedControl,
  SpeedOptions,
  TranscriptLink,
  VolumeControl,
  type RenderLink,
} from "./player-controls.react.tsx";
import type { PlayerTrack } from "./player.ts";

// Below this width the dock's settings move into the sheet (player.css's container query agrees).
export const DOCK_SHEET_BELOW = 768;

export interface PlayerDockProps {
  // The region's name.
  label?: string;
  // The line under the title when no chapter is playing.
  idle?: string;
  // The app's router link for the title and the transcript; a plain <a> by default.
  renderLink?: RenderLink;
}

export function PlayerDock({
  label = "Audio player",
  idle = "Now playing",
  renderLink = plainLink,
}: PlayerDockProps) {
  const p = usePlayer();
  const [sheet, setSheet] = useState(false);
  const dock = useRef<HTMLDivElement>(null);
  const loaded = p.current !== null;

  // The dock's real height on <html>, 0 when nothing is loaded; the sheet closes if the dock grows
  // past the phone layout (the inline settings take over there).
  useEffect(() => {
    const root = document.documentElement;
    const el = dock.current;
    if (!loaded || !el) {
      root.style.removeProperty("--cap-player-dock-h");
      return;
    }
    const apply = () => {
      const r = el.getBoundingClientRect();
      root.style.setProperty("--cap-player-dock-h", `${Math.ceil(r.height)}px`);
      if (r.width >= DOCK_SHEET_BELOW) setSheet(false);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--cap-player-dock-h");
    };
  }, [loaded]);

  // The surface came on screen while the sheet was open: the sheet goes with the dock.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- the sheet belongs to the dock, which has just been hidden
    if (p.surfaceVisible) setSheet(false);
  }, [p.surfaceVisible]);

  if (!p.current) return null;
  const track = p.current;
  const chapters = track.chapters ?? [];
  const idx = activeChapterIndex(chapters, p.currentTime);
  const chapter = idx >= 0 ? chapters[idx] : null;
  // Auto-hide: still mounted (playback and the lock screen never break), only faded, inert and
  // hidden from assistive technology. The status sits outside, so it is still said.
  const hidden = p.surfaceVisible;

  return (
    <>
      <PlayerStatus />
      <div
        ref={dock}
        className="cap-player-dock"
        role="region"
        aria-label={label}
        aria-hidden={hidden || undefined}
        inert={hidden || undefined}
        data-hidden={hidden ? "" : undefined}
      >
        <div className="cap-player-dock-inner">
          <Scrubber ticks />
          <div className="cap-player-dock-row">
            <div className="cap-player-now">
              {track.href ? (
                renderLink({
                  href: track.href,
                  className: "cap-player-title",
                  children: track.title,
                })
              ) : (
                <span className="cap-player-title">{track.title}</span>
              )}
              <span className="cap-player-meta" data-tone={p.errored ? "crit" : undefined}>
                {p.errored ? (
                  <>
                    <Icon d={iconAlert} className="cap-player-icon" /> Error
                  </>
                ) : p.buffering ? (
                  <>
                    <Icon d={iconSpinner} className="cap-player-icon cap-player-spin" /> Buffering
                  </>
                ) : (
                  <span className="cap-player-meta-text">{chapter ? chapter.title : idle}</span>
                )}
              </span>
            </div>
            <div className="cap-player-transport">
              <SkipButton delta={-p.skipBack} />
              <PlayPauseButton />
              <SkipButton delta={p.skipForward} />
              <NextButton />
            </div>
            <div className="cap-player-settings">
              <SpeedControl side="top" />
              <VolumeControl side="top" />
              <SleepControl />
              <ChaptersControl />
            </div>
            <button
              type="button"
              className="cap-player-btn cap-player-more"
              data-part="setting"
              data-active={p.sleep != null ? "" : undefined}
              aria-haspopup="dialog"
              aria-expanded={sheet}
              aria-label="More player controls"
              onClick={() => setSheet(true)}
            >
              <Icon d={iconChevronUp} className="cap-player-icon" />
            </button>
            <button
              type="button"
              className="cap-player-btn"
              data-part="close"
              aria-label="Close player"
              onClick={p.dismiss}
            >
              <Icon d={iconClose} className="cap-player-icon" />
            </button>
          </div>
        </div>
      </div>
      {/* Outside the dock, so the dock's inert never reaches it. */}
      <Dialog
        open={sheet}
        onOpenChange={setSheet}
        placement="bottom"
        className="cap-player-sheet"
        closeLabel="Close player controls"
      >
        <DialogHeader>
          <DialogTitle>Player controls</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <SpeedOptions />
          <SleepOptions />
          <ChapterOptions onSelect={() => setSheet(false)} />
          {track.transcript ? (
            <TranscriptLink href={track.transcript} renderLink={renderLink} />
          ) : null}
        </DialogBody>
      </Dialog>
    </>
  );
}

// The layout effect runs before paint on the client, so a surface already on screen hides the dock
// with no flash; on the server it is a plain effect (never run).
const LazyWaveform = lazy(() =>
  import("./player-waveform.react.tsx").then((m) => ({ default: m.Waveform })),
);

export interface PlayerSurfaceProps {
  track: PlayerTrack;
  // The stored peaks; null shows the stand-in shape.
  peaks?: readonly number[] | null;
  // Leave the waveform out.
  waveform?: boolean;
  // The surface's name: "Player for <title>" by default, apart from the dock's "Audio player".
  label?: string;
  // Where its Transcript link goes: "#transcript" when the transcript is on this page.
  transcriptHref?: string;
  renderLink?: RenderLink;
  // Anything after the settings (Share, Save).
  children?: ReactNode;
}

export function PlayerSurface({
  track,
  peaks = null,
  waveform = true,
  label,
  transcriptHref,
  renderLink = plainLink,
  children,
}: PlayerSurfaceProps) {
  const p = usePlayer();
  const { setSurfaceVisible } = p;
  const active = p.current?.id === track.id;
  const section = useRef<HTMLElement>(null);

  // Only while this track is the one loaded: another track playing keeps the dock in view.
  useIsoLayoutEffect(() => {
    const el = section.current;
    if (!active || !el) {
      setSurfaceVisible(false);
      return;
    }
    const r = el.getBoundingClientRect();
    setSurfaceVisible(r.top < window.innerHeight && r.bottom > 0);
    const io = new IntersectionObserver(
      (entries) => setSurfaceVisible(entries[0]?.isIntersecting ?? false),
      {
        threshold: 0,
      },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      setSurfaceVisible(false);
    };
  }, [active, setSurfaceVisible]);

  const dur = (active && p.duration) || track.duration || 0;
  const pos = active ? p.currentTime : 0;
  const chapters = track.chapters ?? [];
  const idx = activeChapterIndex(chapters, pos);
  const chapter = active && idx >= 0 ? chapters[idx] : null;
  const region: [number, number] | null =
    chapter && dur > 0 ? [chapter.start / dur, (chapters[idx + 1]?.start ?? dur) / dur] : null;
  const transcript = transcriptHref ?? track.transcript;

  return (
    <section
      ref={section}
      className="cap-player-surface"
      aria-label={label ?? `Player for ${track.title}`}
    >
      {chapter ? <p className="cap-player-chapter-now">{chapter.title}</p> : null}
      {waveform ? (
        <Suspense fallback={<div className="cap-player-wave-box" aria-hidden="true" />}>
          <LazyWaveform
            peaks={peaks}
            position={dur > 0 ? Math.min(1, pos / dur) : 0}
            duration={dur}
            region={region}
            onSeek={(share) => (active ? p.seek(share * dur) : p.playTrackAt(track, share * dur))}
          />
        </Suspense>
      ) : null}
      <Scrubber track={track} ticks />
      <div className="cap-player-surface-row">
        <PlayPauseButton track={track} size="lg" />
        <SkipButton delta={-p.skipBack} track={track} />
        <SkipButton delta={p.skipForward} track={track} />
        <div className="cap-player-surface-settings">
          <SpeedControl />
          <VolumeControl />
          <SleepControl />
          {transcript ? <TranscriptLink href={transcript} renderLink={renderLink} /> : null}
        </div>
      </div>
      {children ? <div className="cap-player-surface-extra">{children}</div> : null}
    </section>
  );
}
