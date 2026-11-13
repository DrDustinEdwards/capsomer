// The read-along transcript. The cues come parsed (Prelum's WebVTT parser) and are grouped here into
// paragraphs that keep each cue's time. The active cue follows the browser's own TextTrack: the cues
// are mirrored onto a hidden metadata track on the player's <audio> and followed through cuechange
// (the playhead stands in where there is no VTTCue). A press on any cue seeks there and plays. The
// active cue scrolls into view inside the transcript's own box only while that box is on screen
// (never moving the page), and a reader who scrolls away gets "Jump to current". Search filters it;
// "Copy with link" copies the selection with a link to its time.
import { toParagraphs, type Cue } from "@drdustinedwards/site-helpers/vtt";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useCopy } from "../copy/copy.react.tsx";
import { reducedMotion } from "../count-up/count-up.ts";
import { SearchField } from "../field/field.react.tsx";
import {
  TRANSCRIPT_TRACK_LABEL,
  activeChapterIndex,
  formatTime,
  playheadCue,
  type PlayerTrack,
  type TranscriptCue,
} from "./player.ts";
import { usePlayer } from "./player-context.react.tsx";

function highlight(text: string, q: string): ReactNode {
  if (!q) return text;
  const lower = text.toLowerCase();
  let at = lower.indexOf(q);
  if (at === -1) return text;
  const out: ReactNode[] = [];
  let from = 0;
  while (at !== -1) {
    if (at > from) out.push(text.slice(from, at));
    out.push(
      <mark key={at} className="cap-player-mark">
        {text.slice(at, at + q.length)}
      </mark>,
    );
    from = at + q.length;
    at = lower.indexOf(q, from);
  }
  if (from < text.length) out.push(text.slice(from));
  return out;
}

export interface PlayerTranscriptProps {
  cues: readonly TranscriptCue[];
  track: PlayerTrack;
  // The raw text, shown as it is when there are no cues (a transcript that did not parse).
  fallback?: string;
  // The link a copied quote carries: by default the track's page with ?t=<seconds>.
  shareUrl?: (seconds: number) => string;
  // The line under a copied quote.
  attribution?: (title: string, url: string) => string;
  // Leave out search, or copy.
  search?: boolean;
  copy?: boolean;
}

export function PlayerTranscript({
  cues,
  track,
  fallback,
  shareUrl,
  attribution = (title, url) => `From "${title}": ${url}`,
  search = true,
  copy = true,
}: PlayerTranscriptProps) {
  const p = usePlayer();
  const { audioRef } = p;
  // Prelum's paragraphs hold the very cue objects they were given, so they keep the transcript's own type.
  const paragraphs = useMemo(
    () => toParagraphs(cues as readonly Cue[]) as TranscriptCue[][],
    [cues],
  );
  const chapters = track.chapters ?? [];
  const isThis = p.current?.id === track.id;
  const [nativeStart, setNativeStart] = useState<number | null>(null);
  const [following, setFollowing] = useState(true);
  const [query, setQuery] = useState("");
  const clipboard = useCopy();
  const [boxVisible, setBoxVisible] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const programmatic = useRef(false);
  const settle = useRef<number | undefined>(undefined);
  const hasVttCue = typeof window !== "undefined" && typeof VTTCue !== "undefined";

  // The browser's own TextTrack: the cues on one reused hidden metadata track, followed through
  // cuechange, only while this track is the one loaded.
  useEffect(() => {
    const audio = audioRef.current;
    if (!isThis || !audio || !hasVttCue || !cues.length) return;
    let tt: TextTrack | null = null;
    for (const t of Array.from(audio.textTracks)) if (t.label === TRANSCRIPT_TRACK_LABEL) tt = t;
    const track = tt ?? audio.addTextTrack("metadata", TRANSCRIPT_TRACK_LABEL);
    track.mode = "hidden";
    const clear = () => {
      const list = track.cues;
      if (list) for (let i = list.length - 1; i >= 0; i--) track.removeCue(list[i] as TextTrackCue);
    };
    clear();
    for (const c of cues) {
      try {
        track.addCue(new VTTCue(c.start, c.end > c.start ? c.end : c.start + 0.1, ""));
      } catch {
        // A malformed cue is skipped.
      }
    }
    const onChange = () => {
      const list = track.activeCues;
      const last = list && list.length ? list[list.length - 1] : null;
      setNativeStart(last ? last.startTime : null);
    };
    track.addEventListener("cuechange", onChange);
    onChange();
    return () => {
      track.removeEventListener("cuechange", onChange);
      clear();
      track.mode = "disabled";
    };
  }, [isThis, cues, hasVttCue, audioRef]);

  const activeStart = !isThis ? null : hasVttCue ? nativeStart : playheadCue(cues, p.currentTime);

  // Centers a cue inside the box by scrolling the box itself, never the page. Reduced motion snaps.
  const center = useCallback((start: number | null) => {
    const container = box.current;
    if (start == null || !container) return;
    const target = container.querySelector<HTMLElement>(`[data-cue="${start}"]`);
    if (!target) return;
    const c = container.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const delta = t.top - c.top - (container.clientHeight - t.height) / 2;
    if (Math.abs(delta) < 2) return;
    const snap = reducedMotion();
    programmatic.current = true;
    container.scrollBy({ top: delta, behavior: snap ? "auto" : "smooth" });
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => (programmatic.current = false), snap ? 60 : 700);
  }, []);

  // Follows the active cue only while the box is open and on screen, so pressing play with the
  // transcript closed or out of view never moves anything.
  useEffect(() => {
    if (!following || activeStart == null || query || !boxVisible) return;
    center(activeStart);
  }, [activeStart, following, query, boxVisible, center]);

  // A reader's own scroll in the box stops the following; the observer says whether it is on screen.
  useEffect(() => {
    const container = box.current;
    if (!container) return;
    const onScroll = () => {
      if (!programmatic.current) setFollowing(false);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    const io = new IntersectionObserver((e) => setBoxVisible(e[0]?.isIntersecting ?? false), {
      threshold: 0,
    });
    io.observe(container);
    return () => {
      container.removeEventListener("scroll", onScroll);
      io.disconnect();
      window.clearTimeout(settle.current);
    };
  }, []);

  const jump = (seconds: number) => (isThis ? p.seek(seconds) : p.playTrackAt(track, seconds));

  // Copied through the copy part, so a refused clipboard says Copy failed as every copy button does.
  const copyQuote = async () => {
    const sel = window.getSelection();
    let text = sel ? sel.toString().trim() : "";
    if (!text) return;
    const words = text.split(/\s+/);
    if (words.length > 200) text = `${words.slice(0, 200).join(" ")}…`;
    // The time of the cue the selection starts in, else the playhead.
    let t = Math.floor(isThis ? p.currentTime : 0);
    const node = sel?.anchorNode ?? null;
    let el: Element | null = node instanceof Element ? node : (node?.parentElement ?? null);
    while (el && !el.hasAttribute("data-cue")) el = el.parentElement;
    if (el) t = Math.floor(Number(el.getAttribute("data-cue")));
    const url = shareUrl
      ? shareUrl(t)
      : new URL(`${track.href ?? location.pathname}?t=${t}`, location.href).href;
    await clipboard.copy(`${text}\n\n${attribution(track.title, url)}`);
  };

  if (!cues.length) return <p className="cap-player-transcript-raw">{fallback ?? ""}</p>;

  const q = query.trim().toLowerCase();
  const shown = q
    ? paragraphs.filter((para) => para.some((c) => c.text.toLowerCase().includes(q)))
    : paragraphs;
  const matches = q
    ? paragraphs.reduce(
        (n, para) => n + para.filter((c) => c.text.toLowerCase().includes(q)).length,
        0,
      )
    : 0;

  // A paragraph's chapter and speaker headings, only where they change.
  let lastChapter = -1;
  let lastSpeaker: string | null = null;
  const heads = shown.map((para) => {
    const first = para[0] as TranscriptCue;
    const chap = activeChapterIndex(chapters, first.start);
    const showChapter = !q && chap !== -1 && chap !== lastChapter;
    if (showChapter) lastChapter = chap;
    const speaker = first.speaker ?? null;
    const showSpeaker = !!speaker && speaker !== lastSpeaker;
    if (speaker) lastSpeaker = speaker;
    return { chap, showChapter, speaker, showSpeaker };
  });

  return (
    <div className="cap-player-transcript">
      {search || copy ? (
        <div className="cap-player-transcript-bar cap-field-row">
          {search ? (
            <SearchField label="Search transcript" value={query} onChange={setQuery} />
          ) : null}
          {q ? (
            <span className="cap-player-meta">
              {matches} match{matches === 1 ? "" : "es"}
            </span>
          ) : null}
          {copy ? (
            <button
              type="button"
              className="cap-btn"
              data-size="sm"
              onClick={() => void copyQuote()}
            >
              <span aria-live="polite">
                {clipboard.state === "done"
                  ? "Copied"
                  : clipboard.state === "failed"
                    ? "Copy failed"
                    : "Copy with link"}
              </span>
            </button>
          ) : null}
        </div>
      ) : null}

      <div ref={box} className="cap-player-transcript-box">
        {shown.map((para, pi) => {
          const head = heads[pi] as (typeof heads)[number];
          const startSec = (para[0] as TranscriptCue).start;
          return (
            <div key={startSec} className="cap-player-para">
              {head.showChapter ? (
                <p className="cap-player-para-chapter">{chapters[head.chap]?.title}</p>
              ) : null}
              {head.showSpeaker ? <p className="cap-player-speaker">{head.speaker}</p> : null}
              <p className="cap-player-para-text">
                <button
                  type="button"
                  className="cap-player-at"
                  aria-label={`Play from ${formatTime(startSec)}`}
                  onClick={() => jump(startSec)}
                >
                  {formatTime(startSec)}
                </button>{" "}
                {para.map((c) => (
                  <button
                    key={c.start}
                    type="button"
                    className="cap-player-cue"
                    data-cue={c.start}
                    data-kind={c.nonVerbal ? "sound" : undefined}
                    aria-current={c.start === activeStart ? "true" : undefined}
                    title={formatTime(c.start)}
                    onClick={() => jump(c.start)}
                  >
                    {highlight(c.text, q)}{" "}
                  </button>
                ))}
              </p>
            </div>
          );
        })}
        {q && shown.length === 0 ? <p className="cap-player-meta">No matches.</p> : null}
      </div>

      {isThis && !following && activeStart != null && !q ? (
        <button
          type="button"
          className="cap-btn cap-player-jump"
          data-size="sm"
          onClick={() => {
            setFollowing(true);
            center(activeStart);
          }}
        >
          Jump to current
        </button>
      ) : null}
    </div>
  );
}
