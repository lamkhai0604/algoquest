import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { fakeApi, json, ME } from "../test/fakeApi";
import { setLocale } from "../i18n";
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
    "",
    "```java",
    "int best = items[0];",
    "```",
    "",
    "## Complexity",
    "",
    "One pass is O(n) time.",
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
  intuition: {
    question: "The list grows from 100 to 1,000 items. How many steps now?",
    options: ["100", "About 1,000", "About 1,000,000"],
    answer: 1,
    explanation: "Ten times the items, ten times the steps.",
  },
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
  it("loads VI content and groups translated headings by stable IDs", async () => {
    setLocale("vi");
    try {
      const translated: Lesson = {
        ...LESSON,
        title: "Big-O và nền tảng thuật toán",
        markdown: [
          "# Big-O và nền tảng thuật toán",
          "",
          "## [objectives] Mục tiêu học tập",
          "",
          "- Mô tả độ phức tạp",
          "",
          "## [problem-hook] Tình huống mở đầu",
          "",
          "Đọc danh sách **một lần**.",
          "",
          "## [intuition] Trực giác",
          "",
          "Giữ lại giá trị lớn nhất.",
          "",
          "## [when-to-use] Khi nào nên dùng?",
          "",
          "Khi cần tìm phần tử lớn nhất.",
          "",
          "## [template-code] Code mẫu",
          "",
          "Một lần duyệt là O(n).",
        ].join("\n"),
      };
      const fetchFn = open(translated);
      expect(
        await screen.findByRole("heading", {
          name: "Bài học: Big-O và nền tảng thuật toán",
        }),
      ).toBeVisible();
      expect(
        screen.getByRole("heading", { name: "Tình huống mở đầu" }),
      ).toBeVisible();
      expect(screen.getByText("Mô tả độ phức tạp")).toBeVisible();
      expect(screen.getByRole("heading", { name: "Trực giác" })).toBeVisible();
      expect(
        screen.getByRole("heading", { name: "Khi nào nên dùng?" }),
      ).toBeVisible();
      expect(
        screen.getByRole("group", { name: "Kiểm tra trực giác" }),
      ).toBeVisible();
      expect(
        fetchFn.mock.calls.some(([url]) =>
          String(url).includes("/lesson?lang=vi"),
        ),
      ).toBe(true);
      await userEvent.click(
        screen.getByRole("tab", { name: "Bước 3: Tìm hiểu" }),
      );
      expect(screen.getByText("Code mẫu")).toBeVisible();
      expect(screen.queryByText("Tình huống mở đầu")).toBeNull();
    } finally {
      setLocale("en");
    }
  });

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

  it("asks an ungraded intuition question on the Understand step", async () => {
    const fetchFn = open();

    const question = await screen.findByRole("group", {
      name: "Check your intuition",
    });
    expect(question).toHaveTextContent("How many steps now?");
    expect(
      within(question).queryByText(/Ten times the items/),
    ).not.toBeInTheDocument();

    await userEvent.click(
      within(question).getByRole("button", { name: "About 1,000,000" }),
    );
    expect(within(question).getByRole("status")).toHaveTextContent(
      "Not quite. Ten times the items, ten times the steps.",
    );
    expect(quickCheckPosts(fetchFn)).toHaveLength(0);
  });

  it("shows Learn as collapsible sections with one code language at a time", async () => {
    open(LESSON, 3);

    const template = await screen.findByText("Template code");
    expect(template.closest("details")).toHaveAttribute("open");
    expect(
      screen.getByText("Complexity").closest("details"),
    ).not.toHaveAttribute("open");

    expect(screen.getByText("let best = items[0];")).toBeVisible();
    expect(screen.queryByText("int best = items[0];")).toBeNull();
    expect(screen.getByRole("button", { name: "Copy" })).toBeVisible();

    await userEvent.click(screen.getByRole("tab", { name: "Java" }));
    expect(screen.getByText("int best = items[0];")).toBeVisible();
    expect(screen.queryByText("let best = items[0];")).toBeNull();
    expect(localStorage.getItem("algoquest.codeLanguage")).toBe("java");

    await userEvent.click(screen.getByRole("tab", { name: "JavaScript" }));
    expect(localStorage.getItem("algoquest.codeLanguage")).toBe("javascript");
  });

  it("steps through the walkthrough with Next, Back, keys, and Reset", async () => {
    open(LESSON, 2);
    const next = await screen.findByRole("button", { name: "Next step" });
    const back = screen.getByRole("button", { name: "Back" });

    expect(screen.getByText("Step 1 of 2")).toBeVisible();
    expect(back).toBeDisabled();
    expect(variable("best")).toHaveTextContent("3");
    // The controls sit above the drawing and the explanation, so they keep
    // their place while the content below changes size from step to step.
    expect(
      next.compareDocumentPosition(variable("best")!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

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

  it("marks the two cells a step swapped", async () => {
    const swapped = {
      ...LESSON,
      walkthrough: [
        {
          title: "Swap",
          body: "9 moves to the front.",
          visual: { cells: ["9", "3"], swap: [0, 1] as [number, number] },
        },
      ],
    };
    open(swapped, 2);

    expect(await screen.findByText("Swapped [0] and [1]")).toBeVisible();
    expect(screen.getAllByText("⇄")).toHaveLength(2);
  });

  it("draws a linked list with its next pointers and the changed node", async () => {
    const linked = {
      ...LESSON,
      walkthrough: [
        {
          title: "Start",
          body: "1 points to 2, 2 points to null.",
          visual: { cells: ["1", "2"], next: [1, -1] },
        },
        {
          title: "Reverse",
          body: "2 now points back to 1.",
          visual: {
            cells: ["1", "2"],
            next: [-1, 0],
            markers: [{ index: 1, label: "curr" }],
          },
        },
      ],
    };
    open(linked, 2);

    expect(await screen.findByText("next [1]")).toBeVisible();
    expect(screen.getByText("next null")).toBeVisible();
    expect(screen.getByText("→")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Next step" }));
    expect(screen.getByText("next [0]")).toBeVisible();
    expect(screen.getByText("←")).toBeInTheDocument();
    expect(screen.getByText("curr")).toBeVisible();
    // Both nodes changed where they point.
    expect(screen.getByText("next [0]").parentElement?.className).toMatch(
      /cellSwapped/,
    );
  });

  it("draws a binary tree with its edges and marked node", async () => {
    const tree = {
      ...LESSON,
      walkthrough: [
        {
          title: "Search",
          body: "Go left from 8.",
          visual: {
            cells: ["8", "3", "10", "", "6"],
            tree: true,
            markers: [{ index: 1, label: "curr" }],
          },
        },
      ],
    };
    open(tree, 2);

    expect(await screen.findByText("curr")).toBeInTheDocument();
    expect(document.querySelectorAll("svg circle")).toHaveLength(4);
    // Edges: 8-3, 8-10, 3-6 (the empty cell 3 has no node).
    expect(document.querySelectorAll("svg line")).toHaveLength(3);
  });

  it("draws a graph with edges, arrows and visited vertices", async () => {
    const graph = {
      ...LESSON,
      walkthrough: [
        {
          title: "Search",
          body: "Visit 0, then its neighbours.",
          visual: {
            cells: ["0", "1", "2"],
            edges: [
              [0, 1],
              [1, 2],
            ],
            directed: true,
            visited: [0],
            positions: [
              [0, 0],
              [2, 0],
              [2, 2],
            ],
            weights: ["4", "11"],
            markers: [{ index: 1, label: "curr" }],
          },
        },
      ],
    };
    open(graph, 2);

    expect(await screen.findByText("curr")).toBeInTheDocument();
    expect(document.querySelectorAll("svg circle")).toHaveLength(3);
    expect(
      Array.from(document.querySelectorAll("[data-weight]")).map((g) =>
        g.getAttribute("data-weight"),
      ),
    ).toEqual(["4", "11"]);
    expect(document.querySelectorAll("svg line")).toHaveLength(2);
    expect(document.querySelectorAll("svg marker")).toHaveLength(1);
    expect(document.querySelectorAll('[data-visited="true"]')).toHaveLength(1);
  });

  it("animates a graph step: new vertices, travelled edges, queue and rings", async () => {
    const steps = [
      {
        title: "Start",
        body: "0 is in the queue.",
        visual: {
          cells: ["0", "1", "2"],
          edges: [
            [0, 1],
            [0, 2],
          ],
          visited: [0],
          queue: [0],
        },
      },
      {
        title: "Visit 0",
        body: "1 and 2 join.",
        visual: {
          cells: ["0", "1", "2"],
          edges: [
            [0, 1],
            [0, 2],
          ],
          visited: [0, 1, 2],
          activeEdges: [
            [0, 1],
            [0, 2],
          ],
          queue: [1, 2],
          rings: [0, 1, 1],
          markers: [{ index: 0, label: "curr" }],
        },
      },
    ];
    open({ ...LESSON, walkthrough: steps }, 2);
    await userEvent.click(
      await screen.findByRole("button", { name: "Next step" }),
    );

    expect(document.querySelectorAll('[data-active="true"]')).toHaveLength(2);
    const queue = screen.getByRole("list", { name: "Queue (front → back)" });
    expect(queue).toHaveTextContent("12");
    expect(screen.getByText("Distance from the start:")).toBeInTheDocument();
  });

  it("shades a window of cells", async () => {
    const lesson = {
      ...LESSON,
      walkthrough: [
        {
          title: "Window",
          body: "Sum of three.",
          visual: { cells: ["2", "1", "5", "1", "3"], window: [1, 3] },
        },
      ],
    };
    open(lesson, 2);

    expect(await screen.findByText(/Window \[1\]–\[3\]/)).toBeVisible();
    expect(document.querySelectorAll('[data-window="true"]')).toHaveLength(3);
  });

  it("draws intervals on a time axis with kept bars and a sweep line", async () => {
    const lesson = {
      ...LESSON,
      walkthrough: [
        {
          title: "Meetings",
          body: "Keep B.",
          visual: {
            cells: ["A", "B", "C"],
            intervals: [
              [1, 4],
              [2, 3],
              [5, 7],
            ],
            chosen: [1],
            line: 3,
            markers: [{ index: 2, label: "next" }],
          },
        },
      ],
    };
    open(lesson, 2);

    expect(
      await screen.findByRole("img", { name: "Intervals on a time axis" }),
    ).toBeInTheDocument();
    expect(document.querySelectorAll("[data-bar]")).toHaveLength(3);
    expect(document.querySelectorAll('[data-kept="true"]')).toHaveLength(1);
    expect(document.querySelector('[data-marker="2"]')).toHaveTextContent(
      "next",
    );
    expect(document.querySelector("[data-line]")).not.toBeNull();
  });

  it("draws a table with labels, read cells, and hides the filled cell until the prediction is answered", async () => {
    const lesson = {
      ...LESSON,
      walkthrough: [
        {
          title: "Fill",
          body: "Fill the last cell.",
          visual: {
            cells: ["0", "0", "0", "0", "1", "1"],
            rows: 2,
            rowLabels: ["", "a"],
            columnLabels: ["", "a", "b"],
            reads: [1, 3, 4],
            markers: [{ index: 5, label: "fill" }],
            predict: {
              question: "What goes in the cell?",
              options: ["1", "2"],
              answer: 0,
              explanation: "Take the larger neighbour.",
              hides: ["cell"],
            },
          },
        },
      ],
    };
    open(lesson, 2);

    const table = await screen.findByRole("table", { name: "Table of values" });
    expect(within(table).getAllByRole("columnheader")).toHaveLength(3);
    expect(table.querySelectorAll('[data-read="true"]')).toHaveLength(3);
    const filled = table.querySelector('[data-cell="5"]')!;
    expect(filled).toHaveTextContent("?");
    await userEvent.click(screen.getByRole("button", { name: "1" }));
    expect(filled).toHaveTextContent("1");
    expect(filled).toHaveTextContent("fill");
  });

  it("draws a stack strip and lets the explorer switch to DFS", async () => {
    const lesson = {
      ...LESSON,
      walkthrough: [
        {
          title: "Stack",
          body: "Two waiting.",
          visual: { cells: ["2", "7"], stack: ["7", "3"] },
        },
        {
          title: "Explore",
          body: "Try it.",
          visual: {
            cells: ["0", "1", "2"],
            edges: [
              [0, 1],
              [1, 2],
            ],
            explore: true,
          },
        },
      ],
    };
    open(lesson, 2);

    const stack = await screen.findByRole("list", {
      name: "Stack (bottom → top)",
    });
    expect(stack).toHaveTextContent("73");
    await userEvent.click(screen.getByRole("button", { name: "Next step" }));
    await userEvent.click(screen.getByRole("button", { name: "DFS (stack)" }));
    const next = screen.getAllByRole("button", { name: "Next step" })[0]!;
    await userEvent.click(next);
    await userEvent.click(next);
    expect(screen.getByText("0 → 1")).toBeInTheDocument();
  });

  it("plays the steps by itself and pauses", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const steps = [1, 2, 3].map((k) => ({ title: `Step ${k}`, body: "." }));
      open({ ...LESSON, walkthrough: steps }, 2);
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime.bind(vi),
      });
      await user.click(await screen.findByRole("button", { name: "Play" }));
      await act(async () => {
        vi.advanceTimersByTime(1500);
      });
      expect(screen.getByText("Step 2")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Pause" }));
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByText("Step 2")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
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

    await userEvent.click(
      screen.getByRole("button", { name: /Next: Practice/ }),
    );
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
