import { useEffect, useRef, useState } from "react";

/** Counts whole seconds while `running`; it keeps its value when paused. */
export function useTimer(running: boolean): number {
  const [seconds, setSeconds] = useState(0);
  const elapsed = useRef(0);

  useEffect(() => {
    if (!running) return;
    const started = Date.now() - elapsed.current * 1000;
    const id = setInterval(() => {
      elapsed.current = Math.floor((Date.now() - started) / 1000);
      setSeconds(elapsed.current);
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  return seconds;
}
