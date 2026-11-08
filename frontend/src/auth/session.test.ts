import { describe, expect, it, vi } from "vitest";
import {
  clearSession,
  getToken,
  onSessionChange,
  resetSessionCache,
  setSession,
} from "./session";

describe("session", () => {
  it("keeps the token across a reload of the page", () => {
    setSession({ token: "t-1", expiresAt: "2999-01-01T00:00:00Z" });
    resetSessionCache();

    expect(getToken()).toBe("t-1");
  });

  it("drops an expired token", () => {
    setSession({ token: "old", expiresAt: "2000-01-01T00:00:00Z" });

    expect(getToken()).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  it("notifies listeners on sign-in and sign-out", () => {
    const listener = vi.fn();
    const unsubscribe = onSessionChange(listener);

    setSession({ token: "t-1", expiresAt: "2999-01-01T00:00:00Z" });
    clearSession();
    unsubscribe();
    clearSession();

    expect(listener).toHaveBeenCalledTimes(2);
    expect(getToken()).toBeNull();
  });
});
