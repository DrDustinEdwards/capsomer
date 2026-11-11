// The chart's own viewBox is found past Enarratio's toolbar icons, which come first in the figure
// and are 16 by 16: a redraw taking its height from an icon drew every chart 16 px tall.
import assert from "node:assert/strict";
import { test } from "node:test";
import { chartViewBox } from "../../components/chart-frame/chart-frame.ts";

const figure = (...svgs) => `<figure class="enarratio">${svgs.join("")}</figure>`;
const icon = '<svg class="enarratio-icon" viewBox="0 0 16 16" aria-hidden="true"></svg>';
const chart = '<svg fill="currentColor" width="640" height="172" viewBox="0 0 640 172"></svg>';

test("the chart's viewBox is not an icon's", () => {
  assert.deepEqual(chartViewBox(figure(icon, icon, chart)), { w: 640, h: 172 });
  assert.deepEqual(chartViewBox(figure(chart)), { w: 640, h: 172 });
  assert.equal(chartViewBox(figure(icon)), undefined);
});
