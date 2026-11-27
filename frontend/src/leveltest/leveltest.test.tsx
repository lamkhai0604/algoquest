import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { setLocale } from "../i18n";
import { fakeApi, json, ME } from "../test/fakeApi";
import { LEVELS, PROBLEM, PROBLEMS } from "../test/gameData";
import { renderSignedInAt } from "../test/renderApp";
import type { LevelTest } from "./types";

const inHours = (hours: number) =>
  new Date(Date.now() + hours * 3600_000).toISOString();

function makeTest(rest: Partial<LevelTest>): LevelTest {
  const problem = (id: string, title: string) => ({
    problem: { ...PROBLEM, id, title },
    answer: "",
    result: null,
  });
  return {
    id: "t-1",
    level: 1,
    status: "running",
    startedAt: new Date().toISOString(),
    endsAt: inHours(2),
    serverTime: new Date().toISOString(),
    problems: [
      problem("L1-min-and-max", "Coldest and Hottest"),
      problem("L1-count-peaks", "Mountain Peaks"),
      problem("L1-largest-jump", "Largest Jump"),
    ],
    score: null,
    nextLevelState: null,
    ...rest,
  };
}

afterEach(() => setLocale("en"));

describe("level-up test", () => {
  it("loads Vietnamese test prompts without erasing an unsaved answer on language switch", async () => {
    setLocale("vi");
    const data = makeTest({});
    data.problems[0]!.problem.title = "Nhiệt độ thấp nhất và cao nhất";
    const fetchFn = fakeApi({
      "GET /api/v1/me": () => json(200, ME),
      "GET /api/v1/levels": () => json(200, LEVELS),
      "GET /api/v1/tests/t-1": () => json(200, data),
    });
    renderSignedInAt("/tests/t-1");
    expect(
      await screen.findByRole("heading", {
        name: /Nhiệt độ thấp nhất và cao nhất/,
      }),
    ).toBeVisible();
    const answer = await screen.findByLabelText("Phần giải thích của bạn", {
      selector: "#answer-L1-min-and-max",
    });
    await userEvent.type(answer, "One pass");
    expect(
      fetchFn.mock.calls.some(([url]) =>
        String(url).endsWith("/tests/t-1?lang=vi"),
      ),
    ).toBe(true);
    act(() => setLocale("en"));
    expect(answer).toHaveValue("One pass");
  });

  it("can be started from the level page when the bar is full", async () => {
    const full = [
      { ...LEVELS[0], xp: 100, testOpen: true, practiceOpen: true },
    ];
    fakeApi({
      "GET /api/v1/me": () => json(200, ME),
      "GET /api/v1/levels": () => json(200, full),
      "GET /api/v1/levels/1/problems": () => json(200, PROBLEMS),
      "POST /api/v1/levels/1/tests": () => json(200, makeTest({})),
      "GET /api/v1/tests/t-1": () => json(200, makeTest({})),
    });
    renderSignedInAt("/levels/1");

    await userEvent.click(
      await screen.findByRole("button", { name: "Start the test" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Level 1 test" }),
    ).toBeVisible();
    expect(screen.getByTitle("Time left")).toHaveTextContent(
      /^1(19|20):\d\d left$/,
    );
  });

  it.each([
    ["en", "Open the unfinished test", "Finish your existing test first:"],
    [
      "vi",
      "Mở bài kiểm tra chưa hoàn thành",
      "Bạn cần hoàn thành bài kiểm tra đang làm trước:",
    ],
  ] as const)(
    "links to the blocking test using server metadata (%s)",
    async (locale, linkText, message) => {
      setLocale(locale);
      const full = [
        { ...LEVELS[0], xp: 100, testOpen: true, practiceOpen: true },
      ];
      const blockingId = "f1f2f3f4-0000-4000-8000-000000000001";
      fakeApi({
        "GET /api/v1/me": () => json(200, ME),
        "GET /api/v1/levels": () => json(200, full),
        "GET /api/v1/levels/1/problems": () => json(200, PROBLEMS),
        "POST /api/v1/levels/1/tests": () =>
          json(409, {
            title: "Conflict",
            detail: "Finish your Level 2 test first.",
            blockingTestId: blockingId,
            blockingLevel: 2,
            blockingLevelName: "Arrays & Hashing",
          }),
      });
      renderSignedInAt("/levels/1");
      await userEvent.click(
        await screen.findByRole("button", {
          name: locale === "vi" ? "Bắt đầu kiểm tra" : "Start the test",
        }),
      );
      const link = await screen.findByRole("link", { name: linkText });
      expect(link).toHaveAttribute("href", `/tests/${blockingId}`);
      expect(screen.getByRole("alert")).toHaveTextContent(message);
      expect(screen.getByRole("alert")).toHaveTextContent("Arrays & Hashing");
    },
  );

  it("keeps unrelated API errors visible without a blocking-test link", async () => {
    const full = [
      { ...LEVELS[0], xp: 100, testOpen: true, practiceOpen: true },
    ];
    fakeApi({
      "GET /api/v1/me": () => json(200, ME),
      "GET /api/v1/levels": () => json(200, full),
      "GET /api/v1/levels/1/problems": () => json(200, PROBLEMS),
      "POST /api/v1/levels/1/tests": () =>
        json(403, { detail: "This level is locked." }),
    });
    renderSignedInAt("/levels/1");
    await userEvent.click(
      await screen.findByRole("button", { name: "Start the test" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This level is locked.",
    );
    expect(
      screen.queryByRole("link", { name: "Open the unfinished test" }),
    ).toBeNull();
  });

  it("is closed below a full bar", async () => {
    fakeApi({
      "GET /api/v1/me": () => json(200, ME),
      "GET /api/v1/levels": () => json(200, LEVELS),
      "GET /api/v1/levels/1/problems": () => json(200, PROBLEMS),
    });
    renderSignedInAt("/levels/1");

    expect(
      await screen.findByText("Opens when the level bar is full (150 XP)."),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: "Start the test" })).toBeNull();
    expect(screen.getByRole("button", { name: "Hard mode" })).toBeDisabled();
  });

  it("saves answers, submits, and shows the score and unlock", async () => {
    const fetchFn = fakeApi({
      "GET /api/v1/me": () => json(200, ME),
      "GET /api/v1/levels": () => json(200, LEVELS),
      "GET /api/v1/tests/t-1": () => json(200, makeTest({})),
      "POST /api/v1/tests/t-1/answers": () => json(200, makeTest({})),
      "POST /api/v1/tests/t-1/submit": () => {
        const graded = makeTest({ status: "submitted", score: 95 });
        graded.problems = graded.problems.map((p) => ({
          ...p,
          answer: "x",
          result: {
            pattern: 40,
            steps: 30,
            complexity: 20,
            edgeCases: 5,
            feedback: "Name the empty case.",
          },
        }));
        return json(200, { ...graded, nextLevelState: "EASY_ONLY" });
      },
    });
    renderSignedInAt("/tests/t-1");

    const box = await screen.findByLabelText("Your explanation", {
      selector: "#answer-L1-min-and-max",
    });
    await userEvent.type(box, "One pass tracking min and max.");
    await userEvent.click(
      screen.getByRole("button", { name: "Submit the test" }),
    );

    expect(await screen.findByText("Passed")).toBeVisible();
    expect(screen.getByText(/Easy problems are open/)).toBeVisible();
    expect(screen.getAllByText("95 / 100")).toHaveLength(3);
    const saves = fetchFn.mock.calls.filter(([url]) =>
      new URL(String(url)).pathname.endsWith("/answers"),
    );
    expect(String(saves.at(-1)?.[1]?.body)).toContain("tracking min and max");
  });

  it("submits by itself when the time is up", async () => {
    const fetchFn = fakeApi({
      "GET /api/v1/me": () => json(200, ME),
      "GET /api/v1/levels": () => json(200, LEVELS),
      "GET /api/v1/tests/t-1": () =>
        json(200, makeTest({ status: "timeUp", endsAt: inHours(-1) })),
      "POST /api/v1/tests/t-1/submit": () =>
        json(
          200,
          makeTest({ status: "submitted", score: 0, nextLevelState: "LOCKED" }),
        ),
    });
    renderSignedInAt("/tests/t-1");

    expect(await screen.findByText("Not passed yet")).toBeVisible();
    expect(screen.getAllByText("No answer: 0 / 100")).toHaveLength(3);
    const submits = fetchFn.mock.calls.filter(([url]) =>
      new URL(String(url)).pathname.endsWith("/submit"),
    );
    expect(submits).toHaveLength(1);
  });
});
