// The React specimens' charts, shared by examples.tsx (the live frames) and examples.build.ts
// (the same charts drawn when the page is built, so the page reads with scripts off).
import { barChart } from "enarratio/lite/bar";

const data = ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"].map((day, i) => ({ day, n: [14, 18, 9, 7, 21, 19, 23][i] ?? 0 }));
export const builds = (width: number) =>
  barChart({ data, x: "day", y: "n", width, height: 240, id: "cf-react", title: "Builds per day", alt: "Builds dipped at the weekend and peaked at 23 on Wednesday.", xLabel: "Day", yLabel: "Builds", source: { name: "Capsid's job log", href: "https://example.com/jobs" } });
export const refused = () => barChart({ data: data.slice(0, 0), x: "day", y: "n", title: "Builds per day", alt: "No builds." });
