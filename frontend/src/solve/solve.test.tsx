import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { fakeApi, json, ME } from "../test/fakeApi";
import { GRADED, LEVELS, PROBLEM } from "../test/gameData";
import { renderSignedInAt } from "../test/renderApp";
import type { ProblemDetail } from "./types";

const ATTEMPTS = "POST /api/v1/problems/L1-max-temperature/attempts";
const RESTART = "POST /api/v1/problems/L1-max-temperature/restart";
const EXPLANATION = "Walk the array once and keep the largest value so far.";

function open(
  attempts: () => Response,
  levels = () => json(200, LEVELS),
  problem: ProblemDetail = PROBLEM,
) {
  // The server's clock: a restart sets it back to zero.
  let active = problem.activeSeconds;
  const fetchFn = fakeApi({
    "GET /api/v1/me": () => json(200, ME),
    "GET /api/v1/levels": levels,
    "GET /api/v1/problems/L1-max-temperature": () => json(200, problem),
    "POST /api/v1/problems/L1-max-temperature/heartbeat": () =>
      json(200, { activeSeconds: active }),
    [RESTART]: () => {
      active = 0;
      return json(200, { activeSeconds: 0 });
    },
    [ATTEMPTS]: attempts,
  });
  renderSignedInAt("/problems/L1-max-temperature");
  return fetchFn;
}

const box = () => screen.findByLabelText("Your explanation");
const submitButton = () =>
  screen.getByRole("button", { name: "Submit for grading" });

function calls(fetchFn: ReturnType<typeof fakeApi>, ending: string) {
  return fetchFn.mock.calls.filter(([url]) => String(url).endsWith(ending));
}

function attemptBodies(fetchFn: ReturnType<typeof fakeApi>) {
  return calls(fetchFn, "/attempts").map(
    ([, init]) => JSON.parse(String(init?.body)) as Record<string, unknown>,
  );
}

describe("solve page", () => {
  it("shows the problem, the rubric, the time bonus, and the scoring guide", async () => {
    const fetchFn = open(() => json(200, GRADED));

    expect(
      await screen.findByRole("heading", { name: "Max Temperature" }),
    ).toBeVisible();
    expect(screen.getByText(/Return the highest temperature/)).toBeVisible();
    expect(screen.getByText("[3, -2, 9, 4] → 9")).toBeVisible();
    expect(screen.getByText("Nothing to compare.")).toBeVisible();
    expect(screen.getByText("0 <= temps.length <= 10^5")).toBeVisible();
    expect(screen.getByText("Pattern and why · 40")).toBeVisible();
    expect(screen.getByText("Up to 20 XP")).toBeVisible();
    expect(screen.getByTitle("Active time on this problem")).toHaveTextContent(
      "00:00 / 15:00 time bonus",
    );
    expect(
      screen.getByText(/Finish within 15:00 of active time/),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "How your answer is scored" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Back to Level 1" }),
    ).toHaveAttribute("href", "/levels/1");
    // The clock reports to the server while the page is open (D-043).
    expect(calls(fetchFn, "/heartbeat").length).toBeGreaterThan(0);
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

  it("submits the explanation and shows the result with Back and Next", async () => {
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
    expect(screen.getByText("+20 XP")).toBeVisible();
    expect(screen.getByText("65 / 150 XP")).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Back to the problems/ }),
    ).toHaveAttribute("href", "/levels/1");
    expect(screen.getByRole("link", { name: /Next problem/ })).toHaveAttribute(
      "href",
      "/problems/L1-second-largest",
    );
    expect(document.querySelector("canvas")).toBeNull();

    const [body] = attemptBodies(fetchFn);
    expect(body?.text).toBe(EXPLANATION);
    expect(body?.attemptId).toMatch(/^[0-9a-f-]{36}$/);
    expect(await screen.findByTitle("Total XP")).toHaveTextContent("65");
  });

  it("keeps the text when grading is unavailable", async () => {
    let attempts = 0;
    const fetchFn = open(() => {
      attempts++;
      return attempts === 1
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

  it("opens a graded problem on its last result; Retry asks first", async () => {
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
    const fetchFn = open(() => json(200, GRADED), undefined, {
      ...PROBLEM,
      activeSeconds: 200,
      lastResult: low,
    });

    expect(await screen.findByText("Not solved yet")).toBeVisible();
    expect(screen.queryByLabelText("Your explanation")).toBeNull();
    expect(screen.queryByRole("link", { name: /Next problem/ })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /Retry/ }));
    const dialog = await screen.findByRole("dialog", {
      name: "Retry this problem?",
    });
    expect(dialog).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: "Keep my result" }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(calls(fetchFn, "/restart")).toHaveLength(0);

    await userEvent.click(screen.getByRole("button", { name: /Retry/ }));
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await box()).toHaveValue("");
    expect(calls(fetchFn, "/restart")).toHaveLength(1);
    expect(screen.getByTitle("Active time on this problem")).toHaveTextContent(
      "00:00",
    );
  });

  it("asks to continue a paused problem and keeps the draft", async () => {
    window.localStorage.setItem(
      "algoquest.draft.L1-max-temperature",
      "My unsent idea",
    );
    const fetchFn = open(() => json(200, GRADED), undefined, {
      ...PROBLEM,
      activeSeconds: 16 * 60,
    });

    expect(
      await screen.findByRole("dialog", {
        name: "Continue where you left off?",
      }),
    ).toBeVisible();
    // The clock does not run while the dialog asks.
    expect(calls(fetchFn, "/heartbeat")).toHaveLength(0);

    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await box()).toHaveValue("My unsent idea");
    expect(screen.getByTitle("Active time on this problem")).toHaveTextContent(
      "16:00 · time bonus over",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "The time bonus is over",
    );
    expect(screen.getByText("Up to 15 XP")).toBeVisible();
  });

  it("Start again clears the draft and the clock", async () => {
    window.localStorage.setItem(
      "algoquest.draft.L1-max-temperature",
      "Old draft",
    );
    const fetchFn = open(() => json(200, GRADED), undefined, {
      ...PROBLEM,
      activeSeconds: 120,
    });

    await screen.findByRole("dialog");
    await userEvent.click(screen.getByRole("button", { name: "Start again" }));
    expect(await box()).toHaveValue("");
    expect(calls(fetchFn, "/restart")).toHaveLength(1);
    expect(
      window.localStorage.getItem("algoquest.draft.L1-max-temperature"),
    ).toBeNull();
  });

  it("celebrates a perfect score", async () => {
    open(() => json(200, { ...GRADED, total: 100, edgeCases: 10 }));
    await userEvent.type(await box(), EXPLANATION);
    await act(() => userEvent.click(submitButton()));

    expect(await screen.findByLabelText("Score 100 of 100")).toBeVisible();
    expect(document.querySelector("canvas")).not.toBeNull();
  });
});
