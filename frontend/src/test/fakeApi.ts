import { vi } from "vitest";

type Handler = () => Response;

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Replaces fetch with handlers keyed by "METHOD /path"; anything else gets 404. */
export function fakeApi(routes: Record<string, Handler>) {
  const respond = async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const path = new URL(String(input)).pathname;
    const handler = routes[`${method} ${path}`];
    return handler ? handler() : json(404, { title: "Not Found" });
  };
  const fetchFn = vi.fn(respond);
  vi.stubGlobal("fetch", fetchFn);
  return fetchFn;
}

export const ME = {
  id: "u-1",
  email: "ann@example.com",
  displayName: "Ann",
  roles: ["PLAYER"],
  permissions: ["game.play"],
};

export const inFourHours = () =>
  new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
