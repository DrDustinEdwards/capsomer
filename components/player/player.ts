// The player's behavior, plain TypeScript with no framework: what the persistent audio player
// remembers (resume position, rate, volume, mute), its time and label helpers, the Media Session
// surface, the waveform's peaks, the transcript's paragraphs, the start of a press before React
// loads, and the inline audio button (enhance). The React parts (player.react.tsx and the
// player-*.react.tsx files it re-exports) use these; a site's own pre-React script imports them too.

// ---------------------------------------------------------------------------------------
// The track.

export interface PlayerChapter {
  title: string;
  // Seconds from the start.
  start: number;
}

// One image for the lock screen, the Media Session's own shape (sizes and type optional).
export interface PlayerArtwork {
  src: string;
  sizes?: string;
  type?: string;
}

export interface PlayerTrack {
  // Stable per track: the resume position is remembered under it.
  id: string | number;
  title: string;
  // The audio file.
  src: string;
  // The lock screen's second and third lines. Missing, the provider's own `artist` and `album`.
  artist?: string;
  album?: string;
  // A picture's address, or the Media Session's list. Missing, the provider's `artwork`.
  artwork?: string | PlayerArtwork[];
  // Sorted by start.
  chapters?: PlayerChapter[];
  // The track's own page: the dock's title links to it.
  href?: string;
  // Where its transcript is read: the dock's Transcript link goes there.
  transcript?: string;
  // Seconds, when known before the file's metadata loads (the scrubber's length until then).
  duration?: number;
}

// "end" pauses at the end of the track; a number pauses that many minutes from now.
export type SleepMode = "end" | number;

export const RATE_MIN = 0.5;
export const RATE_MAX = 3;
export const RATE_STEP = 0.05;
export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
export const SLEEP_MINUTES = [5, 10, 15, 30, 45, 60];
// A resume position this close to the end starts the track over instead.
export const RESUME_TAIL_SECONDS = 5;
// The position is saved at most this often while playing.
export const RESUME_SAVE_SECONDS = 5;
// Previous restarts the track instead when it is past this point.
export const RESTART_SECONDS = 3;

export const clampRate = (r: number): number => Math.min(RATE_MAX, Math.max(RATE_MIN, r));
export const clampVolume = (v: number): number => Math.min(1, Math.max(0, v));

// ---------------------------------------------------------------------------------------
// What the player remembers, in localStorage under a prefix the site chooses ("germomics-" keeps
// the keys a site already wrote). Every read and write is in try/catch: storage can be blocked.

export interface PlayerStorage {
  prefix: string;
  rate(): number | null;
  volume(): number | null;
  muted(): boolean | null;
  // Where to resume a track of `duration` seconds, or null.
  resumeAt(id: string | number, duration: number): number | null;
  saveRate(rate: number): void;
  saveVolume(volume: number): void;
  saveMuted(muted: boolean): void;
  saveResume(id: string | number, seconds: number): void;
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked or full: the player still plays, it only forgets.
  }
}

// A saved position is used only when it is past the start and short of the last five seconds.
export function resumePoint(saved: number, duration: number): number | null {
  return saved > 0 && saved < duration - RESUME_TAIL_SECONDS ? saved : null;
}

export function playerStorage(prefix = "cap-player-"): PlayerStorage {
  const key = (name: string) => `${prefix}${name}`;
  return {
    prefix,
    rate() {
      const raw = read(key("rate"));
      const r = Number(raw);
      return raw !== null && r >= RATE_MIN && r <= RATE_MAX ? r : null;
    },
    volume() {
      const raw = read(key("volume"));
      const v = Number(raw);
      return raw !== null && raw !== "" && v >= 0 && v <= 1 ? v : null;
    },
    muted() {
      const raw = read(key("muted"));
      return raw === "1" ? true : raw === "0" ? false : null;
    },
    resumeAt(id, duration) {
      return resumePoint(Number(read(key(`resume-${id}`))), duration);
    },
    saveRate: (rate) => write(key("rate"), String(clampRate(rate))),
    saveVolume: (volume) => write(key("volume"), String(clampVolume(volume))),
    saveMuted: (muted) => write(key("muted"), muted ? "1" : "0"),
    saveResume: (id, seconds) => write(key(`resume-${id}`), String(Math.floor(seconds))),
  };
}

// ---------------------------------------------------------------------------------------
// Time and labels.

function splitSeconds(total?: number | null): [number, number, number] {
  const t = Math.max(0, Math.floor(Number.isFinite(total) ? (total as number) : 0));
  return [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60];
}

// "1:02:03" or "4:05".
export function formatTime(seconds?: number | null): string {
  const [h, m, s] = splitSeconds(seconds);
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

// "3 minutes 12 seconds", for aria-valuetext.
export function spokenTime(seconds?: number | null): string {
  const [h, m, s] = splitSeconds(seconds);
  const parts: string[] = [];
  if (h) parts.push(`${h} hour${h === 1 ? "" : "s"}`);
  if (m) parts.push(`${m} minute${m === 1 ? "" : "s"}`);
  if (s || !parts.length) parts.push(`${s} second${s === 1 ? "" : "s"}`);
  return parts.join(" ");
}

// "1.0x", "1.25x".
export function formatRate(r: number): string {
  return `${Number.isInteger(r) ? r.toFixed(1) : String(r)}x`;
}

// The sleep timer in words: "off", "end of episode", "15 minutes".
export function sleepLabel(mode: SleepMode | null, noun = "track"): string {
  if (mode == null) return "off";
  if (mode === "end") return `end of ${noun}`;
  return `${mode} minutes`;
}

// The chapter playing at `t`, or -1. Chapters are sorted by start.
export function activeChapterIndex(chapters: readonly { start: number }[], t: number): number {
  let idx = -1;
  for (let i = 0; i < chapters.length; i++) {
    if ((chapters[i] as { start: number }).start <= t + 0.001) idx = i;
    else break;
  }
  return idx;
}

// ---------------------------------------------------------------------------------------
// Media Session: the lock screen, a car and the media keys.

export function mediaSession(): MediaSession | null {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return null;
  return navigator.mediaSession;
}

// Pushes the element's position to the lock screen. A no-op without Media Session, before the
// duration is known, or on a value the browser refuses.
export function setPositionState(audio: HTMLMediaElement | null): void {
  const session = mediaSession();
  if (!audio || !session || typeof session.setPositionState !== "function") return;
  const dur = audio.duration;
  const pos = audio.currentTime;
  const r = audio.playbackRate;
  if (!Number.isFinite(dur) || dur <= 0 || !Number.isFinite(pos)) return;
  try {
    session.setPositionState({
      duration: dur,
      playbackRate: Number.isFinite(r) && r > 0 ? r : 1,
      position: Math.min(Math.max(pos, 0), dur),
    });
  } catch {
    // Some browsers throw on odd values.
  }
}

export function clearPositionState(): void {
  const session = mediaSession();
  if (!session || typeof session.setPositionState !== "function") return;
  try {
    (session.setPositionState as (s?: MediaPositionState) => void)(undefined);
  } catch {
    // Older engines require an argument.
  }
}

export interface MetadataDefaults {
  artist?: string;
  album?: string;
  artwork?: PlayerArtwork[];
}

// The metadata for a track: its own artist, album and artwork or the site's, and its chapters as
// chapterInfo (Media Session's chapter list, where the browser has it).
export function trackMetadata(
  track: PlayerTrack,
  defaults: MetadataDefaults = {},
): MediaMetadataInit & { chapterInfo?: { title: string; startTime: number }[] } {
  const own =
    typeof track.artwork === "string" ? [{ src: track.artwork }] : (track.artwork ?? undefined);
  const init: MediaMetadataInit & { chapterInfo?: { title: string; startTime: number }[] } = {
    title: track.title,
    artist: track.artist ?? defaults.artist ?? "",
    album: track.album ?? defaults.album ?? "",
    artwork: own && own.length ? own : (defaults.artwork ?? []),
  };
  const chapters = track.chapters ?? [];
  if (chapters.length)
    init.chapterInfo = chapters.map((c) => ({ title: c.title, startTime: c.start }));
  return init;
}

export interface SessionHandlers {
  play: () => void;
  pause: () => void;
  stop: () => void;
  previoustrack: () => void;
  nexttrack: () => void;
  // Seconds to move; the browser's offset when it sends one.
  seekbackward: (offset?: number) => void;
  seekforward: (offset?: number) => void;
  seekto: (seconds: number, fast: boolean) => void;
}

const ACTIONS = [
  "play",
  "pause",
  "stop",
  "previoustrack",
  "nexttrack",
  "seekbackward",
  "seekforward",
  "seekto",
] as const;

// Sets every action handler; returns a function that clears them, so a stale one never fires.
export function setSessionHandlers(handlers: SessionHandlers): () => void {
  const session = mediaSession();
  if (!session) return () => {};
  const set = (action: MediaSessionAction, fn: MediaSessionActionHandler | null) => {
    try {
      session.setActionHandler(action, fn);
    } catch {
      // An action this browser does not know.
    }
  };
  set("play", () => handlers.play());
  set("pause", () => handlers.pause());
  set("stop", () => handlers.stop());
  set("previoustrack", () => handlers.previoustrack());
  set("nexttrack", () => handlers.nexttrack());
  set("seekbackward", (d) => handlers.seekbackward(d.seekOffset));
  set("seekforward", (d) => handlers.seekforward(d.seekOffset));
  set("seekto", (d) => {
    if (typeof d.seekTime === "number") handlers.seekto(d.seekTime, d.fastSeek === true);
  });
  return () => {
    for (const a of ACTIONS) set(a, null);
  };
}

// ---------------------------------------------------------------------------------------
// The press before React. A page that sends no React until a reader presses play starts the audio
// inside the press itself (Safari and iOS refuse a play() that comes later), on the one element the
// provider renders, which then adopts it as it is.

// On the provider's <audio> while it plays a press started before React: the provider adopts it.
export const STARTED_ATTRIBUTE = "data-cap-player-started";
// The provider's one audio element.
export const AUDIO_SELECTOR = "audio[data-cap-player-audio]";

// Points the element at a track, resuming where the reader left off once its metadata is in, as
// the provider would. Nothing happens when it already has that source.
export function loadTrack(
  audio: HTMLAudioElement,
  track: { id: string | number; src: string },
  storage: PlayerStorage,
): void {
  const url = new URL(track.src, location.href).href;
  if (audio.src === url) return;
  // The element is preload="none" until a reader reaches for a track; this is that moment.
  audio.preload = "metadata";
  audio.src = url;
  audio.addEventListener(
    "loadedmetadata",
    () => {
      const at = storage.resumeAt(track.id, audio.duration);
      if (at !== null) audio.currentTime = at;
    },
    { once: true },
  );
}

// Plays a track inside the press with the remembered rate, volume and mute, and marks the element
// for the provider. Pressing the same playing track again pauses it. Returns whether the press
// still needs the app (false once it paused).
export function startTrack(
  audio: HTMLAudioElement,
  track: { id: string | number; src: string },
  storage: PlayerStorage,
): boolean {
  if (audio.src === new URL(track.src, location.href).href && !audio.paused) {
    audio.pause();
    audio.removeAttribute(STARTED_ATTRIBUTE);
    return false;
  }
  loadTrack(audio, track, storage);
  audio.playbackRate = storage.rate() ?? 1;
  audio.volume = storage.volume() ?? 1;
  audio.muted = storage.muted() ?? false;
  audio.setAttribute(STARTED_ATTRIBUTE, "");
  audio.play().catch(() => audio.removeAttribute(STARTED_ATTRIBUTE));
  return true;
}

// ---------------------------------------------------------------------------------------
// Waveform. The stored contract is a fixed-length list of integers 0 to 100, the loudest slice
// 100; the renderer also takes 0 to 1 floats and downsamples, never upsamples.

export const PEAKS_LENGTH = 400;
export const WAVEFORM_BARS = 120;

// Peaks from decoded PCM (one Float32Array per channel): the peak of each slice of a mono mixdown,
// scaled so the loudest is 100. No decoding here, so a Node script and a browser both use it.
export function computePeaks(channels: Float32Array[], n = PEAKS_LENGTH): number[] {
  const first = channels[0];
  if (!first || first.length === 0) return Array.from({ length: n }, () => 0);
  const len = first.length;
  const bucket = Math.max(1, Math.floor(len / n));
  const peaks = Array.from({ length: n }, () => 0);
  for (let b = 0; b < n; b++) {
    const start = b * bucket;
    const end = b === n - 1 ? len : Math.min(len, start + bucket);
    let max = 0;
    for (let i = start; i < end; i++) {
      let s = 0;
      for (const ch of channels) s += Math.abs(ch[i] ?? 0);
      s /= channels.length;
      if (s > max) max = s;
    }
    peaks[b] = max;
  }
  const gmax = peaks.reduce((m, p) => (p > m ? p : m), 0) || 1;
  return peaks.map((p) => Math.round((p / gmax) * 100));
}

// Decodes an audio file in the browser and returns its peaks and exact duration, or null where the
// browser cannot decode it. Heavy and one-shot: for an editor at upload, never a reader's page.
export async function decodePeaks(
  source: ArrayBuffer,
  n = PEAKS_LENGTH,
): Promise<{ peaks: number[]; duration: number } | null> {
  type Ctor = typeof AudioContext;
  const C: Ctor | undefined =
    typeof AudioContext !== "undefined"
      ? AudioContext
      : (globalThis as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
  if (!C) return null;
  const ctx = new C();
  try {
    const buffer = await ctx.decodeAudioData(source.slice(0));
    const channels: Float32Array[] = [buffer.getChannelData(0)];
    if (buffer.numberOfChannels > 1) channels.push(buffer.getChannelData(1));
    return { peaks: computePeaks(channels, n), duration: buffer.duration };
  } catch {
    return null;
  } finally {
    void ctx.close();
  }
}

// A file's duration in whole seconds from its metadata alone, or null.
export function probeDuration(file: Blob): Promise<number | null> {
  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    const url = URL.createObjectURL(file);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      resolve(Number.isFinite(audio.duration) ? Math.floor(audio.duration) : null);
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    audio.src = url;
  });
}

// `bars` heights from 0 to 1 (at least 0.04 so a quiet bar still shows), or null with no peaks.
export function normalizePeaks(
  peaks: readonly number[] | null | undefined,
  bars = WAVEFORM_BARS,
): number[] | null {
  if (!peaks || peaks.length === 0) return null;
  const max = peaks.reduce((m, p) => (p > m ? p : m), 0) || 1;
  const scale = max > 1 ? 100 : 1;
  const step = peaks.length / bars;
  return Array.from({ length: bars }, (_, i) => {
    const v = peaks[Math.min(peaks.length - 1, Math.floor(i * step))] ?? 0;
    return Math.min(1, Math.max(0.04, v / scale));
  });
}

// A calm shape for a track with no stored peaks yet: two sines, never flat, never like real data.
export function syntheticPeaks(bars = WAVEFORM_BARS): number[] {
  return Array.from({ length: bars }, (_, i) => {
    const t = i / bars;
    const v = 0.32 + 0.22 * Math.sin(t * Math.PI * 9) + 0.16 * Math.sin(t * Math.PI * 23 + 1.7);
    return Math.min(1, Math.max(0.08, Math.abs(v)));
  });
}

// ---------------------------------------------------------------------------------------
// Transcript. The cues come parsed (Prelum's WebVTT parser); these group and follow them.

export interface TranscriptCue {
  start: number;
  end: number;
  text: string;
  // "Alex Rivera", from a voice tag or a "Name:" prefix, when the parser found one.
  speaker?: string | null;
  // A sound, not speech: "[music]", "(laughs)".
  nonVerbal?: boolean;
}

// Caption-sized cues grouped into paragraphs that read well: a paragraph ends at a sentence's end
// once it has 45 words, or at a pause of more than 2.5 seconds. Each cue keeps its own time.
export function toParagraphs<C extends TranscriptCue>(cues: readonly C[]): C[][] {
  const paras: C[][] = [];
  let cur: C[] = [];
  let words = 0;
  for (let i = 0; i < cues.length; i++) {
    const c = cues[i] as C;
    cur.push(c);
    words += c.text.split(/\s+/).length;
    const endsSentence = /[.!?]["'”’)\]]?$/.test(c.text);
    const nextCue = cues[i + 1];
    const gapAfter = nextCue ? nextCue.start - c.end : 0;
    if ((endsSentence && words >= 45) || gapAfter > 2.5) {
      paras.push(cur);
      cur = [];
      words = 0;
    }
  }
  if (cur.length) paras.push(cur);
  return paras;
}

// The start of the last cue at or before `t`, or null: the active cue where the browser has no
// VTTCue to follow.
export function playheadCue(cues: readonly { start: number }[], t: number): number | null {
  let active: number | null = null;
  for (const c of cues) {
    if (c.start <= t) active = c.start;
    else break;
  }
  return active;
}

// The label of the hidden metadata track the transcript mirrors its cues onto.
export const TRANSCRIPT_TRACK_LABEL = "cap-player-transcript";

// ---------------------------------------------------------------------------------------
// The inline audio button: a small play button inside running text that plays a short clip (a
// pronunciation). The server writes a plain link to the clip, which works with no script; this
// shows the button in its place, which plays in place on a press (a native button: click, Enter,
// Space). Nothing is fetched before the first press. aria-pressed carries the playing state; a
// second press stops it. A clip that cannot load or play brings the link back.

export function wireClip(root: HTMLElement): () => void {
  const button = root.querySelector<HTMLButtonElement>(".cap-player-clip-button");
  const link = root.querySelector<HTMLAnchorElement>(".cap-player-clip-link");
  const src = button?.dataset.src ?? link?.getAttribute("href") ?? "";
  if (!button || !link || !src) return () => {};
  let audio: HTMLAudioElement | null = null;
  const paint = (playing: boolean) => button.setAttribute("aria-pressed", String(playing));
  const fallBack = () => {
    paint(false);
    button.hidden = true;
    link.hidden = false;
  };
  const clip = () => {
    if (audio) return audio;
    const created = new Audio();
    created.preload = "none";
    created.src = src;
    created.addEventListener("play", () => paint(true));
    created.addEventListener("pause", () => paint(false));
    created.addEventListener("ended", () => paint(false));
    created.addEventListener("error", fallBack);
    audio = created;
    return created;
  };
  const onClick = () => {
    const player = clip();
    if (!player.paused) {
      player.pause();
      player.currentTime = 0;
      return;
    }
    player.currentTime = 0;
    player.play().catch((error: unknown) => {
      paint(false);
      // A second press while the first play was still starting: the reader stopped it.
      if (error instanceof DOMException && error.name === "AbortError") return;
      // A refused play is reported, not swallowed; the link stays one press away.
      fallBack();
      throw error;
    });
  };
  button.addEventListener("click", onClick);
  link.hidden = true;
  button.hidden = false;
  return () => {
    button.removeEventListener("click", onClick);
    audio?.pause();
    audio = null;
    paint(false);
    button.hidden = true;
    link.hidden = false;
  };
}

// Every inline audio button under `root` ([data-cap="player"][data-kind="clip"]). Idempotent.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  const own = root instanceof HTMLElement && root.matches('[data-cap="player"]') ? [root] : [];
  const found = [
    ...own,
    ...root.querySelectorAll<HTMLElement>('[data-cap="player"][data-kind="clip"]'),
  ];
  for (const el of found) {
    if (el.dataset.kind !== "clip" || el.hasAttribute("data-cap-ready")) continue;
    el.setAttribute("data-cap-ready", "");
    const off = wireClip(el);
    undo.push(() => {
      off();
      el.removeAttribute("data-cap-ready");
    });
  }
  return () => {
    for (const fn of undo) fn();
  };
}
