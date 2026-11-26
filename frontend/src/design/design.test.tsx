import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { fakeApi, json, ME } from "../test/fakeApi";
import { LEVELS, PROBLEMS } from "../test/gameData";
import { renderSignedInAt } from "../test/renderApp";
import type { DesignResult, PromptView } from "./types";

const VIEW: PromptView = {
  id: "D1-counter",
  level: 1,
  levelTitle: "Big-O & Basics",
  title: "A Visit Counter",
  prompt: "Design a service that counts visits to one page.",
  facts: ["About 100 visits per second at peak"],
  scope: ["One page only"],
  form: "scaffold",
  sections: ["requirements", "estimate", "components", "failure"],
  answersLeftToday: 3,
};

const RESULT: DesignResult = {
  total: 82,
  categories: [
    { category: "requirements", points: 20, max: 20 },
    { category: "estimation", points: 12, max: 15 },
    { category: "design", points: 25, max: 25 },
    { category: "data", points: 15, max: 20 },
    { category: "tradeoffs", points: 10, max: 20 },
  ],
  strengths: "Clear flow.",
  improve: "Trade-offs: say when a lost count matters.",
  reference: {
    assumptions: ["Visits arrive evenly"],
    design: "One server increments a counter row.",
    alternatives: ["Count in memory and write every second"],
  },
  answersLeftToday: 2,
};

const base = {
  "GET /api/v1/me": () => json(200, ME),
  "GET /api/v1/levels": () => json(200, LEVELS),
  "GET /api/v1/levels/1/problems": () => json(200, PROBLEMS),
};

const SECTIONS = [
  ["1. Requirements", "Count every visit, total at most 5 s old."],
  ["2. One estimate", "100 writes per second is small."],
  ["3. Components", "One server and one counter row."],
  ["4. One failure or trade-off", "A crash loses nothing once written."],
] as const;

describe("design prompts", () => {
  it("lists a level's prompts with the best score", async () => {
    fakeApi({
      ...base,
      "GET /api/v1/levels/1/designs": () =>
        json(200, [
          { id: "D1-counter", title: "A Visit Counter", bestScore: null },
          { id: "D1-feed", title: "A News Feed", bestScore: 74 },
        ]),
    });
    renderSignedInAt("/levels/1");

    const section = await screen.findByRole("region", {
      name: /Design prompts/,
    });
    expect(
      within(section).getByRole("link", { name: /A Visit Counter/ }),
    ).toHaveAttribute("href", "/designs/D1-counter");
    expect(within(section).getByText("Not tried")).toBeVisible();
    expect(within(section).getByText("Best 74/100")).toBeVisible();
  });

  it("sends the four sections, then shows the rubric and the reference on request", async () => {
    const fetchFn = fakeApi({
      ...base,
      "GET /api/v1/designs/D1-counter": () => json(200, VIEW),
      "POST /api/v1/designs/D1-counter/answers": () => json(200, RESULT),
    });
    renderSignedInAt("/designs/D1-counter");

    const grade = await screen.findByRole("button", {
      name: "Grade my design",
    });
    expect(
      screen.getByText("About 100 visits per second at peak"),
    ).toBeVisible();
    for (const [label, text] of SECTIONS.slice(0, 3)) {
      await userEvent.type(screen.getByLabelText(label), text);
    }
    expect(grade).toBeDisabled();
    const [lastLabel, lastText] = SECTIONS[3];
    await userEvent.type(screen.getByLabelText(lastLabel), lastText);
    await userEvent.click(grade);

    const [, init] = fetchFn.mock.calls.find(([, i]) => i?.method === "POST")!;
    expect(JSON.parse(String(init?.body))).toEqual({
      sections: {
        requirements: SECTIONS[0][1],
        estimate: SECTIONS[1][1],
        components: SECTIONS[2][1],
        failure: SECTIONS[3][1],
      },
    });
    expect(await screen.findByText("82/100")).toBeVisible();
    expect(screen.getByText("Trade-offs and failures")).toBeVisible();
    expect(screen.getByText("10/20")).toBeVisible();
    expect(screen.getByText(/say when a lost count matters/)).toBeVisible();
    expect(
      screen.queryByText("One server increments a counter row."),
    ).toBeNull();

    await userEvent.click(
      screen.getByRole("button", { name: "Show a reference design" }),
    );
    expect(
      screen.getByText("One server increments a counter row."),
    ).toBeVisible();
    expect(screen.getByText(/not the only correct answer/)).toBeVisible();
    expect(screen.getByText(/2 answers left today/)).toBeVisible();
  });

  it("shows the eight steps of the routine and sends every one", async () => {
    const routine: PromptView = {
      ...VIEW,
      id: "D42-poll",
      form: "routine",
      sections: [
        "requirements",
        "estimate",
        "api",
        "data",
        "design",
        "deepdive",
        "failures",
        "summary",
      ],
    };
    const fetchFn = fakeApi({
      ...base,
      "GET /api/v1/designs/D42-poll": () => json(200, routine),
      "POST /api/v1/designs/D42-poll/answers": () => json(200, RESULT),
    });
    renderSignedInAt("/designs/D42-poll");

    const grade = await screen.findByRole("button", {
      name: "Grade my design",
    });
    const labels = [
      "1. Requirements and scope",
      "2. Estimates",
      "3. API",
      "4. Data model",
      "5. High-level design",
      "6. Deep dive",
      "7. Failures",
      "8. Summary",
    ];
    for (const label of labels) {
      await userEvent.type(screen.getByLabelText(label), `Text for ${label}`);
    }
    await userEvent.click(grade);

    const [, init] = fetchFn.mock.calls.find(([, i]) => i?.method === "POST")!;
    const body = JSON.parse(String(init?.body));
    expect(Object.keys(body.sections)).toEqual(routine.sections);
    expect(body.sections.deepdive).toBe("Text for 6. Deep dive");
    expect(await screen.findByText("82/100")).toBeVisible();
  });
});
