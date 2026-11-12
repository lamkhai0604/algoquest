import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { fakeApi, json, ME } from "../test/fakeApi";
import { LEVELS } from "../test/gameData";
import { renderSignedInAt } from "../test/renderApp";
import type { Lesson } from "./types";

const LESSON: Lesson = {
  level: 1,
  title: "Big-O & Basics",
  markdown: [
    "# Big-O & Basics",
    "",
    "## Intuition",
    "",
    "Read the list **once**.",
    "",
    "## Template code",
    "",
    "```javascript",
    "let best = items[0];",
    "```",
  ].join("\n"),
  walkthrough: [
    { title: "Start", body: "Set `best` to 3." },
    { title: "Visit 9", body: "9 is bigger.", code: "best = 9;" },
  ],
  quickCheck: [
    {
      question: "Time of one pass?",
      options: ["O(1)", "O(n)"],
      answer: 1,
      explanation: "Each item is visited once.",
    },
  ],
  quickCheckDone: false,
};

const CHECKED = {
  correct: [true],
  done: true,
  xpGained: 5,
  levelXp: 5,
  levelTarget: 150,
};

function open(lesson: Lesson = LESSON) {
  const fetchFn = fakeApi({
    "GET /api/v1/me": () => json(200, ME),
    "GET /api/v1/levels": () => json(200, LEVELS),
    "GET /api/v1/levels/1/lesson": () => json(200, lesson),
    "POST /api/v1/levels/1/quick-check": () => json(200, CHECKED),
  });
  renderSignedInAt("/levels/1/lesson");
  return fetchFn;
}

const quickCheckPosts = (fetchFn: ReturnType<typeof fakeApi>) =>
  fetchFn.mock.calls.filter(([url]) => String(url).endsWith("/quick-check"));

describe("lesson page", () => {
  it("puts the walkthrough before the template code", async () => {
    open();

    expect(
      await screen.findByRole("heading", { name: "Lesson: Big-O & Basics" }),
    ).toBeVisible();
    const headings = screen
      .getAllByRole("heading")
      .map((heading) => heading.textContent);
    expect(headings.indexOf("Intuition")).toBeLessThan(
      headings.indexOf("Step by step"),
    );
    expect(headings.indexOf("Step by step")).toBeLessThan(
      headings.indexOf("Template code"),
    );
    expect(screen.getByText("once").tagName).toBe("STRONG");
    expect(screen.getByText("let best = items[0];")).toBeVisible();
  });

  it("steps through the walkthrough with Next and Back", async () => {
    open();
    const next = await screen.findByRole("button", { name: "Next step" });
    const back = screen.getByRole("button", { name: "Back" });

    expect(screen.getByText("Step 1 of 2")).toBeVisible();
    expect(back).toBeDisabled();

    await userEvent.click(next);
    expect(screen.getByText("Step 2 of 2")).toBeVisible();
    expect(screen.getByText("best = 9;")).toBeVisible();
    expect(next).toBeDisabled();

    await userEvent.click(back);
    expect(screen.getByText("Step 1 of 2")).toBeVisible();
  });

  it("gives immediate feedback and saves a finished quick check once", async () => {
    const fetchFn = open();
    const question = (await screen.findByText(/Time of one pass/)).closest(
      "fieldset",
    ) as HTMLElement;
    const pick = (name: string) =>
      userEvent.click(within(question).getByRole("button", { name }));

    await pick("O(1)");
    expect(within(question).getByRole("status")).toHaveTextContent(
      "Not quite. Try another option.",
    );
    expect(quickCheckPosts(fetchFn)).toHaveLength(0);

    await pick("O(n)");
    expect(within(question).getByRole("status")).toHaveTextContent(
      "Correct. Each item is visited once.",
    );
    expect(await screen.findByText("+5 XP")).toBeVisible();
    expect(screen.getByText("Quick check complete")).toBeVisible();
    const [[, init]] = quickCheckPosts(fetchFn) as [[unknown, RequestInit]];
    expect(JSON.parse(String(init.body))).toEqual({ answers: [1] });
    expect(
      within(question).getByRole("button", { name: "O(1)" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("link", { name: "Go to the problems" }),
    ).toHaveAttribute("href", "/levels/1");
  });

  it("shows a finished quick check as complete with no XP to earn", async () => {
    const fetchFn = open({ ...LESSON, quickCheckDone: true });

    expect(await screen.findByText("Quick check complete")).toBeVisible();
    expect(screen.queryByText("+5 XP")).toBeNull();
    expect(screen.getByRole("button", { name: "O(n)" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(quickCheckPosts(fetchFn)).toHaveLength(0);
  });
});
