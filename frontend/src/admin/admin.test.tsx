import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { fakeApi, json, ME } from "../test/fakeApi";
import { LEVELS } from "../test/gameData";
import { renderSignedInAt } from "../test/renderApp";
import type { AdminUser, LoggedAttempt } from "./types";

const OWNER = {
  ...ME,
  roles: ["OWNER", "PLAYER"],
  permissions: ["game.play", "admin.gradingLog.view", "admin.progress.reset"],
};

const ATTEMPT: LoggedAttempt = {
  id: "a-1",
  userEmail: "ann@example.com",
  problemId: "L1-max-temperature",
  mode: "explain",
  explanation: "Keep the largest value while reading once.",
  pattern: 40,
  steps: 30,
  complexity: 20,
  edgeCases: 5,
  total: 95,
  feedback: "Name the empty case.",
  hintsUsed: 1,
  secondsTaken: 300,
  xpGained: 20,
  grader: "gemini-3.5-flash-lite/v2",
  gradingMs: 3100,
  createdAt: new Date().toISOString(),
};

const USERS: AdminUser[] = [
  {
    id: "u-2",
    email: "ann@example.com",
    displayName: "Ann",
    roles: ["PLAYER"],
    createdAt: new Date().toISOString(),
  },
];

describe("admin panel", () => {
  it("shows the Admin link to an Owner and the grading log", async () => {
    const fetchFn = fakeApi({
      "GET /api/v1/me": () => json(200, OWNER),
      "GET /api/v1/levels": () => json(200, LEVELS),
      "GET /api/v1/admin/attempts": () => json(200, [ATTEMPT]),
    });
    renderSignedInAt("/admin");

    expect(
      await screen.findByText("Keep the largest value while reading once."),
    ).toBeVisible();
    expect(screen.getByText("95 / 100")).toBeVisible();
    expect(
      screen.getByText(/gemini-3.5-flash-lite\/v2 · 3100 ms/),
    ).toBeVisible();
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Admin" })).toBeVisible();

    await userEvent.type(
      screen.getByLabelText("Problem ID"),
      "L1-max-temperature",
    );
    await userEvent.click(screen.getByRole("button", { name: "Filter" }));
    const urls = fetchFn.mock.calls.map(([url]) => String(url));
    expect(urls.some((u) => u.endsWith("?problemId=L1-max-temperature"))).toBe(
      true,
    );
  });

  it("resets a level only after confirmation", async () => {
    const fetchFn = fakeApi({
      "GET /api/v1/me": () => json(200, OWNER),
      "GET /api/v1/levels": () => json(200, LEVELS),
      "GET /api/v1/admin/attempts": () => json(200, []),
      "GET /api/v1/admin/users": () => json(200, USERS),
      "POST /api/v1/admin/users/u-2/progress-reset": () =>
        json(200, {
          before: { level: 1, xp: 40, solved: 2, bestTestScore: null },
          after: { level: 1, xp: 0, solved: 0, bestTestScore: null },
        }),
    });
    renderSignedInAt("/admin");

    await userEvent.click(await screen.findByRole("button", { name: "Users" }));
    await userEvent.click(
      await screen.findByRole("button", { name: "Reset…" }),
    );
    const resets = () =>
      fetchFn.mock.calls.filter(([url]) =>
        String(url).endsWith("/progress-reset"),
      );
    expect(resets()).toHaveLength(0);

    await userEvent.click(
      screen.getByRole("button", { name: "Confirm reset of level 1" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Level 1 reset: 40 XP and 2 solved problems removed.",
    );
    expect(resets()).toHaveLength(1);
  });
});
