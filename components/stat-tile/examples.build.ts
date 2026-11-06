// The stat tile's sparklines and tables, drawn by Enarratio when the states page is built
// (bin/states.mjs): sparkline({ inline: true }) in the tile, dataTableBlock() under it.
import { dataTableBlock, sparkline } from "enarratio";

const days = ["Thu, Sep 24", "Fri, Sep 25", "Sat, Sep 26", "Sun, Sep 27", "Mon, Sep 28", "Tue, Sep 29", "Wed, Sep 30"];
const spark = (label: string, values: number[]) => sparkline({ values, label, inline: true, width: 96, height: 22 });
const byDay = (label: string, column: string, values: number[]) => dataTableBlock({ columns: ["Day", column], rows: days.map((d, i) => [d, String(values[i])]) }, label);
const sites = [6, 6, 6, 6, 6, 6, 6];
const minutes = [260, 280, 310, 300, 330, 320, 340];

export default {
  sitesSpark: spark("Sites up, last 7 days", sites),
  sitesTable: byDay("Sites up by day", "Sites up", sites),
  budgetSpark: spark("Actions minutes per day, last 7 days", minutes),
  budgetTable: byDay("Actions minutes by day", "Minutes", minutes),
  d1Spark: spark("D1 rows read at this hour, percent of the limit, last 7 days", [52, 58, 61, 64, 70, 74, 78]),
};
