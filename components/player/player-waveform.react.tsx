// The waveform, from peaks computed once when the audio was added (computePeaks or decodePeaks in
// player.ts), never from the audio on a reader's page. Two forms:
// - Waveform, on a track's player surface: pointer only and aria-hidden, because the scrubber's
//   range is the seek control (WCAG 2.5.7); a click seeks, the pointer shows the time under it, the
//   played part fills, the leading edge is bright and the chapter playing is tinted.
// - WaveformPreview, in an editor: a still picture (role="img") with chapter markers.
// Both are SVG: the bars' heights are attributes, so nothing needs a style attribute.
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ratio } from "../meter/meter.ts";
import { WAVEFORM_BARS, formatTime, normalizePeaks, syntheticPeaks } from "./player.ts";

export interface WaveformProps {
  // 0 to 100 integers or 0 to 1 floats. Missing or empty: a calm stand-in shape, labeled a preview.
  peaks: readonly number[] | null | undefined;
  // How far it has played, 0 to 1.
  position: number;
  duration: number;
  // The chapter playing, as [start, end] shares of the length.
  region?: [number, number] | null;
  onSeek: (share: number) => void;
  bars?: number;
  // The note under a stand-in shape.
  previewLabel?: string;
}

export function Waveform({
  peaks,
  position,
  duration,
  region,
  onSeek,
  bars = WAVEFORM_BARS,
  previewLabel = "Waveform preview",
}: WaveformProps) {
  const real = useMemo(() => normalizePeaks(peaks, bars), [peaks, bars]);
  const heights = useMemo(() => real ?? syntheticPeaks(bars), [real, bars]);
  const box = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  // The time bubble follows the pointer, placed through the CSSOM.
  useLayoutEffect(() => {
    if (hover !== null)
      tip.current?.style.setProperty("--cap-player-at", `${(hover * 100).toFixed(2)}%`);
  }, [hover]);

  const shareAt = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    return r ? ratio(clientX - r.left, r.width) : 0;
  };

  return (
    <div className="cap-player-wave">
      {/* Pointer only: the scrubber below is the seek control for every other input. */}
      <div
        ref={box}
        className="cap-player-wave-box"
        aria-hidden="true"
        onClick={(e) => onSeek(shareAt(e.clientX))}
        onPointerMove={(e) => {
          setHover(shareAt(e.clientX));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <svg
          className="cap-player-wave-bars"
          viewBox={`0 0 ${bars} 100`}
          preserveAspectRatio="none"
          focusable="false"
        >
          {region ? (
            <rect
              className="cap-player-wave-region"
              x={region[0] * bars}
              y="0"
              width={Math.max(0, (region[1] - region[0]) * bars)}
              height="100"
            />
          ) : null}
          {heights.map((h, i) => {
            const share = (i + 0.5) / bars;
            const leading = Math.abs(share - position) < 1 / bars;
            const played = share <= position;
            const inRegion = !!region && share >= region[0] && share < region[1];
            const state = leading
              ? "leading"
              : played
                ? inRegion
                  ? "region"
                  : "played"
                : undefined;
            const height = Math.round(h * 100);
            return (
              <rect
                key={i}
                className="cap-player-wave-bar"
                data-state={state}
                x={i + 0.15}
                y={(100 - height) / 2}
                width="0.7"
                height={height}
              />
            );
          })}
        </svg>
        {hover !== null ? (
          <span ref={tip} className="cap-player-wave-tip">
            {formatTime(hover * duration)}
          </span>
        ) : null}
      </div>
      {real ? null : <p className="cap-player-wave-note">{previewLabel}</p>}
    </div>
  );
}

export interface WaveformPreviewProps {
  peaks: readonly number[];
  // Chapter positions as shares of the length, 0 to 1.
  markers?: readonly number[];
  label?: string;
  // Shown when there are no peaks yet.
  empty?: string;
  bars?: number;
}

// A still waveform for an editor: what the stored peaks look like, with the chapters marked.
export function WaveformPreview({
  peaks,
  markers = [],
  label = "Waveform",
  empty = "No waveform yet",
  bars,
}: WaveformPreviewProps) {
  const count = bars ?? Math.max(1, peaks.length);
  const heights = useMemo(() => normalizePeaks(peaks, count), [peaks, count]);
  if (!heights) return <div className="cap-player-wave-empty">{empty}</div>;
  return (
    <svg
      className="cap-player-wave-preview"
      role="img"
      aria-label={label}
      viewBox={`0 0 ${count} 100`}
      preserveAspectRatio="none"
      focusable="false"
    >
      {heights.map((h, i) => {
        const height = Math.max(3, Math.round(h * 100));
        return (
          <rect
            key={i}
            className="cap-player-wave-bar"
            x={i + 0.1}
            y={100 - height}
            width="0.8"
            height={height}
          />
        );
      })}
      {markers.map((m) => (
        <line
          key={m}
          className="cap-player-wave-marker"
          x1={m * count}
          x2={m * count}
          y1="0"
          y2="100"
        />
      ))}
    </svg>
  );
}
