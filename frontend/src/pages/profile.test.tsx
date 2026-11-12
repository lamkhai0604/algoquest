import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Profile } from "../game/types";
import { fakeApi, json, ME } from "../test/fakeApi";
import { LEVELS } from "../test/gameData";
import { renderSignedInAt } from "../test/renderApp";

const PROFILE: Profile = {
  displayName: "Ann",
  totalXp: 140,
  solvedProblems: 5,
  currentStreak: 4,
  bestStreak: 7,
  levels: [
    { ...LEVELS[0]!, xp: 100, bestTestScore: 95 },
    LEVELS[1]!,
    LEVELS[2]!,
  ],
};

describe("profile", () => {
  it("shows totals, the streak, and progress by level", async () => {
    const fetchFn = fakeApi({
      "GET /api/v1/me": () => json(200, ME),
      "GET /api/v1/levels": () => json(200, LEVELS),
      "GET /api/v1/profile": () => json(200, PROFILE),
    });
    renderSignedInAt("/profile");

    expect(await screen.findByRole("heading", { name: "Ann" })).toBeVisible();
    expect(screen.getByText("Best streak").previousSibling).toHaveTextContent(
      "7",
    );
    expect(screen.getByTitle("Day streak")).toHaveTextContent("4");
    const progress = screen
      .getByRole("heading", { name: "Progress by level" })
      .closest("section") as HTMLElement;
    expect(within(progress).getByText("Best test: 95 / 100")).toBeVisible();
    // Only levels the player can open are listed (D-044).
    expect(within(progress).getByText(/Big-O & Basics/)).toBeVisible();
    expect(within(progress).queryByText(/Arrays & Hashing/)).toBeNull();
    expect(within(progress).queryByText(/Two Pointers/)).toBeNull();
    expect(
      screen.getByRole("link", { name: "Back to the level map" }),
    ).toHaveAttribute("href", "/");

    const [, init] = fetchFn.mock.calls.find(([url]) =>
      String(url).endsWith("/profile"),
    )!;
    expect(
      (init?.headers as Record<string, string>)["X-Time-Zone"],
    ).toBeTruthy();
  });

  it("shows the main navigation and no Admin link for a player", async () => {
    fakeApi({
      "GET /api/v1/me": () => json(200, ME),
      "GET /api/v1/levels": () => json(200, LEVELS),
      "GET /api/v1/profile": () => json(200, PROFILE),
    });
    renderSignedInAt("/");

    const nav = await screen.findByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Map" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(nav).getByRole("link", { name: "Profile" })).toBeVisible();
    expect(within(nav).queryByRole("link", { name: "Admin" })).toBeNull();
  });
});
