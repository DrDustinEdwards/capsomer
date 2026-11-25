// The player's waveform peaks: computed from decoded audio, decoded in the browser, normalized and
// synthesized for the bars. player.ts re-exports them; it is the entry a site imports.

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
