import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { fakeApi, json, ME } from "../test/fakeApi";
import { LEVELS } from "../test/gameData";
import { renderSignedInAt } from "../test/renderApp";
import { DEFAULT_RULES } from "../solve/rules";
import type { AdminUser, AuditEntry, LoggedAttempt } from "./types";

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

    await userEvent.click(
      await screen.findByRole("button", { name: "Users and roles" }),
    );
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

  it("grants a role after confirmation", async () => {
    const fetchFn = fakeApi({
      "GET /api/v1/me": () => json(200, OWNER),
      "GET /api/v1/levels": () => json(200, LEVELS),
      "GET /api/v1/admin/attempts": () => json(200, []),
      "GET /api/v1/admin/users": () => json(200, USERS),
      "POST /api/v1/admin/users/u-2/roles": () =>
        json(200, [{ ...USERS[0], roles: ["PLAYER", "ADMIN"] }]),
    });
    renderSignedInAt("/admin");

    await userEvent.click(
      await screen.findByRole("button", { name: "Users and roles" }),
    );
    await userEvent.click(await screen.findByRole("button", { name: "ADMIN" }));
    const dialog = await screen.findByRole("dialog", { name: "Grant ADMIN?" });
    expect(dialog).toHaveTextContent("ann@example.com gets every permission");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Grant" }),
    );

    expect(
      await screen.findByRole("button", { name: "ADMIN", pressed: true }),
    ).toBeVisible();
    const [[, init]] = fetchFn.mock.calls.filter(([url]) =>
      String(url).endsWith("/roles"),
    ) as [[unknown, RequestInit]];
    expect(JSON.parse(String(init.body))).toEqual({ role: "ADMIN" });
  });

  it("edits the game rules and shows the effect before saving", async () => {
    let saved: unknown = null;
    fakeApi({
      "GET /api/v1/me": () => json(200, OWNER),
      "GET /api/v1/levels": () => json(200, LEVELS),
      "GET /api/v1/admin/attempts": () => json(200, []),
      "GET /api/v1/admin/game-rules": () =>
        json(200, { current: DEFAULT_RULES, defaults: DEFAULT_RULES }),
      "PUT /api/v1/admin/game-rules": () => {
        saved = { ...DEFAULT_RULES, baseXp: 20 };
        return json(200, { current: saved, defaults: DEFAULT_RULES });
      },
    });
    renderSignedInAt("/admin");

    await userEvent.click(
      await screen.findByRole("button", { name: "Game rules" }),
    );
    expect(
      await screen.findByText(/A full pass through a level .* earns 152 XP/),
    ).toBeVisible();
    const base = screen.getByLabelText(/Base XP/);
    await userEvent.clear(base);
    await userEvent.type(base, "20");
    expect(screen.getByText(/earns 182 XP/)).toBeVisible();
    expect(screen.getByText("default 15")).toBeVisible();

    await userEvent.click(
      screen.getByRole("button", { name: "Save 1 change" }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Change the game rules?",
    });
    expect(dialog).toHaveTextContent("baseXp: 15 → 20");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Saved. The new rules apply from the next request.",
    );
    expect(saved).toMatchObject({ baseXp: 20 });
  });

  it("lists audit entries with readable values", async () => {
    const entry: AuditEntry = {
      at: new Date().toISOString(),
      actorEmail: "owner@example.com",
      action: "config.update",
      target: "game-rules",
      targetEmail: null,
      before: '{"baseXp": "15"}',
      after: '{"baseXp": "20"}',
    };
    fakeApi({
      "GET /api/v1/me": () => json(200, OWNER),
      "GET /api/v1/levels": () => json(200, LEVELS),
      "GET /api/v1/admin/attempts": () => json(200, []),
      "GET /api/v1/admin/audit-log": () => json(200, [entry]),
    });
    renderSignedInAt("/admin");

    await userEvent.click(
      await screen.findByRole("button", { name: "Audit log" }),
    );
    expect(await screen.findByText("config.update")).toBeVisible();
    expect(screen.getByText("by owner@example.com")).toBeVisible();
    expect(
      screen.getByText("Before: baseXp: 15 · After: baseXp: 20"),
    ).toBeVisible();
  });
});
