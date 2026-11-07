import { useSyncExternalStore } from "react";
import { createApiClient } from "./client";
import type { ApiClient } from "./client";

export { ApiError, createApiClient } from "./client";
export type { ApiClient, ProblemDetail } from "./client";

export const api = createApiClient({
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
});

/** True while any request has been waiting long enough to look like a cold start. */
export function useServerWaking(client: ApiClient = api): boolean {
  return useSyncExternalStore(client.onWakingChange, client.isWaking);
}
