// The player's behavior, plain TypeScript with no framework: what the persistent audio player
// remembers (resume position, rate, volume, mute), its time and label helpers, the Media Session
// surface, the waveform's peaks, the transcript's paragraphs, the start of a press before React
// loads, and the inline audio button (enhance). The React parts (player.react.tsx and the
// player-*.react.tsx files it re-exports) use these; a site's own pre-React script imports them too.
import { clamp, readStored, writeStored } from "../hooks/hooks.js";
import { ratio } from "../meter/meter.js";
import { SEC, duration, timecode } from "../time/time.js";
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
export const clampRate = (r) => Math.min(RATE_MAX, Math.max(RATE_MIN, r));
export const clampVolume = (v) => ratio(v, 1);
// A saved position is used only when it is past the start and short of the last five seconds.
export function resumePoint(saved, duration) {
    return saved > 0 && saved < duration - RESUME_TAIL_SECONDS ? saved : null;
}
export function playerStorage(prefix = "cap-player-") {
    const key = (name) => `${prefix}${name}`;
    return {
        prefix,
        rate() {
            const raw = readStored(key("rate"));
            const r = Number(raw);
            return raw !== null && r >= RATE_MIN && r <= RATE_MAX ? r : null;
        },
        volume() {
            const raw = readStored(key("volume"));
            const v = Number(raw);
            return raw !== null && raw !== "" && v >= 0 && v <= 1 ? v : null;
        },
        muted() {
            const raw = readStored(key("muted"));
            return raw === "1" ? true : raw === "0" ? false : null;
        },
        resumeAt(id, duration) {
            return resumePoint(Number(readStored(key(`resume-${id}`))), duration);
        },
        saveRate: (rate) => writeStored(key("rate"), String(clampRate(rate))),
        saveVolume: (volume) => writeStored(key("volume"), String(clampVolume(volume))),
        saveMuted: (muted) => writeStored(key("muted"), muted ? "1" : "0"),
        saveResume: (id, seconds) => writeStored(key(`resume-${id}`), String(Math.floor(seconds))),
    };
}
// ---------------------------------------------------------------------------------------
// Time and labels.
// "1:02:03" or "4:05".
export const formatTime = (seconds) => timecode(Number(seconds) * SEC);
// "3 minutes, 12 seconds", for aria-valuetext.
export const spokenTime = (seconds) => duration(Number(seconds) * SEC);
// "1.0x", "1.25x".
export function formatRate(r) {
    return `${Number.isInteger(r) ? r.toFixed(1) : String(r)}x`;
}
// The sleep timer in words: "off", "end of episode", "15 minutes".
export function sleepLabel(mode, noun = "track") {
    if (mode == null)
        return "off";
    if (mode === "end")
        return `end of ${noun}`;
    return `${mode} minutes`;
}
// The chapter playing at `t`, or -1. Chapters are sorted by start.
export function activeChapterIndex(chapters, t) {
    let idx = -1;
    for (let i = 0; i < chapters.length; i++) {
        if (chapters[i].start <= t + 0.001)
            idx = i;
        else
            break;
    }
    return idx;
}
// ---------------------------------------------------------------------------------------
// Media Session: the lock screen, a car and the media keys.
export function mediaSession() {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
        return null;
    return navigator.mediaSession;
}
// Pushes the element's position to the lock screen. A no-op without Media Session, before the
// duration is known, or on a value the browser refuses.
export function setPositionState(audio) {
    const session = mediaSession();
    if (!audio || !session || typeof session.setPositionState !== "function")
        return;
    const dur = audio.duration;
    const pos = audio.currentTime;
    const r = audio.playbackRate;
    if (!Number.isFinite(dur) || dur <= 0 || !Number.isFinite(pos))
        return;
    try {
        session.setPositionState({
            duration: dur,
            playbackRate: Number.isFinite(r) && r > 0 ? r : 1,
            position: clamp(pos, 0, dur),
        });
    }
    catch {
        // Some browsers throw on odd values.
    }
}
export function clearPositionState() {
    const session = mediaSession();
    if (!session || typeof session.setPositionState !== "function")
        return;
    try {
        session.setPositionState(undefined);
    }
    catch {
        // Older engines require an argument.
    }
}
// The metadata for a track: its own artist, album and artwork or the site's, and its chapters as
// chapterInfo (Media Session's chapter list, where the browser has it).
export function trackMetadata(track, defaults = {}) {
    const own = typeof track.artwork === "string" ? [{ src: track.artwork }] : (track.artwork ?? undefined);
    const init = {
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
const ACTIONS = [
    "play",
    "pause",
    "stop",
    "previoustrack",
    "nexttrack",
    "seekbackward",
    "seekforward",
    "seekto",
];
// Sets every action handler; returns a function that clears them, so a stale one never fires.
export function setSessionHandlers(handlers) {
    const session = mediaSession();
    if (!session)
        return () => { };
    const set = (action, fn) => {
        try {
            session.setActionHandler(action, fn);
        }
        catch {
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
        if (typeof d.seekTime === "number")
            handlers.seekto(d.seekTime, d.fastSeek === true);
    });
    return () => {
        for (const a of ACTIONS)
            set(a, null);
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
export function loadTrack(audio, track, storage) {
    const url = new URL(track.src, location.href).href;
    if (audio.src === url)
        return;
    // The element is preload="none" until a reader reaches for a track; this is that moment.
    audio.preload = "metadata";
    audio.src = url;
    audio.addEventListener("loadedmetadata", () => {
        const at = storage.resumeAt(track.id, audio.duration);
        if (at !== null)
            audio.currentTime = at;
    }, { once: true });
}
// Plays a track inside the press with the remembered rate, volume and mute, and marks the element
// for the provider. Pressing the same playing track again pauses it. Returns whether the press
// still needs the app (false once it paused).
export function startTrack(audio, track, storage) {
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
export function computePeaks(channels, n = PEAKS_LENGTH) {
    const first = channels[0];
    if (!first || first.length === 0)
        return Array.from({ length: n }, () => 0);
    const len = first.length;
    const bucket = Math.max(1, Math.floor(len / n));
    const peaks = Array.from({ length: n }, () => 0);
    for (let b = 0; b < n; b++) {
        const start = b * bucket;
        const end = b === n - 1 ? len : Math.min(len, start + bucket);
        let max = 0;
        for (let i = start; i < end; i++) {
            let s = 0;
            for (const ch of channels)
                s += Math.abs(ch[i] ?? 0);
            s /= channels.length;
            if (s > max)
                max = s;
        }
        peaks[b] = max;
    }
    const gmax = peaks.reduce((m, p) => (p > m ? p : m), 0) || 1;
    return peaks.map((p) => Math.round((p / gmax) * 100));
}
// Decodes an audio file in the browser and returns its peaks and exact duration, or null where the
// browser cannot decode it. Heavy and one-shot: for an editor at upload, never a reader's page.
export async function decodePeaks(source, n = PEAKS_LENGTH) {
    const C = typeof AudioContext !== "undefined"
        ? AudioContext
        : globalThis.webkitAudioContext;
    if (!C)
        return null;
    const ctx = new C();
    try {
        const buffer = await ctx.decodeAudioData(source.slice(0));
        const channels = [buffer.getChannelData(0)];
        if (buffer.numberOfChannels > 1)
            channels.push(buffer.getChannelData(1));
        return { peaks: computePeaks(channels, n), duration: buffer.duration };
    }
    catch {
        return null;
    }
    finally {
        void ctx.close();
    }
}
// A file's duration in whole seconds from its metadata alone, or null.
export function probeDuration(file) {
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
export function normalizePeaks(peaks, bars = WAVEFORM_BARS) {
    if (!peaks || peaks.length === 0)
        return null;
    const max = peaks.reduce((m, p) => (p > m ? p : m), 0) || 1;
    const scale = max > 1 ? 100 : 1;
    const step = peaks.length / bars;
    return Array.from({ length: bars }, (_, i) => {
        const v = peaks[Math.min(peaks.length - 1, Math.floor(i * step))] ?? 0;
        return Math.min(1, Math.max(0.04, v / scale));
    });
}
// A calm shape for a track with no stored peaks yet: two sines, never flat, never like real data.
export function syntheticPeaks(bars = WAVEFORM_BARS) {
    return Array.from({ length: bars }, (_, i) => {
        const t = i / bars;
        const v = 0.32 + 0.22 * Math.sin(t * Math.PI * 9) + 0.16 * Math.sin(t * Math.PI * 23 + 1.7);
        return Math.min(1, Math.max(0.08, Math.abs(v)));
    });
}
// The start of the last cue at or before `t`, or null: the active cue where the browser has no
// VTTCue to follow.
export function playheadCue(cues, t) {
    let active = null;
    for (const c of cues) {
        if (c.start <= t)
            active = c.start;
        else
            break;
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
export function wireClip(root) {
    const button = root.querySelector(".cap-player-clip-button");
    const link = root.querySelector(".cap-player-clip-link");
    const src = button?.dataset.src ?? link?.getAttribute("href") ?? "";
    if (!button || !link || !src)
        return () => { };
    let audio = null;
    const paint = (playing) => button.setAttribute("aria-pressed", String(playing));
    const fallBack = () => {
        paint(false);
        button.hidden = true;
        link.hidden = false;
    };
    const clip = () => {
        if (audio)
            return audio;
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
        player.play().catch((error) => {
            paint(false);
            // A second press while the first play was still starting: the reader stopped it.
            if (error instanceof DOMException && error.name === "AbortError")
                return;
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
export function enhance(root = document) {
    const undo = [];
    const own = root instanceof HTMLElement && root.matches('[data-cap="player"]') ? [root] : [];
    const found = [
        ...own,
        ...root.querySelectorAll('[data-cap="player"][data-kind="clip"]'),
    ];
    for (const el of found) {
        if (el.dataset.kind !== "clip" || el.hasAttribute("data-cap-ready"))
            continue;
        el.setAttribute("data-cap-ready", "");
        const off = wireClip(el);
        undo.push(() => {
            off();
            el.removeAttribute("data-cap-ready");
        });
    }
    return () => {
        for (const fn of undo)
            fn();
    };
}
