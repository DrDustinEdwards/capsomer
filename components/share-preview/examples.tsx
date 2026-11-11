// Mounts the width meters: Prelum's widths, so the numbers are there without a canvas.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SerpWidthMeter } from "./share-preview.react.tsx";

const el = document.querySelector<HTMLElement>("[data-mount=width]");
if (el)
  createRoot(el).render(
    <StrictMode>
      <div className="cap-specimen-row" id="sp-width">
        <SerpWidthMeter label="Search title width" text="Release notes for the spring update" />
        <SerpWidthMeter
          label="Search title width, too wide"
          text="ANNUAL REPORT: EVERYTHING EXAMPLE CO SHIPPED, FIXED AND LEARNED THIS YEAR"
        />
        <SerpWidthMeter
          label="Search description width"
          part="description"
          text="What changed in the spring update, who it helps, and what to do next."
        />
      </div>
    </StrictMode>,
  );
