import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { fakeApi, json, ME } from "../test/fakeApi";
import { LEVELS, PROBLEMS } from "../test/gameData";
import { renderSignedInAt } from "../test/renderApp";
import type { AnswerResult, ChallengeView } from "./types";

const VIEW: ChallengeView = {
  id: "P1-repeat",
  level: 1,
  levelTitle: "Big-O & Basics",
  title: "Repeat Visitor",
  statement: "Return true if any badge was scanned twice.",
  examples: ["[42, 7, 7] → true"],
  constraints: ["Up to 100,000 scans"],
  approaches: [
    { id: "hash", name: "HashMap / HashSet", hint: "Remember what you have seen" },
    { id: "nested", name: "Nested loops", hint: "Compare every pair" },
    { id: "pass", name: "Single pass", hint: "One running value" },
  ],
  answersLeftToday: 5,
};

const RESULT: AnswerResult = {
  approach: "nested",
  label: "valid",
  correct: true,
  bestApproach: "hash",
  reasonScore: 100,
  reason: 60,
  complexity: 40,
  feedback: "Clear reason.",
  comparison: [
    { ...VIEW.approaches[0]!, label: "best", time: "O(n)", space: "O(n)", why: "One pass with a set." },
    { ...VIEW.approaches[1]!, label: "valid", time: "O(n²)", space: "O(1)", why: "Correct but slow." },
    { ...VIEW.approaches[2]!, label: "unsuitable", time: "O(n)", space: "O(1)", why: "Cannot remember." },
  ],
  answersLeftToday: 4,
};

const base = {
  "GET /api/v1/me": () => json(200, ME),
  "GET /api/v1/levels": () => json(200, LEVELS),
  "GET /api/v1/levels/1/problems": () => json(200, PROBLEMS),
};

describe("pattern challenges", () => {
  it("lists a level's challenges on the level page", async () => {
    fakeApi({
      ...base,
      "GET /api/v1/levels/1/patterns": () =>
        json(200, [
          { id: "P1-repeat", title: "Repeat Visitor", bestLabel: null },
          { id: "P1-gift", title: "Two Gifts", bestLabel: "valid" },
        ]),
    });
    renderSignedInAt("/levels/1");

    const section = await screen.findByRole("region", {
      name: /Pattern challenges/,
    });
    expect(
      within(section).getByRole("link", { name: /Repeat Visitor/ }),
    ).toHaveAttribute("href", "/patterns/P1-repeat");
    expect(within(section).getByText("Not tried")).toBeVisible();
    expect(within(section).getByText("Valid, not the best")).toBeVisible();
  });

  it("hides the section when a level has no challenges", async () => {
    fakeApi({ ...base, "GET /api/v1/levels/1/patterns": () => json(200, []) });
    renderSignedInAt("/levels/1");

    expect(await screen.findByText("Problems")).toBeVisible();
    expect(screen.queryByText(/Pattern challenges/)).toBeNull();
  });

  it("sends the choice and reason, then shows the verdict and the comparison", async () => {
    const fetchFn = fakeApi({
      ...base,
      "GET /api/v1/patterns/P1-repeat": () => json(200, VIEW),
      "POST /api/v1/patterns/P1-repeat/answers": () => json(200, RESULT),
    });
    renderSignedInAt("/patterns/P1-repeat");

    const check = await screen.findByRole("button", { name: "Check my choice" });
    expect(check).toBeDisabled();
    await userEvent.click(screen.getByRole("radio", { name: /Nested loops/ }));
    await userEvent.type(
      screen.getByLabelText("Why this approach?"),
      "Compare every pair. O(n²).",
    );
    await userEvent.click(check);

    const [, init] = fetchFn.mock.calls.find(([, i]) => i?.method === "POST")!;
    expect(JSON.parse(String(init?.body))).toEqual({
      approach: "nested",
      explanation: "Compare every pair. O(n²).",
    });
    expect(await screen.findByText("It works.", { exact: false })).toBeVisible();
    expect(screen.getByText("100/100")).toBeVisible();
    const table = screen.getByRole("table");
    expect(within(table).getByText("Nested loops (yours)")).toBeVisible();
    expect(within(table).getByText("Best fit")).toBeVisible();
    expect(screen.getByText(/4 answers left today/)).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Try another approach" }));
    expect(screen.getByRole("radio", { name: /Nested loops/ })).not.toBeChecked();
  });

  it("shows the server's message when the daily limit is reached", async () => {
    fakeApi({
      ...base,
      "GET /api/v1/patterns/P1-repeat": () => json(200, VIEW),
      "POST /api/v1/patterns/P1-repeat/answers": () =>
        json(429, {
          title: "Daily limit reached",
          detail: "You have answered this challenge 5 times today. Try again tomorrow.",
        }),
    });
    renderSignedInAt("/patterns/P1-repeat");

    await userEvent.click(await screen.findByRole("radio", { name: /HashMap/ }));
    await userEvent.type(screen.getByLabelText("Why this approach?"), "Keep a set of badges.");
    await userEvent.click(screen.getByRole("button", { name: "Check my choice" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Try again tomorrow/);
  });
});
