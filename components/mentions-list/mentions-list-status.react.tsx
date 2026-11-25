// A mention's state as a status word with its glyph.
import { statusOf, type ModState } from "../moderation-queue/moderation-queue.ts";
import { markup } from "../trusted-html/trusted-html.ts";

export function StatusWord({ state }: { state: ModState }) {
  const s = statusOf(state);
  return (
    <span className="cap-status" data-tone={s.tone}>
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        aria-hidden="true"
        focusable="false"
        dangerouslySetInnerHTML={markup(s.glyph)}
      />
      {s.word}
    </span>
  );
}
