import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { Hints } from "../game/types";
import { fakeApi, json, ME } from "../test/fakeApi";
import { LEVELS, PROBLEM } from "../test/gameData";
import { renderSignedInAt } from "../test/renderApp";

const HINTS = "/api/v1/problems/L1-max-temperature/hints";
const later = () => new Date(Date.now() + (3 * 60 + 12) * 60000).toISOString();

function hints(opened: string[], remaining: number): Hints {
  return {
    opened,
    total: 3,
    quota: {
      remaining,
      perWindow: 3,
      refillsAt: remaining < 3 ? later() : null,
    },
  };
}

function open(start: Hints, afterOpen: Hints) {
  const fetchFn = fakeApi({
    "GET /api/v1/me": () => json(200, ME),
    "GET /api/v1/levels": () => json(200, LEVELS),
    "GET /api/v1/hints/quota": () => json(200, start.quota),
    "GET /api/v1/problems/L1-max-temperature": () => json(200, PROBLEM),
    [`GET ${HINTS}`]: () => json(200, start),
    [`POST ${HINTS}`]: () => json(200, afterOpen),
  });
  renderSignedInAt("/problems/L1-max-temperature");
  return fetchFn;
}

describe("hints", () => {
  it("opens the next hint and lowers the possible XP", async () => {
    const fetchFn = open(hints([], 3), hints(["Keep the best so far."], 2));

    expect(await screen.findByText("3 of 3 hints left")).toBeVisible();
    expect(screen.getByTitle("Hints left")).toHaveTextContent("3");
    expect(screen.getByText("Up to 20 XP")).toBeVisible();

    await userEvent.click(
      screen.getByRole("button", { name: "Show hint 1 of 3 (−20% XP)" }),
    );

    expect(await screen.findByText("Keep the best so far.")).toBeVisible();
    const quota = screen.getByText(/2 of 3 hints left/);
    expect(quota).toHaveTextContent("next one back in 3h");
    expect(screen.getByText("Up to 16 XP")).toBeVisible();
    const posts = fetchFn.mock.calls.filter(
      ([url, init]) => String(url).endsWith(HINTS) && init?.method === "POST",
    );
    expect(posts).toHaveLength(1);
  });

  it("shows hints opened earlier without using the quota", async () => {
    const fetchFn = open(hints(["First.", "Second."], 1), hints([], 0));

    expect(await screen.findByText("Second.")).toBeVisible();
    expect(screen.getByText("Up to 12 XP")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Show hint 3 of 3 (−20% XP)" }),
    ).toBeVisible();
    const posts = fetchFn.mock.calls.filter(
      ([, init]) => init?.method === "POST",
    );
    expect(posts).toHaveLength(0);
  });

  it("links to the VIP page when no hints are left", async () => {
    open(hints([], 0), hints([], 0));

    const vip = await screen.findByRole("link", {
      name: "Get more hints with VIP",
    });
    expect(vip).toHaveAttribute("href", "/vip");
    expect(screen.queryByRole("button", { name: /Show hint/ })).toBeNull();
  });
});
