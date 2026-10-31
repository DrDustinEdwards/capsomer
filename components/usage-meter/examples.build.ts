// The usage meter's numbers behind "Show data", drawn by Enarratio's dataTableBlock() when the
// states page is built (bin/states.mjs), in usageTable()'s columns.
import { dataTableBlock } from "enarratio";

const columns = ["Measure", "Used", "Limit", "Percent used", "Projected at the reset"];
const table = (...rows: string[][]) => dataTableBlock({ columns, rows }, "Usage against free limits");

export default {
  onTrack: table(["Worker requests", "61,400", "100,000", "61%", "86,682"]),
  runsOut: table(["D1 rows read", "3,700,000", "5,000,000", "74%", "5,223,529"]),
  nearlyOut: table(["KV writes", "962", "1,000", "96%", "1,358"]),
  noProjection: table(["D1 rows written", "18,200", "100,000", "18%", "no projection"]),
  stale: table(["Worker requests", "44,100", "100,000", "44%", "75,600"], ["R2 storage", "1.2", "10", "12%", "no projection"]),
};
