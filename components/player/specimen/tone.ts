// The specimens' audio, made in the page so no sound file is kept in the repository: a WAV of a
// quiet tone, as a blob address. 8 kHz, 8-bit, mono.
export function toneUrl(seconds: number, hz = 220): string {
  const rate = 8000;
  const n = Math.round(seconds * rate);
  const bytes = new Uint8Array(44 + n);
  const view = new DataView(bytes.buffer);
  const text = (at: number, s: string) => {
    for (let i = 0; i < s.length; i++) bytes[at + i] = s.charCodeAt(i);
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + n, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  text(36, "data");
  view.setUint32(40, n, true);
  for (let i = 0; i < n; i++)
    bytes[44 + i] = 128 + Math.round(6 * Math.sin((2 * Math.PI * hz * i) / rate));
  return URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
}
