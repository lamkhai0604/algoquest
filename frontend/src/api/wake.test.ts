import { describe, expect, it, vi } from "vitest";
import { API_URL, wakeServer } from ".";

describe("wakeServer", () => {
  it("calls the health endpoint", () => {
    const fetchFn = vi.fn(() => Promise.resolve(new Response("{}")));

    wakeServer(fetchFn);

    expect(fetchFn).toHaveBeenCalledWith(`${API_URL}/actuator/health`);
  });

  it("ignores a failed request", async () => {
    const fetchFn = vi.fn(() => Promise.reject(new Error("offline")));

    expect(() => wakeServer(fetchFn)).not.toThrow();
    await Promise.resolve();
  });
});
