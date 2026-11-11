// The player's pure logic: what it remembers and where it resumes, the chapter at a time, the
// waveform's peaks and the transcript's paragraphs. Correctness only.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  activeChapterIndex,
  computePeaks,
  normalizePeaks,
  playerStorage,
  resumePoint,
  toParagraphs,
} from "../../components/player/player.ts";

function fakeStorage() {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
  return map;
}

test("resumePoint: never at the start and never within the last five seconds", () => {
  assert.equal(resumePoint(0, 600), null);
  assert.equal(resumePoint(120, 600), 120);
  assert.equal(resumePoint(595, 600), null);
  assert.equal(resumePoint(594, 600), 594);
  assert.equal(resumePoint(Number.NaN, 600), null);
});

test("playerStorage: keys under the site's prefix, bounds on what it reads back", () => {
  const map = fakeStorage();
  const s = playerStorage("example-");
  s.saveRate(1.5);
  s.saveVolume(0.4);
  s.saveMuted(true);
  s.saveResume(12, 61.9);
  assert.deepEqual([...map.keys()].sort(), [
    "example-muted",
    "example-rate",
    "example-resume-12",
    "example-volume",
  ]);
  assert.equal(map.get("example-resume-12"), "61");
  assert.equal(s.rate(), 1.5);
  assert.equal(s.volume(), 0.4);
  assert.equal(s.muted(), true);
  assert.equal(s.resumeAt(12, 600), 61);
  map.set("example-rate", "7");
  map.set("example-volume", "");
  assert.equal(s.rate(), null);
  assert.equal(s.volume(), null);
  // A volume of zero is a remembered volume, not a missing one.
  s.saveVolume(0);
  assert.equal(s.volume(), 0);
});

test("playerStorage: blocked storage reads as nothing remembered and writes do not throw", () => {
  globalThis.localStorage = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };
  const s = playerStorage();
  assert.equal(s.rate(), null);
  assert.equal(s.resumeAt(1, 600), null);
  assert.doesNotThrow(() => s.saveRate(2));
});

test("activeChapterIndex: the last chapter started, or -1 before the first", () => {
  const ch = [{ start: 10 }, { start: 40 }, { start: 85 }];
  assert.equal(activeChapterIndex(ch, 5), -1);
  assert.equal(activeChapterIndex(ch, 10), 0);
  assert.equal(activeChapterIndex(ch, 84.9), 1);
  assert.equal(activeChapterIndex(ch, 500), 2);
});

test("computePeaks: a mono mixdown's slice peaks, the loudest 100", () => {
  const left = new Float32Array([0.1, -0.5, 0.2, 0.2]);
  const right = new Float32Array([0.1, -0.5, 0.0, -0.2]);
  assert.deepEqual(computePeaks([left, right], 2), [100, 40]);
  assert.deepEqual(computePeaks([new Float32Array(0)], 3), [0, 0, 0]);
});

test("normalizePeaks: takes 0 to 100 integers or 0 to 1 floats, keeps a floor, downsamples", () => {
  assert.deepEqual(normalizePeaks([0, 50, 100, 100], 2), [0.04, 1]);
  assert.deepEqual(normalizePeaks([0.5, 1], 2), [0.5, 1]);
  assert.equal(normalizePeaks([], 4), null);
  assert.equal(normalizePeaks(null, 4), null);
});

test("toParagraphs: a paragraph ends after 45 words at a sentence's end, or at a long pause", () => {
  const words = (n) => Array.from({ length: n }, () => "word").join(" ");
  const cues = [
    { start: 0, end: 5, text: `${words(30)}.` },
    { start: 5, end: 10, text: `${words(20)}.` },
    { start: 10, end: 12, text: "Short." },
    { start: 16, end: 18, text: "After a pause" },
  ];
  assert.deepEqual(
    toParagraphs(cues).map((p) => p.map((c) => c.start)),
    [[0, 5], [10], [16]],
  );
});
