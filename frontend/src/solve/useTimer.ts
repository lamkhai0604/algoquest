import { useEffect, useState } from "react";

/**
 * Whole seconds since `since` (an ISO time from the server), updated every
 * second while `running`. Never negative.
 */
export function useElapsed(since: string, running: boolean): number {
  const start = new Date(since).getTime();
  const measure = () => Math.max(0, Math.floor((Date.now() - start) / 1000));
  const [seconds, setSeconds] = useState(measure);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(
      () => setSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000))),
      1000,
    );
    return () => clearInterval(id);
  }, [running, start]);

  return seconds;
}
