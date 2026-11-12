import { useEffect, useState } from "react";
import { api } from "../api";

/** How often the solve page tells the server that the player is working. */
export const HEARTBEAT_MS = 30_000;

export type Beat = (problemId: string) => Promise<number>;

const sendBeat: Beat = (problemId) =>
  api
    .post<{ activeSeconds: number }>(`/api/v1/problems/${problemId}/heartbeat`)
    .then((answer) => answer.activeSeconds);

const visible = () => document.visibilityState !== "hidden";

/**
 * Active working time on a problem (D-043). While `running` and the page is
 * visible, the clock ticks every second and a heartbeat goes to the server
 * every 30 seconds; the server's count replaces the local one. A hidden page
 * pauses the clock, and the server does not count the time away.
 */
export function useActiveTime(
  problemId: string,
  initialSeconds: number,
  running: boolean,
  beat: Beat = sendBeat,
): [number, (seconds: number) => void] {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (!running) return;
    let alive = true;
    const pulse = () => {
      beat(problemId)
        .then((server) => {
          if (alive) setSeconds(server);
        })
        .catch(() => undefined);
    };
    if (visible()) pulse();
    const tick = setInterval(() => {
      if (visible()) setSeconds((value) => value + 1);
    }, 1000);
    const heartbeat = setInterval(() => {
      if (visible()) pulse();
    }, HEARTBEAT_MS);
    const onVisibility = () => {
      if (visible()) pulse();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      alive = false;
      clearInterval(tick);
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [problemId, running, beat]);

  return [seconds, setSeconds];
}

const draftKey = (problemId: string) => `algoquest.draft.${problemId}`;

/** The unsent explanation, kept in this browser so Continue can restore it. */
export const drafts = {
  read(problemId: string): string {
    try {
      return window.localStorage.getItem(draftKey(problemId)) ?? "";
    } catch {
      return "";
    }
  },
  write(problemId: string, text: string): void {
    try {
      if (text) window.localStorage.setItem(draftKey(problemId), text);
      else window.localStorage.removeItem(draftKey(problemId));
    } catch {
      // Storage can be unavailable (private mode); the draft is then not kept.
    }
  },
};
