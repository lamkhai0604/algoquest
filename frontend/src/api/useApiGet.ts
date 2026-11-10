import { useCallback, useEffect, useState } from "react";
import { api } from "./index";
import type { ApiClient } from "./client";

export type Loadable<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

interface Result<T> {
  path: string;
  outcome: { status: "error"; message: string } | { status: "ready"; data: T };
}

const LOADING = { status: "loading" } as const;

/**
 * Loads `path` with GET. Pass null to load nothing. `reload` fetches again and
 * keeps showing the current data until the new data arrives.
 */
export function useApiGet<T>(
  path: string | null,
  client: ApiClient = api,
): { state: Loadable<T>; reload: () => void } {
  const [result, setResult] = useState<Result<T> | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (path === null) return;
    let active = true;
    client.get<T>(path).then(
      (data) => {
        if (active) setResult({ path, outcome: { status: "ready", data } });
      },
      (error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Something went wrong.";
        if (active) setResult({ path, outcome: { status: "error", message } });
      },
    );
    return () => {
      active = false;
    };
  }, [path, version, client]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const state = result && result.path === path ? result.outcome : LOADING;
  return { state, reload };
}
