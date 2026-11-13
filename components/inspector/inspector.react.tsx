// The inspector: everything about a text that is not the text (its details, checks, comments, search
// fields, history), in tabs beside the writing on a wide screen and in a sheet from the bottom on a
// phone, so the writing comes first everywhere. An editor, a book file and an AI draft page that use
// it put the same tab in the same place.
//
// `head` (saving and publishing) stays in the page on a phone, under the text, where it is reached by
// scrolling; only the tabs go in the sheet. One copy of the tabs is drawn at a time, so no field is in
// the page twice.

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "../button/button.react.tsx";
import { Dialog, DialogBody, DialogHeader, DialogTitle } from "../dialog/dialog.react.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs/tabs.react.tsx";

export interface InspectorTab {
  value: string;
  label: string;
  /** Shown on the tab, for what needs the person: open checks, comments. */
  count?: number;
  /** null, undefined or false leaves the tab out (a tab with nothing to show today). */
  content: ReactNode;
}

/** The width from which the tabs sit beside the text; below it they open in a sheet. */
export const INSPECTOR_WIDE = "(min-width: 1100px)";

// The server draws the wide layout; a narrow screen moves the tabs into the sheet once it is live.
function useWide(query: string): boolean {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const q = window.matchMedia(query);
    const update = () => setWide(q.matches);
    update();
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, [query]);
  return wide;
}

export interface InspectorProps {
  /** Names the region and the sheet: "About this post". */
  label: string;
  /** Above the tabs, and in the page on a phone: saving, publishing. */
  head?: ReactNode;
  tabs: InspectorTab[];
  defaultTab?: string;
  /** The tab asked for by the address (`?tab=checks`): the inspector opens on it, and on a phone
   * opens the sheet, so a link from a list of flags lands on the checks. */
  initialTab?: string | null;
  /** The media query from which the tabs sit beside the text. Match it to the page's own grid. */
  wideQuery?: string;
  className?: string;
}

export function Inspector({
  label,
  head,
  tabs,
  defaultTab,
  initialTab,
  wideQuery = INSPECTOR_WIDE,
  className,
}: InspectorProps) {
  const wide = useWide(wideQuery);
  const shown = tabs.filter(
    (t) => t.content !== null && t.content !== undefined && t.content !== false,
  );
  const asked = shown.find((t) => t.value === initialTab)?.value;
  const [tab, setTab] = useState(asked ?? defaultTab ?? shown[0]?.value ?? "");
  const [open, setOpen] = useState(asked !== undefined);
  const current = shown.some((t) => t.value === tab) ? tab : (shown[0]?.value ?? "");
  const needs = shown.reduce((n, t) => n + (t.count ?? 0), 0);

  const body = (
    <Tabs value={current} onValueChange={setTab} className="cap-inspector-tabs">
      <TabsList aria-label={label} variant="line" size="sm">
        {shown.map((t) => (
          <TabsTrigger key={t.value} value={t.value} count={t.count || undefined}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {shown.map((t) => (
        <TabsContent key={t.value} value={t.value} className="cap-inspector-panel">
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  );

  return (
    <aside
      className={className ? `cap-inspector ${className}` : "cap-inspector"}
      data-cap="inspector"
      aria-label={label}
    >
      {head}
      {wide ? (
        body
      ) : (
        <>
          <div className="cap-inspector-open">
            {shown.map((t) => (
              <Button
                key={t.value}
                size="sm"
                onClick={() => {
                  setTab(t.value);
                  setOpen(true);
                }}
              >
                {t.label}
                {t.count ? (
                  <span className="cap-tab-count">
                    <span className="cap-sr-only">, </span>
                    {t.count}
                  </span>
                ) : null}
              </Button>
            ))}
            {needs > 0 ? <span className="cap-sr-only">{needs} need you</span> : null}
          </div>
          <Dialog
            open={open}
            onOpenChange={setOpen}
            placement="bottom"
            className="cap-inspector-sheet"
            aria-label={label}
          >
            <DialogHeader>
              <DialogTitle>{label}</DialogTitle>
            </DialogHeader>
            <DialogBody>{body}</DialogBody>
          </Dialog>
        </>
      )}
    </aside>
  );
}
