import { describe, expect, it, vi } from "vitest";
import { ApiError, createApiClient } from "./client";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("createApiClient", () => {
  it("sends the bearer token and parses JSON", async () => {
    const fetchFn = vi.fn().mockResolvedValue(json(200, { id: 7 }));
    const api = createApiClient({
      baseUrl: "http://api",
      getToken: () => "token-1",
      fetchFn,
    });

    await expect(api.get("/api/v1/me")).resolves.toEqual({ id: 7 });
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api/api/v1/me");
    expect(init.headers).toMatchObject({ Authorization: "Bearer token-1" });
  });

  it("retries a GET on 503 and then succeeds", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(json(503, {}))
      .mockResolvedValueOnce(json(200, { ok: true }));
    const api = createApiClient({ baseUrl: "", fetchFn, retryDelayMs: 0 });

    await expect(api.get("/x")).resolves.toEqual({ ok: true });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("does not retry a POST", async () => {
    const fetchFn = vi.fn().mockResolvedValue(json(503, { title: "Down" }));
    const api = createApiClient({ baseUrl: "", fetchFn, retryDelayMs: 0 });

    await expect(api.post("/x", { a: 1 })).rejects.toBeInstanceOf(ApiError);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("turns a problem detail into an ApiError", async () => {
    const problem = { status: 403, title: "Forbidden", detail: "No access" };
    const fetchFn = vi.fn().mockResolvedValue(json(403, problem));
    const api = createApiClient({ baseUrl: "", fetchFn });

    const error = await api.get("/admin").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(403);
    expect((error as ApiError).message).toBe("No access");
  });

  it("reports an unreachable server after the retries", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    const api = createApiClient({
      baseUrl: "",
      fetchFn,
      retries: 2,
      retryDelayMs: 0,
    });

    const error = (await api.get("/x").catch((e: unknown) => e)) as ApiError;
    expect(error.status).toBe(0);
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it("signals waking while a request is slow", async () => {
    const fetchFn = vi.fn(
      () =>
        new Promise<Response>((resolve) =>
          setTimeout(() => resolve(json(200, {})), 40),
        ),
    );
    const api = createApiClient({ baseUrl: "", fetchFn, slowAfterMs: 5 });
    const events: boolean[] = [];
    api.onWakingChange((waking) => events.push(waking));

    await api.get("/x");
    expect(events).toEqual([true, false]);
    expect(api.isWaking()).toBe(false);
  });
});
