// The persistent audio player's state: one <audio> element in a provider mounted once above the
// router's outlet, so playback survives client-side navigation. A queue, play and pause, next and
// previous, seek, skip, a rate from 0.5 to 3 and a volume and mute that are remembered, a sleep timer
// by minutes or at the end of the track, buffering and error states, a resume position per track
// (never in its last five seconds), and the whole Media Session surface: metadata with chapterInfo
// and an artwork fallback, the position, every action handler and the playback state.
import { clamp } from "../hooks/hooks.ts";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  RESTART_SECONDS,
  RESUME_SAVE_SECONDS,
  STARTED_ATTRIBUTE,
  clampRate,
  clampVolume,
  clearPositionState,
  mediaSession,
  playerStorage,
  setPositionState,
  setSessionHandlers,
  trackMetadata,
  type PlayerArtwork,
  type PlayerTrack,
  type SleepMode,
} from "./player.ts";

export interface PlayerState {
  queue: PlayerTrack[];
  index: number;
  current: PlayerTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  rate: number;
  volume: number;
  muted: boolean;
  buffering: boolean;
  errored: boolean;
  sleep: SleepMode | null;
  // True only while the loaded track's own surface is on screen: the dock hides then.
  surfaceVisible: boolean;
}

export interface PlayerApi extends PlayerState {
  // The one <audio> element, for the transcript's native TextTrack.
  audioRef: RefObject<HTMLAudioElement | null>;
  // The word for a track in labels: "Next episode", "End of episode".
  noun: string;
  skipBack: number;
  skipForward: number;
  // Seed the queue without playing (a listing seeds its tracks, newest first).
  setQueue: (tracks: PlayerTrack[]) => void;
  playTrack: (track: PlayerTrack) => void;
  playQueueAt: (tracks: PlayerTrack[], index: number) => void;
  // Play a track from a time (a transcript line, a ?t= link).
  playTrackAt: (track: PlayerTrack, seconds: number) => void;
  toggle: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  skip: (delta: number) => void;
  setRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setSleep: (mode: SleepMode | null) => void;
  setSurfaceVisible: (visible: boolean) => void;
  // Pause and end the session: the dock goes, and does not come back on scroll. Resume positions stay.
  dismiss: () => void;
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const PlayerContext = createContext<PlayerApi | null>(null);

export interface PlayerProviderProps {
  // The localStorage key prefix: "<prefix>rate", "<prefix>volume", "<prefix>muted",
  // "<prefix>resume-<id>". A site that already stored values passes its old prefix.
  storagePrefix?: string;
  // The lock screen's artist and album when a track has none (the site or show name).
  artist?: string;
  album?: string;
  // The lock screen's picture when a track has none (the site's icons).
  artwork?: PlayerArtwork[];
  noun?: string;
  // Seconds for the skip buttons and the lock screen's seek when the browser sends no offset.
  skipBack?: number;
  skipForward?: number;
  children: ReactNode;
}

export function PlayerProvider({
  storagePrefix = "cap-player-",
  artist,
  album,
  artwork,
  noun = "track",
  skipBack = 15,
  skipForward = 30,
  children,
}: PlayerProviderProps) {
  const storage = useMemo(() => playerStorage(storagePrefix), [storagePrefix]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueueState] = useState<PlayerTrack[]>([]);
  const [index, setIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRateState] = useState(1);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [errored, setErrored] = useState(false);
  const [sleep, setSleepState] = useState<SleepMode | null>(null);
  const [surfaceVisible, setSurfaceVisibleState] = useState(false);

  const current = index >= 0 && index < queue.length ? (queue[index] ?? null) : null;
  // What the element's event handlers read, so they are wired once and never stale.
  const live = useRef({ isPlaying, rate, current, sleep, index, queueLength: queue.length });
  // Before every other effect, so each one reads this render's values.
  useIsoLayoutEffect(() => {
    live.current = { isPlaying, rate, current, sleep, index, queueLength: queue.length };
  });
  const lastSave = useRef(0);
  const pendingSeek = useRef<number | null>(null);

  // The remembered rate, volume and mute, read after mount so the server and first render agree.
  useEffect(() => {
    const r = storage.rate();
    const v = storage.volume();
    const m = storage.muted();
    // oxlint-disable-next-line react/set-state-in-effect -- remembered values are read after mount, so the server and the first client render agree
    if (r !== null) setRateState(r);
    if (v !== null) setVolumeState(v);
    if (m !== null) setMuted(m);
  }, [storage]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  // A new track: load it, resume or take a pending seek once its metadata is in, honor play.
  const currentId = current?.id;
  useEffect(() => {
    const audio = audioRef.current;
    const track = live.current.current;
    if (!audio || !track) return;
    setErrored(false);
    lastSave.current = 0;
    const url = new URL(track.src, location.href).href;
    // A press on a page with no React yet started this element itself, resume included: adopt it
    // as it is, with no reload and no seek.
    const started = audio.hasAttribute(STARTED_ATTRIBUTE);
    audio.removeAttribute(STARTED_ATTRIBUTE);
    if (started && audio.src === url) {
      audio.playbackRate = live.current.rate;
      setPositionState(audio);
      return;
    }
    if (audio.src !== url) {
      // The page loads no audio; once a reader picks a track its metadata is wanted.
      audio.preload = "metadata";
      audio.src = url;
      audio.load();
    }
    audio.playbackRate = live.current.rate;
    const onMeta = () => {
      if (pendingSeek.current != null) {
        audio.currentTime = pendingSeek.current;
        pendingSeek.current = null;
      } else {
        const saved = storage.resumeAt(track.id, audio.duration);
        if (saved !== null) audio.currentTime = saved;
      }
      if (live.current.isPlaying) void audio.play().catch(() => setIsPlaying(false));
      setPositionState(audio);
    };
    // The same track pressed again after a dismiss is already loaded: no loadedmetadata is coming.
    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      onMeta();
      return;
    }
    audio.addEventListener("loadedmetadata", onMeta, { once: true });
    return () => audio.removeEventListener("loadedmetadata", onMeta);
  }, [currentId, storage]);

  // A play or pause intent.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !live.current.current) return;
    if (isPlaying) void audio.play().catch(() => setIsPlaying(false));
    else audio.pause();
  }, [isPlaying]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1 < live.current.queueLength ? i + 1 : i));
    setIsPlaying(true);
  }, []);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > RESTART_SECONDS) {
      audio.currentTime = 0;
      return;
    }
    setIndex((i) => (i > 0 ? i - 1 : i));
    setIsPlaying(true);
  }, []);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = clamp(seconds, 0, audio.duration || seconds);
    setCurrentTime(audio.currentTime);
    setPositionState(audio);
  }, []);

  const skip = useCallback(
    (delta: number) => {
      const audio = audioRef.current;
      if (audio) seek(audio.currentTime + delta);
    },
    [seek],
  );

  const setRate = useCallback(
    (r: number) => {
      const clamped = clampRate(r);
      const audio = audioRef.current;
      if (audio) audio.playbackRate = clamped;
      setRateState(clamped);
      storage.saveRate(clamped);
      setPositionState(audio);
    },
    [storage],
  );

  const setVolume = useCallback(
    (v: number) => {
      const clamped = clampVolume(v);
      setVolumeState(clamped);
      storage.saveVolume(clamped);
      if (clamped > 0) {
        setMuted(false);
        storage.saveMuted(false);
      }
    },
    [storage],
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      storage.saveMuted(!m);
      return !m;
    });
  }, [storage]);

  const toggle = useCallback(() => {
    if (!live.current.current) return;
    setIsPlaying((p) => !p);
  }, []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const setQueue = useCallback((tracks: PlayerTrack[]) => setQueueState(tracks), []);
  const playTrack = useCallback((track: PlayerTrack) => {
    setQueueState([track]);
    setIndex(0);
    setIsPlaying(true);
  }, []);
  const playQueueAt = useCallback((tracks: PlayerTrack[], i: number) => {
    setQueueState(tracks);
    setIndex(i);
    setIsPlaying(true);
  }, []);
  const playTrackAt = useCallback((track: PlayerTrack, seconds: number) => {
    pendingSeek.current = seconds;
    setQueueState([track]);
    setIndex(0);
    setIsPlaying(true);
  }, []);
  const setSleep = useCallback((mode: SleepMode | null) => setSleepState(mode), []);
  const setSurfaceVisible = useCallback((v: boolean) => setSurfaceVisibleState(v), []);

  // Explicit dismiss, distinct from the auto-hide: the dock unmounts. Pressing play anywhere
  // brings it back where the reader left off.
  const dismiss = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setIndex(-1);
    setQueueState([]);
    setSleepState(null);
    setSurfaceVisibleState(false);
  }, []);

  // A minute count pauses after that long; "end" is handled on ended.
  useEffect(() => {
    if (typeof sleep !== "number") return;
    const id = setTimeout(
      () => {
        setIsPlaying(false);
        setSleepState(null);
      },
      sleep * 60 * 1000,
    );
    return () => clearTimeout(id);
  }, [sleep]);

  // The element's events, wired once.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      setPositionState(audio);
      const track = live.current.current;
      if (track && Math.abs(audio.currentTime - lastSave.current) > RESUME_SAVE_SECONDS) {
        lastSave.current = audio.currentTime;
        storage.saveResume(track.id, audio.currentTime);
      }
    };
    const onDur = () => setDuration(audio.duration || 0);
    const onEnd = () => {
      const track = live.current.current;
      if (track) storage.saveResume(track.id, 0);
      if (live.current.sleep === "end") {
        setIsPlaying(false);
        setSleepState(null);
        return;
      }
      // The end of the queue stops; it does not start the last track over.
      if (live.current.index + 1 < live.current.queueLength) next();
      else setIsPlaying(false);
    };
    const onPlay = () => {
      setIsPlaying(true);
      setBuffering(false);
      setPositionState(audio);
    };
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => {
      setBuffering(false);
      setErrored(false);
    };
    const onError = () => {
      setErrored(true);
      setBuffering(false);
    };
    const events: Array<[string, () => void]> = [
      ["timeupdate", onTime],
      ["durationchange", onDur],
      ["ended", onEnd],
      ["play", onPlay],
      ["pause", onPause],
      ["waiting", onWaiting],
      ["stalled", onWaiting],
      ["playing", onPlaying],
      ["error", onError],
    ];
    for (const [type, fn] of events) audio.addEventListener(type, fn);
    return () => {
      for (const [type, fn] of events) audio.removeEventListener(type, fn);
    };
  }, [next, storage]);

  // Media Session: metadata, chapterInfo and every action handler, again for each track.
  useEffect(() => {
    const session = mediaSession();
    if (!session) return;
    // The position starts over; it comes back once the new duration is known.
    clearPositionState();
    const track = live.current.current;
    if (track && typeof MediaMetadata !== "undefined")
      session.metadata = new MediaMetadata(
        trackMetadata(track, { artist, album, artwork }) as MediaMetadataInit,
      );
    return setSessionHandlers({
      play: () => setIsPlaying(true),
      pause: () => setIsPlaying(false),
      stop: () => setIsPlaying(false),
      previoustrack: prev,
      nexttrack: next,
      seekbackward: (offset) => skip(-(offset ?? skipBack)),
      seekforward: (offset) => skip(offset ?? skipForward),
      seekto: (seconds, fast) => {
        const audio = audioRef.current;
        if (audio && fast && typeof audio.fastSeek === "function") audio.fastSeek(seconds);
        else seek(seconds);
        setPositionState(audio);
      },
    });
  }, [currentId, artist, album, artwork, next, prev, seek, skip, skipBack, skipForward]);

  useEffect(() => {
    const session = mediaSession();
    if (session) session.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  const value = useMemo<PlayerApi>(
    () => ({
      queue,
      index,
      current,
      isPlaying,
      currentTime,
      duration,
      rate,
      volume,
      muted,
      buffering,
      errored,
      sleep,
      surfaceVisible,
      audioRef,
      noun,
      skipBack,
      skipForward,
      setQueue,
      playTrack,
      playQueueAt,
      playTrackAt,
      toggle,
      pause,
      next,
      prev,
      seek,
      skip,
      setRate,
      setVolume,
      toggleMute,
      setSleep,
      setSurfaceVisible,
      dismiss,
    }),
    [
      queue,
      index,
      current,
      isPlaying,
      currentTime,
      duration,
      rate,
      volume,
      muted,
      buffering,
      errored,
      sleep,
      surfaceVisible,
      noun,
      skipBack,
      skipForward,
      setQueue,
      playTrack,
      playQueueAt,
      playTrackAt,
      toggle,
      pause,
      next,
      prev,
      seek,
      skip,
      setRate,
      setVolume,
      toggleMute,
      setSleep,
      setSurfaceVisible,
      dismiss,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {/* The one audio element, never unmounted. Nothing loads until a reader picks a track; no autoplay. */}
      <audio ref={audioRef} className="cap-player-audio" data-cap-player-audio="" preload="none" />
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerApi {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within <PlayerProvider>");
  return ctx;
}
