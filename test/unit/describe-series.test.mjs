// The sentence a chart's alt carries must say the numbers drawn: the cases a site's copy got
// wrong (one series joined as " and x", ties, all zero).
import assert from "node:assert/strict";
import { test } from "node:test";
import { describeSeries } from "../../components/chart-frame/chart-frame.ts";

test("describeSeries says the span, the latest, the range and every peak", () => {
  assert.equal(
    describeSeries({ what: "Articles per year", x: [2022, 2023, 2024], values: [3, 1, 3] }),
    "Articles per year, 2022 to 2024: 3 in 2024, from 1 to 3; most in 2022 and 2024.",
  );
  assert.equal(
    describeSeries({
      what: "Posts",
      x: [2023, 2024],
      values: [
        [1, 0],
        [2, 4],
      ],
    }),
    "Posts, 2023 to 2024: 4 in 2024, from 3 to 4; most in 2024.",
  );
  assert.equal(
    describeSeries({ what: "Talks", x: [2024, 2025], values: [0, 0] }),
    "Talks: none yet.",
  );
  assert.equal(describeSeries({ what: "Talks", x: [2025], values: [2] }), "Talks, 2025: 2.");
  assert.equal(
    describeSeries({ what: "Rate", x: ["Oct 2", "Oct 3"], values: [20, 30], at: "on" }),
    "Rate, Oct 2 to Oct 3: 30 on Oct 3, from 20 to 30; most on Oct 3.",
  );
  assert.equal(
    describeSeries({ what: "Talks", x: [2024, 2025], values: [2, 2] }),
    "Talks, 2024 to 2025: 2 each time.",
  );
});
