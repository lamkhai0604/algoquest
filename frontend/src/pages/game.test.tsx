import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { setLocale } from "../i18n";
import { fakeApi, json, ME } from "../test/fakeApi";
import { LEVELS, PROBLEMS } from "../test/gameData";
import { renderSignedInAt } from "../test/renderApp";

const routes = {
  "GET /api/v1/me": () => json(200, ME),
  "GET /api/v1/levels": () => json(200, LEVELS),
  "GET /api/v1/levels/1/problems": () => json(200, PROBLEMS),
};

describe("learning path", () => {
  it("shows the level to continue and the total XP", async () => {
    fakeApi(routes);
    renderSignedInAt("/");

    expect(
      await screen.findByRole("heading", { name: "Learning Path" }),
    ).toBeVisible();
    expect(
      await screen.findByRole("heading", { name: "Level 1 · Big-O & Basics" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Continue" })).toHaveAttribute(
      "href",
      "/levels/1",
    );
    expect(screen.getByRole("link", { name: "Read lesson" })).toHaveAttribute(
      "href",
      "/levels/1/lesson",
    );
    expect(screen.getByText(/1 of 6 problems solved/)).toBeVisible();
    expect(screen.getByTitle("Total XP")).toHaveTextContent("40");
    expect(screen.queryByText("Test access")).toBeNull();
  });

  it("tells an account with test access that every level is open", async () => {
    fakeApi({
      ...routes,
      "GET /api/v1/me": () =>
        json(200, {
          ...ME,
          roles: ["OWNER"],
          permissions: [...ME.permissions, "game.allLevels"],
        }),
    });
    renderSignedInAt("/");

    expect(await screen.findByText("Test access")).toBeVisible();
  });

  it("groups levels by phase and links only the levels the player can enter", async () => {
    fakeApi(routes);
    renderSignedInAt("/");

    const core = await screen.findByRole("list", { name: "Phase 1 levels" });
    expect(within(core).getAllByRole("listitem")).toHaveLength(2);
    expect(
      within(core).getByRole("link", { name: "Level 1: Big-O & Basics" }),
    ).toHaveAttribute("href", "/levels/1");
    expect(within(core).getAllByRole("link")).toHaveLength(1);
    expect(within(core).getByText("Locked")).toBeVisible();

    // A phase with no open level shows only its header: no expand, no level names.
    expect(screen.queryByRole("list", { name: "Phase 2 levels" })).toBeNull();
    expect(screen.queryByText("Two Pointers")).toBeNull();
    expect(
      screen.getByText("Phase 2 · Problem-Solving Patterns"),
    ).toBeVisible();
    expect(screen.getByText("Phase 3 · Interview Mastery")).toBeVisible();
    expect(screen.getByText("Phase 4 · System Design")).toBeVisible();
    const elective = screen.getByRole("region", { name: "Design Patterns" });
    expect(elective).toHaveTextContent("Elective · Design Patterns");
    expect(elective).toHaveTextContent("Coming soon");

    const phases = screen.getAllByRole("group");
    expect(phases).toHaveLength(1);
    expect(phases[0]).toHaveAttribute("open");
    expect(phases[0]).toHaveTextContent("Phase 1 · Core Foundations");
  });

  it("offers a retry when the levels cannot be loaded", async () => {
    fakeApi({
      "GET /api/v1/me": () => json(200, ME),
      "GET /api/v1/levels": () => json(500, { detail: "Server trouble." }),
    });
    renderSignedInAt("/");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Server trouble.",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });
});

afterEach(() => setLocale("en"));

describe("level page", () => {
  it("shows translated problem titles and fetches localized rows", async () => {
    setLocale("vi");
    const local = PROBLEMS.map((problem) =>
      problem.id === "L1-max-temperature"
        ? { ...problem, title: "Nhiệt độ cao nhất" }
        : problem,
    );
    const fetchFn = fakeApi({
      ...routes,
      "GET /api/v1/levels/1/problems": () => json(200, local),
    });
    renderSignedInAt("/levels/1");
    expect(await screen.findByText("Nhiệt độ cao nhất")).toBeVisible();
    expect(
      fetchFn.mock.calls.some(([url]) =>
        String(url).endsWith("/levels/1/problems?lang=vi"),
      ),
    ).toBe(true);
  });

  it("lists problems with difficulty and status", async () => {
    fakeApi(routes);
    renderSignedInAt("/levels/1");

    const solved = await screen.findByRole("link", { name: /Max Temperature/ });
    expect(solved).toHaveAttribute("href", "/problems/L1-max-temperature");
    expect(solved).toHaveTextContent("Solved · +20 XP");
    expect(
      screen.getByRole("link", { name: /Second Largest Score/ }),
    ).toHaveTextContent("Not tried");
    expect(
      screen.getByRole("heading", { name: "Level 1 · Big-O & Basics" }),
    ).toBeVisible();
  });

  it("shows Hard problems as coming later, unlinked", async () => {
    fakeApi(routes);
    renderSignedInAt("/levels/1");

    const hard = (await screen.findByText("Moving Median")).closest("li");
    expect(hard).toHaveTextContent("Coming soon");
    expect(screen.queryByRole("link", { name: /Moving Median/ })).toBeNull();
  });
});
