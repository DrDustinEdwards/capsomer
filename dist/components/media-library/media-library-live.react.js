import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { applyChanges, recordOfKit } from "./media-library.js";
// How often the library asks for what others changed, with script and `changes` (site-api v0.13.0).
const LIVE_MS = 15000;
// What others changed, put over the page's rows until the page itself is loaded again: the changed
// rows, whether the library moved more than this page can follow, and the rows as they are now.
export function useLiveRows(data, changes, picker) {
    const { query, page, offers } = data;
    const [changed, setChanged] = useState(new Map());
    const [stale, setStale] = useState(false);
    // A page load replaces what others changed, in the same render.
    const [loadedRows, setLoadedRows] = useState(data.rows);
    if (data.rows !== loadedRows) {
        setLoadedRows(data.rows);
        setChanged(new Map());
        setStale(false);
    }
    const cursor = page.changeCursor;
    const polling = !!changes && !!offers.live && !!cursor && !picker;
    const changesRef = useRef(changes);
    useLayoutEffect(() => {
        changesRef.current = changes;
    });
    useEffect(() => {
        if (!polling || !cursor)
            return;
        const stop = new AbortController();
        let from = cursor;
        let timer = 0;
        const next = (ms) => {
            timer = window.setTimeout(() => void poll(), ms);
        };
        const poll = async () => {
            if (document.hidden)
                return next(LIVE_MS);
            try {
                const got = await changesRef.current?.(from, stop.signal);
                if (!got || stop.signal.aborted)
                    return;
                if ("reload" in got)
                    return setStale(true);
                if (got.rows.length || got.removed.length) {
                    setChanged((was) => {
                        const now = new Map(was);
                        for (const r of got.rows)
                            now.set(r.id, recordOfKit(r));
                        for (const id of got.removed)
                            now.set(id, null);
                        return now;
                    });
                }
                from = got.changeCursor;
                next(got.more ? 0 : LIVE_MS);
            }
            catch {
                // The site did not answer: ask again later, quietly.
                if (!stop.signal.aborted)
                    next(LIVE_MS * 2);
            }
        };
        next(LIVE_MS);
        return () => {
            stop.abort();
            window.clearTimeout(timer);
        };
    }, [polling, cursor]);
    const live = useMemo(() => applyChanges(data.rows, changed, query), [data.rows, changed, query]);
    return { changed, polling, stale, live };
}
