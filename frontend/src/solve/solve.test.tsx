import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { fakeApi, json, ME } from "../test/fakeApi";
import { GRADED, LEVELS, PROBLEM } from "../test/gameData";
import { renderSignedInAt } from "../test/renderApp";

const ATTEMPTS = "POST /api/v1/problems/L1-max-temperature/attempts";
const EXPLANATION = "Walk the array once and keep the largest value so far.";

function open(attempts: () => Response, levels = () => json(200, LEVELS)) {
  const fetchFn = fakeApi({
    "GET /api/v1/me": () => json(200, ME),
    "GET /api/v1/levels": levels,
    "GET /api/v1/problems/L1-max-temperature": () => json(200, PROBLEM),
    [ATTEMPTS]: attempts,
  });
  renderSignedInAt("/problems/L1-max-temperature");
  return fetchFn;
}

const box = () => screen.findByLabelText("Your explanation");
const submitButton = () =>
  screen.getByRole("button", { name: "Submit for grading" });

function attemptBodies(fetchFn: ReturnType<typeof fakeApi>) {
  const posts = fetchFn.mock.calls.filter(([url]) =>
    String(url).endsWith("/attempts"),
  );
  return posts.map(
    ([, init]) => JSON.parse(String(init?.body)) as Record<string, unknown>,
  );
}

describe("solve page", () => {
  it("shows the problem, the rubric, and the time bonus", async () => {
    open(() => json(200, GRADED));

    expect(
      await screen.findByRole("heading", { name: "Max Temperature" }),
    ).toBeVisible();
    expect(screen.getByText(/Return the highest temperature/)).toBeVisible();
    expect(screen.getByText("[3, -2, 9, 4] → 9")).toBeVisible();
    expect(screen.getByText("Nothing to compare.")).toBeVisible();
    expect(screen.getByText("0 <= temps.length <= 10^5")).toBeVisible();
    expect(screen.getByText("Pattern and why · 40")).toBeVisible();
    expect(screen.getByText("Up to 25 XP")).toBeVisible();
    expect(screen.getByTitle("Time on this problem")).toHaveTextContent(
      "00:00 / 15:00 time bonus",
    );
  });

  it("rejects an empty or too-long explanation before grading", async () => {
    const fetchFn = open(() => json(200, GRADED));
    const input = await box();

    expect(submitButton()).toBeDisabled();
    fireEvent.change(input, { target: { value: "   " } });
    expect(submitButton()).toBeDisabled();

    fireEvent.change(input, { target: { value: "x".repeat(2001) } });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "longer than 2000 characters",
    );
    expect(screen.getByText("2001 / 2000")).toBeVisible();
    expect(submitButton()).toBeDisabled();
    expect(attemptBodies(fetchFn)).toHaveLength(0);
  });

  it("submits the explanation and shows the graded result", async () => {
    let levelCalls = 0;
    const levels = () => {
      levelCalls++;
      const xp = levelCalls === 1 ? 40 : 65;
      return json(200, [{ ...LEVELS[0], xp }]);
    };
    const fetchFn = open(() => json(200, GRADED), levels);
    await userEvent.type(await box(), EXPLANATION);
    await userEvent.click(submitButton());

    expect(await screen.findByText("Solved")).toBeVisible();
    expect(screen.getByLabelText("Score 95 of 100")).toBeVisible();
    expect(screen.getByText("40 / 40")).toBeVisible();
    expect(screen.getByText("5 / 10")).toBeVisible();
    expect(screen.getByText(/how the empty array is handled/)).toBeVisible();
    expect(screen.getByText("+25 XP")).toBeVisible();
    expect(screen.getByText("65 / 100 XP")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Back to the problems" }),
    ).toHaveAttribute("href", "/levels/1");

    const [body] = attemptBodies(fetchFn);
    expect(body?.text).toBe(EXPLANATION);
    expect(body?.attemptId).toMatch(/^[0-9a-f-]{36}$/);
    expect(typeof body?.secondsTaken).toBe("number");
    expect(await screen.findByTitle("Total XP")).toHaveTextContent("65");
  });

  it("keeps the text when grading is unavailable", async () => {
    let calls = 0;
    const fetchFn = open(() => {
      calls++;
      return calls === 1
        ? json(503, { detail: "Grading is unavailable, try again later." })
        : json(200, GRADED);
    });
    await userEvent.type(await box(), EXPLANATION);
    await userEvent.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Grading is unavailable, try again later.",
    );
    expect(await box()).toHaveValue(EXPLANATION);

    await userEvent.click(submitButton());
    expect(await screen.findByText("Solved")).toBeVisible();
    const [first, second] = attemptBodies(fetchFn);
    expect(second?.attemptId).toBe(first?.attemptId);
  });

  it("lets the player try again after a low score", async () => {
    const low = {
      ...GRADED,
      pattern: 20,
      steps: 15,
      complexity: 0,
      edgeCases: 0,
      total: 35,
      solved: false,
      xpGained: 0,
    };
    open(() => json(200, low));
    await userEvent.type(await box(), EXPLANATION);
    await userEvent.click(submitButton());

    expect(await screen.findByText("Not solved yet")).toBeVisible();
    expect(screen.getByText("+0 XP")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await box()).toHaveValue(EXPLANATION);
  });
});
