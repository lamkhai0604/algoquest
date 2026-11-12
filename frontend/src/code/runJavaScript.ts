import type { BrowserRun } from "./types";

/** JavaScript stops after this long, for all tests together (D-035). */
export const TIME_LIMIT_MS = 5000;

/**
 * The worker runs the player's code in its own thread with no access to the
 * page. It reports each test as it finishes, so a timeout keeps the earlier
 * results.
 */
const WORKER = `
self.onmessage = (event) => {
  const { code, functionName, inputs } = event.data;
  let fn;
  try {
    fn = new Function(code + "\\n;return typeof " + functionName + " === 'function' ? " + functionName + " : undefined;")();
  } catch (error) {
    self.postMessage({ type: "fatal", error: String(error && error.name || "Error") + ": " + String(error && error.message || error) });
    return;
  }
  if (typeof fn !== "function") {
    self.postMessage({ type: "fatal", error: "Define a function named " + functionName + "." });
    return;
  }
  inputs.forEach((input, index) => {
    try {
      const args = JSON.parse(JSON.stringify(input));
      const value = fn(...args);
      const output = value === undefined ? null : JSON.parse(JSON.stringify(value));
      self.postMessage({ type: "result", index, output });
    } catch (error) {
      self.postMessage({ type: "result", index, error: String(error && error.name || "Error") + ": " + String(error && error.message || error) });
    }
  });
  self.postMessage({ type: "done" });
};
`;

type Message =
  | { type: "fatal"; error: string }
  | { type: "result"; index: number; output?: unknown; error?: string }
  | { type: "done" };

export type JavaScriptRunner = (
  code: string,
  functionName: string,
  inputs: unknown[][],
) => Promise<BrowserRun>;

/** Runs the code against every test input in a Web Worker, stopped after 5 s. */
export const runJavaScript: JavaScriptRunner = (code, functionName, inputs) =>
  new Promise((resolve) => {
    const outputs: unknown[] = inputs.map(() => null);
    const errors: (string | null)[] = inputs.map(
      () => `Time limit (${TIME_LIMIT_MS / 1000} s)`,
    );
    const url = URL.createObjectURL(
      new Blob([WORKER], { type: "text/javascript" }),
    );
    const worker = new Worker(url);
    const finish = () => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ outputs, errors });
    };
    const timer = setTimeout(finish, TIME_LIMIT_MS);
    worker.onmessage = (event: MessageEvent<Message>) => {
      const message = event.data;
      if (message.type === "fatal") {
        errors.fill(message.error);
        finish();
      } else if (message.type === "result") {
        outputs[message.index] = message.output ?? null;
        errors[message.index] = message.error ?? null;
      } else {
        finish();
      }
    };
    worker.onerror = (event) => {
      event.preventDefault();
      errors.fill(event.message || "The code could not run.");
      finish();
    };
    worker.postMessage({ code, functionName, inputs });
  });
