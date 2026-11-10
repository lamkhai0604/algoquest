import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { fakeApi, json, ME } from "../test/fakeApi";
import { GRADED, LEVELS, PROBLEM, PROBLEMS } from "../test/gameData";
import { renderSignedInAt } from "../test/renderApp";

const OPEN_LEVELS = [{ ...LEVELS[0], xp: 75, practiceOpen: true }];

describe("practice round", () => {
  it("is announced below 70% of the bar", async () => {
    fakeApi({
      "GET /api/v1/me": () => json(200, ME),
      "GET /api/v1/levels": () => json(200, LEVELS),
      "GET /api/v1/levels/1/problems": () => json(200, PROBLEMS),
    });
    renderSignedInAt("/levels/1");
    const note = await screen.findByText(/practice round opens at 70 XP/);
    expect(note).toBeVisible();
  });

  it("links solved problems to practice mode", async () => {
    fakeApi({
      "GET /api/v1/me": () => json(200, ME),
      "GET /api/v1/levels": () => json(200, OPEN_LEVELS),
      "GET /api/v1/levels/1/problems": () => json(200, PROBLEMS),
    });
    renderSignedInAt("/levels/1");

    const round = (
      await screen.findByRole("heading", { name: "Practice round" })
    ).closest("section") as HTMLElement;
    const link = within(round).getByRole("link", { name: /Max Temperature/ });
    expect(link).toHaveAttribute(
      "href",
      "/problems/L1-max-temperature?mode=practice",
    );
    expect(within(round).queryByText(/Second Largest/)).toBeNull();
  });

  it("sends a practice attempt without hints and shows Done", async () => {
    const fetchFn = fakeApi({
      "GET /api/v1/me": () => json(200, ME),
      "GET /api/v1/levels": () => json(200, OPEN_LEVELS),
      "GET /api/v1/problems/L1-max-temperature": () => json(200, PROBLEM),
      "POST /api/v1/problems/L1-max-temperature/attempts": () =>
        json(200, { ...GRADED, mode: "practice", xpGained: 10 }),
    });
    renderSignedInAt("/problems/L1-max-temperature?mode=practice");

    expect(await screen.findByText("Practice round")).toBeVisible();
    expect(screen.getByText("Done adds up to 10 XP")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Hints" })).toBeNull();
    await userEvent.type(
      screen.getByLabelText("Your explanation"),
      "Keep the largest value while reading the array once.",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Submit for grading" }),
    );

    expect(
      await screen.findByText("Marked Done in the practice round."),
    ).toBeVisible();
    expect(screen.getByText("+10 XP")).toBeVisible();
    const hintCalls = fetchFn.mock.calls.filter(([url]) =>
      String(url).includes("/hints"),
    );
    expect(hintCalls.every(([url]) => String(url).endsWith("/quota"))).toBe(
      true,
    );
    const post = fetchFn.mock.calls.find(([url]) =>
      String(url).endsWith("/attempts"),
    );
    expect(JSON.parse(String(post?.[1]?.body)).mode).toBe("practice");
  });
});
