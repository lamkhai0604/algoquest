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
    "## Learning objectives",
    "",
    "- Spot when one pass is enough",
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
    {
      title: "Start",
      body: "Set `best` to 3.",
      visual: {
        cells: ["3", "9"],
        markers: [{ index: 0, label: "i" }],
        vars: [{ name: "best", value: "3" }],
      },
    },
    {
      title: "Visit 9",
      body: "9 is bigger.",
      code: "best = 9;",
      visual: {
        cells: ["3", "9"],
        markers: [{ index: 1, label: "i" }],
        vars: [{ name: "best", value: "9" }],
        predict: {
          question: "What is best now?",
          options: ["3", "9"],
          answer: 1,
          explanation: "9 is bigger than 3.",
          hides: ["best"],
        },
      },
    },
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

function open(lesson: Lesson = LESSON, step = 1) {
  const fetchFn = fakeApi({
    "GET /api/v1/me": () => json(200, ME),
    "GET /api/v1/levels": () => json(200, LEVELS),
    "GET /api/v1/levels/1/lesson": () => json(200, lesson),
    "POST /api/v1/levels/1/quick-check": () => json(200, CHECKED),
  });
  renderSignedInAt(`/levels/1/lesson?step=${step}`);
  return fetchFn;
}

const quickCheckPosts = (fetchFn: ReturnType<typeof fakeApi>) =>
  fetchFn.mock.calls.filter(([url]) => String(url).endsWith("/quick-check"));

const tab = (name: string) => screen.getByRole("tab", { name });
const variable = (name: string) =>
  screen.getByText(name, { selector: "dt" }).nextElementSibling;

describe("lesson page", () => {
  it("splits the lesson into five steps, starting with Understand", async () => {
    open();

    expect(
      await screen.findByRole("heading", { name: "Lesson: Big-O & Basics" }),
    ).toBeVisible();
    expect(screen.getAllByRole("tab")).toHaveLength(5);
    expect(tab("Step 1: Understand")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "Intuition" })).toBeVisible();
    expect(screen.getByText("once").tagName).toBe("STRONG");
    expect(screen.getByText("Spot when one pass is enough")).toBeVisible();
    expect(screen.queryByText("let best = items[0];")).toBeNull();

    await userEvent.click(tab("Step 3: Learn"));
    expect(screen.getByText("let best = items[0];")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Intuition" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /Next: Check/ }));
    expect(tab("Step 4: Check")).toHaveAttribute("aria-selected", "true");
  });

  it("steps through the walkthrough with Next, Back, keys, and Reset", async () => {
    open(LESSON, 2);
    const next = await screen.findByRole("button", { name: "Next step" });
    const back = screen.getByRole("button", { name: "Back" });

    expect(screen.getByText("Step 1 of 2")).toBeVisible();
    expect(back).toBeDisabled();
    expect(variable("best")).toHaveTextContent("3");

    await userEvent.click(next);
    expect(screen.getByText("Step 2 of 2")).toBeVisible();
    expect(next).toBeDisabled();

    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByText("Step 1 of 2")).toBeVisible();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByText("Step 2 of 2")).toBeVisible();
    await userEvent.keyboard("r");
    expect(screen.getByText("Step 1 of 2")).toBeVisible();
  });

  it("asks for a prediction before showing the step", async () => {
    open(LESSON, 2);
    await userEvent.click(
      await screen.findByRole("button", { name: "Next step" }),
    );

    expect(variable("best")).toHaveTextContent("?");
    expect(screen.queryByText("9 is bigger.")).toBeNull();
    expect(screen.queryByText("best = 9;")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "3" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Not quite. 9 is bigger than 3.",
    );
    expect(variable("best")).toHaveTextContent("9");
    expect(screen.getByText("9 is bigger.")).toBeVisible();
    expect(screen.getByText("best = 9;")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    await userEvent.click(screen.getByRole("button", { name: "Next step" }));
    expect(variable("best")).toHaveTextContent("?");
    await userEvent.click(
      screen.getByRole("button", { name: "Show the answer" }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Answer:");
    expect(variable("best")).toHaveTextContent("9");
  });

  it("gives immediate feedback and saves a finished quick check once", async () => {
    const fetchFn = open(LESSON, 4);
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

    await userEvent.click(screen.getByRole("button", { name: /Next: Practice/ }));
    expect(
      screen.getByRole("link", { name: "Go to the problems" }),
    ).toHaveAttribute("href", "/levels/1");
  });

  it("shows a finished quick check as complete with no XP to earn", async () => {
    const fetchFn = open({ ...LESSON, quickCheckDone: true }, 4);

    expect(await screen.findByText("Quick check complete")).toBeVisible();
    expect(screen.queryByText("+5 XP")).toBeNull();
    expect(screen.getByRole("button", { name: "O(n)" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(quickCheckPosts(fetchFn)).toHaveLength(0);
  });
});
