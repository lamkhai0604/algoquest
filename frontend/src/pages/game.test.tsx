import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
      screen.getByRole("heading", { name: "Level 1 · Big-O & Basics" }),
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

    const patterns = screen.getByRole("list", { name: "Phase 2 levels" });
    expect(within(patterns).getByText("Two Pointers")).toBeVisible();
    expect(within(patterns).getByText("Coming soon")).toBeVisible();

    const phases = screen.getAllByRole("group");
    expect(phases).toHaveLength(3);
    expect(phases[0]).toHaveAttribute("open");
    expect(phases[1]).toHaveAttribute("open");
    expect(phases[2]).not.toHaveAttribute("open");
    expect(phases[2]).toHaveTextContent("Phase 3 · Interview Mastery");
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

describe("level page", () => {
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
