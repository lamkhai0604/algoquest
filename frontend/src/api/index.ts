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
});

/** True while any request has been waiting long enough to look like a cold start. */
export function useServerWaking(client: ApiClient = api): boolean {
  return useSyncExternalStore(client.onWakingChange, client.isWaking);
}
