import { useSyncExternalStore } from "react";
import { clearSession, getToken } from "../auth/session";
import { createApiClient } from "./client";
import type { ApiClient } from "./client";

export { ApiError, createApiClient } from "./client";
export type { ApiClient, ProblemDetail } from "./client";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export const api = createApiClient({
  baseUrl: API_URL,
  getToken,
  onUnauthorized: clearSession,
  // The streak counts calendar days in the player's own time zone (FR-13).
  extraHeaders: () => ({ "X-Time-Zone": timeZone() }),
});

function timeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/**
 * Starts a sleeping backend before the player clicks a sign-in button (D-037).
 * The answer is ignored; a failure only means the server is still waking.
 */
export function wakeServer(fetchFn: typeof fetch = fetch): void {
  try {
    void fetchFn(`${API_URL}/actuator/health`).catch(() => undefined);
  } catch {
    // No fetch available (for example in an old browser); nothing to do.
  }
}

/** True while any request has been waiting long enough to look like a cold start. */
export function useServerWaking(client: ApiClient = api): boolean {
  return useSyncExternalStore(client.onWakingChange, client.isWaking);
}
