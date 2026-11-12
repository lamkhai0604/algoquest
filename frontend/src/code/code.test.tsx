import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { fakeApi, json, ME } from "../test/fakeApi";
import { GRADED, LEVELS, PROBLEM } from "../test/gameData";
import { renderSignedInAt } from "../test/renderApp";
import { tokenize } from "./highlight";
import type { CodeResult, CodeSetup } from "./types";

const SETUP: CodeSetup = {
  functionName: "maxTemperature",
  inputs: [[[3, -2, 9]], [[]]],
  javaRunsLeft: 45,
  javaDailyLimit: 45,
  solved: true,
  codeBonusAwarded: false,
};

const PASSED: CodeResult = {
  language: "javascript",
  passed: 2,
  total: 2,
  failedInput: null,
  failedOutput: null,
  failedError: null,
  compileError: null,
  xpGained: 20,
  codeBonusAwarded: true,
  levelXp: 40,
  levelTarget: 150,
  javaRunsLeft: 45,
};

describe("tokenize", () => {
  it("colours keywords, strings, numbers, and comments", () => {
    const tokens = tokenize(
      'function f(a) { return "x" + 42; } // done',
      "javascript",
    );
    const kinds = Object.fromEntries(
      tokens.filter((t) => t.kind !== "plain").map((t) => [t.text, t.kind]),
    );
    expect(kinds).toEqual({
      function: "keyword",
      return: "keyword",
      '"x"': "string",
      "42": "number",
      "// done": "comment",
    });
    expect(tokens.map((t) => t.text).join("")).toBe(
      'function f(a) { return "x" + 42; } // done',
    );
  });
});

describe("code panel", () => {
  function open(run: () => Response) {
    const fetchFn = fakeApi({
      "GET /api/v1/me": () => json(200, ME),
      "GET /api/v1/levels": () => json(200, LEVELS),
      "GET /api/v1/problems/L1-max-temperature": () =>
        json(200, { ...PROBLEM, lastResult: GRADED }),
      "GET /api/v1/problems/L1-max-temperature/code": () => json(200, SETUP),
      "POST /api/v1/problems/L1-max-temperature/code": run,
    });
    renderSignedInAt("/problems/L1-max-temperature");
    return fetchFn;
  }

  const posts = (fetchFn: ReturnType<typeof fakeApi>) =>
    fetchFn.mock.calls
      .filter(
        ([url, init]) =>
          init?.method === "POST" && String(url).endsWith("/code"),
      )
      .map(
        ([, init]) => JSON.parse(String(init?.body)) as Record<string, unknown>,
      );

  it("offers code under a solved problem and starts from the starter code", async () => {
    open(() => json(200, PASSED));

    expect(
      await screen.findByRole("heading", { name: "Code it for 2× XP" }),
    ).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Write code" }));

    const editor = await screen.findByLabelText("Your JavaScript code");
    expect(editor).toHaveValue("function maxTemperature(temps) {\n}");
    expect(screen.getByText(/Pass all 2 hidden tests/)).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Java" }));
    expect(screen.getByLabelText("Your Java code")).toHaveValue(
      "class Solution {\n  Integer maxTemperature(int[] temps) {\n  }\n}",
    );
    expect(screen.getByText(/45 of 45 runs left today/)).toBeVisible();
  });

  it("runs JavaScript in the browser and sends only the outputs", async () => {
    const fetchFn = open(() => json(200, PASSED));
    // Stand-in for the Web Worker: jsdom has no workers.
    const runner = vi.fn();
    const { runJavaScript } = await import("./runJavaScript");
    expect(typeof runJavaScript).toBe("function");

    await userEvent.click(
      await screen.findByRole("button", { name: "Write code" }),
    );
    const editor = await screen.findByLabelText("Your JavaScript code");
    fireEvent.change(editor, {
      target: {
        value:
          "function maxTemperature(t) { return t.length ? Math.max(...t) : null; }",
      },
    });

    // The page's runner needs Worker; give jsdom a tiny synchronous one.
    class FakeWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      postMessage(data: { inputs: unknown[][] }) {
        data.inputs.forEach((input, index) => {
          const list = input[0] as number[];
          const output = list.length ? Math.max(...list) : null;
          this.onmessage?.({
            data: { type: "result", index, output },
          } as MessageEvent);
        });
        this.onmessage?.({ data: { type: "done" } } as MessageEvent);
      }
      terminate() {
        runner();
      }
    }
    vi.stubGlobal("Worker", FakeWorker);
    URL.createObjectURL = vi.fn(() => "blob:fake");
    URL.revokeObjectURL = vi.fn();

    await userEvent.click(screen.getByRole("button", { name: "▶ Run tests" }));

    expect(await screen.findByText("2 / 2 tests passed")).toBeVisible();
    expect(screen.getByText("+20 XP · 2× XP earned")).toBeVisible();
    const [body] = posts(fetchFn);
    expect(body?.language).toBe("javascript");
    expect(body?.outputs).toEqual([9, null]);
    expect(body?.errors).toEqual([null, null]);
    expect(runner).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("shows the first failing input and a compile error", async () => {
    let call = 0;
    open(() => {
      call++;
      return json(
        200,
        call === 1
          ? {
              ...PASSED,
              language: "java",
              passed: 0,
              compileError: "Main.java:3: error: ';' expected",
              xpGained: 0,
              codeBonusAwarded: false,
              javaRunsLeft: 44,
            }
          : {
              ...PASSED,
              language: "java",
              passed: 1,
              failedInput: [[]],
              failedOutput: "0",
              xpGained: 0,
              codeBonusAwarded: false,
              javaRunsLeft: 43,
            },
      );
    });
    await userEvent.click(
      await screen.findByRole("button", { name: "Write code" }),
    );
    await userEvent.click(await screen.findByRole("button", { name: "Java" }));
    await userEvent.click(screen.getByRole("button", { name: "▶ Run tests" }));

    expect(await screen.findByText("Did not compile")).toBeVisible();
    expect(screen.getByText(/';' expected/)).toBeVisible();
    expect(screen.getByText(/44 of 45 runs left today/)).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "▶ Run tests" }));
    expect(await screen.findByText("1 / 2 tests passed")).toBeVisible();
    expect(screen.getByText(/First failing input: \[\]/)).toBeVisible();
    expect(screen.getByText(/Your output: 0/)).toBeVisible();
  });
});
