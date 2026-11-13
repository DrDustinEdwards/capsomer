import { useEffect, useState } from "react";
import { DURATION_MS, countUp } from "./count-up.js";
// The count-up's progress (0 to 1) for a figure: 1 on the server and with reduced motion, and on
// the client a count from 0 to 1 whenever `key` changes (key the figures, not an array, so a
// parent re-render does not restart it). `run` false shows the figure still.
export function useCountUp(key, run = true, duration = DURATION_MS) {
    const [progress, setProgress] = useState(1);
    useEffect(() => (run ? countUp(setProgress, duration) : undefined), [key, run, duration]);
    return progress;
}
