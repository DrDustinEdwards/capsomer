import { escapeHtml } from "../email/email.ts";

export interface PatchOptions {
  /** A unique id on the page, for the patch's text paths. */
  id: string;
  /** Set round the top, in capitals. */
  name: string;
  /** Set round the foot, in capitals: the site or the series. */
  foot: string;
  /** The number on the disc, and the number of dots round it (at most 24). */
  count: number;
  /** The word under the number, in capitals. */
  unit: string;
}

/**
 * A project's round patch as SVG markup, as each Apollo crew wore its mission's (capsomer/manual.css
 * draws it). Plain string building, so a server or a static build can write it into the page. The
 * patch is decorative: the page says the same in words beside it, so it is hidden from screen readers.
 */
export function patchSvg({ id, name, foot, count, unit }: PatchOptions): string {
  const n = Math.min(Math.max(count, 0), 24);
  const dots = Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return `<circle class="cap-patch-dot" cx="${(70 + 36 * Math.cos(a)).toFixed(2)}" cy="${(70 + 36 * Math.sin(a)).toFixed(2)}" r="3.4"/>`;
  }).join("");
  const p = `cap-patch-${escapeHtml(id)}`;
  return `<svg class="cap-patch" viewBox="0 0 140 140" aria-hidden="true" focusable="false"><defs><path id="${p}-top" d="M 22 70 A 48 48 0 0 1 118 70"/><path id="${p}-foot" d="M 27 74 A 43 43 0 0 0 113 74"/></defs><circle class="cap-patch-rim" cx="70" cy="70" r="68"/><circle class="cap-patch-field" cx="70" cy="70" r="61"/><circle class="cap-patch-disc" cx="70" cy="70" r="36"/>${dots}<text class="cap-patch-name" text-anchor="middle"><textPath href="#${p}-top" startOffset="50%">${escapeHtml(name.toUpperCase())}</textPath></text><text class="cap-patch-foot" text-anchor="middle"><textPath href="#${p}-foot" startOffset="50%">${escapeHtml(foot.toUpperCase())}</textPath></text><text class="cap-patch-count" x="70" y="77" text-anchor="middle">${count}</text><text class="cap-patch-unit" x="70" y="89" text-anchor="middle">${escapeHtml(unit.toUpperCase())}</text></svg>`;
}
