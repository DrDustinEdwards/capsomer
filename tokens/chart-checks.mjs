// The checks on the chart palette (tokens/chart.mjs), for `npm run check` and the tests. Color
// difference is Enarratio's CIEDE2000 under typical vision and simulated deficiency (Machado et al.
// 2009, the model its checkTheme uses), so the palette and the charts measure alike. Kept apart from
// chart.mjs and out of the package, so importing capsomer/palette never needs Enarratio. It imports
// nothing of Capsomer's, and palette.mjs passes its own `contrast` in: palette.mjs loads this module
// while it is still running, so an import back into it would never settle.
import { colorDifference } from "enarratio";

export const SERIES_MIN_DE = 10;
export const STATUS_MIN_DE = 6;
export const RAMP_STEP_MIN_DE = 6;

export const VISIONS = [undefined, "protanopia", "deuteranopia", "tritanopia"];
// The smallest difference over typical vision and the three deficiencies, and where it was.
export function worstDifference(a, b) {
  let worst = { de: Infinity, vision: undefined };
  for (const vision of VISIONS) {
    const de = colorDifference(a, b, vision);
    if (de < worst.de) worst = { de, vision };
  }
  return worst;
}

// Everything the chart palette must satisfy for one family's theme `t` (the token map for
// one scheme), with palette.mjs's WCAG `contrast`. Returns { what, value, min, pass, detail } rows, like pairs() in palette.mjs.
export function chartChecks(t, contrast) {
  const out = [];
  const add = (what, value, min, detail) => out.push({ what, value, min, pass: value >= min, detail });
  const series = Array.from({ length: 8 }, (_, i) => t[`series-${i + 1}`]);
  for (let i = 0; i < 8; i++) {
    for (const bg of ["surface", "ground", "raised"]) add(`series ${i + 1} against --${bg}`, contrast(series[i], t[bg]), 3, `${series[i]} on ${t[bg]}`);
  }
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      const w = worstDifference(series[i], series[j]);
      add(`series ${i + 1} and ${j + 1} differ (${w.vision ?? "typical vision"})`, w.de, SERIES_MIN_DE, `${series[i]} and ${series[j]}`);
    }
  }
  for (let i = 3; i < 8; i++) {
    for (const s of ["ok", "warn", "crit", "info"]) add(`series ${i + 1} is clear of --${s}`, colorDifference(series[i], t[s]), STATUS_MIN_DE, `${series[i]} and ${t[s]}`);
  }
  const ramp = Array.from({ length: 5 }, (_, i) => t[`ramp-${i + 1}`]);
  // The least step is found against the surface too (0.56), so every cell reaches 3:1.
  for (const bg of ["surface", "ground", "raised"]) add(`ramp step 1 against --${bg}`, contrast(ramp[0], t[bg]), 3, `${ramp[0]} on ${t[bg]}`);
  add("ramp step 5 against --surface", contrast(ramp[4], t.surface), 3, `${ramp[4]} on ${t.surface}`);
  for (let i = 1; i < 5; i++) {
    // Each step must stand further from the surface than the one before: "more" never reads as less.
    add(`ramp step ${i + 1} stands out more than step ${i}`, contrast(ramp[i], t.surface) - contrast(ramp[i - 1], t.surface), 0.01, `${ramp[i - 1]} then ${ramp[i]}`);
    add(`ramp steps ${i} and ${i + 1} differ`, colorDifference(ramp[i - 1], ramp[i]), RAMP_STEP_MIN_DE, `${ramp[i - 1]} and ${ramp[i]}`);
  }
  // A series' words beside its mark (a direct label) are text: 4.5:1 on every ground.
  for (let i = 0; i < 8; i++) for (const bg of ["surface", "ground", "raised"]) add(`series ${i + 1} ink against --${bg}`, contrast(t[`series-ink-${i + 1}`], t[bg]), 4.5, `${t[`series-ink-${i + 1}`]} on ${t[bg]}`);
  // No data (a timeline's or uptime strip's gap) is a mark: 3:1.
  for (const bg of ["surface", "ground", "raised"]) add(`no data against --${bg}`, contrast(t.nodata, t[bg]), 3, `${t.nodata} on ${t[bg]}`);
  for (let i = 0; i < 8; i++) add(`label on series ${i + 1}`, contrast(t[`series-text-${i + 1}`], series[i]), 4.5, `${t[`series-text-${i + 1}`]} on ${series[i]}`);
  for (let i = 0; i < 5; i++) add(`label on ramp step ${i + 1}`, contrast(t[`ramp-text-${i + 1}`], ramp[i]), 4.5, `${t[`ramp-text-${i + 1}`]} on ${ramp[i]}`);
  return out;
}
