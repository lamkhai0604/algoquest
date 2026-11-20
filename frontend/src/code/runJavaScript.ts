import type { BrowserRun } from "./types";

/** JavaScript stops after this long, for all tests together (D-035). */
export const TIME_LIMIT_MS = 5000;

/** The longest list a result may be before it counts as a cycle (D-058). */
export const MAX_LIST_LENGTH = 100_000;

/**
 * Linked-list helpers for the worker (D-058), kept as source text so a
 * minified build cannot rename what the player's code refers to. `ListNode`
 * is the node class the player's code uses; `toNodes` builds a chain from an
 * array (an empty array is null); `toValues` turns a returned chain back into
 * an array, leaves anything that is not a node as it is, and throws on a cycle
 * or a very long list.
 */
export const LIST_HELPERS = `
function ListNode(val, next) {
  this.val = val === undefined ? 0 : val;
  this.next = next === undefined ? null : next;
}
function toNodes(values) {
  if (!Array.isArray(values)) return values;
  let head = null;
  for (let i = values.length - 1; i >= 0; i--) head = new ListNode(values[i], head);
  return head;
}
function toValues(head) {
  if (head !== null && (typeof head !== "object" || !("val" in head))) return head;
  const values = [];
  for (let node = head; node !== null && node !== undefined; node = node.next) {
    if (values.length >= ${MAX_LIST_LENGTH}) throw new Error("The returned list has a cycle or is too long.");
    values.push(node.val);
  }
  return values;
}
`;

/**
 * The worker runs the player's code in its own thread with no access to the
 * page. It reports each test as it finishes, so a timeout keeps the earlier
 * results.
 */
const WORKER = `
${LIST_HELPERS}
self.onmessage = (event) => {
  const { code, functionName, inputs, listArguments, returnsList } = event.data;
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
      for (const position of listArguments || []) args[position] = toNodes(args[position]);
      let value = fn(...args);
      if (returnsList) value = toValues(value === undefined ? null : value);
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

/** Which arguments are linked lists, and whether the result is one (D-058). */
export interface ListShape {
  listArguments: number[];
  returnsList: boolean;
}

export type JavaScriptRunner = (
  code: string,
  functionName: string,
  inputs: unknown[][],
  lists?: ListShape,
) => Promise<BrowserRun>;

/** Runs the code against every test input in a Web Worker, stopped after 5 s. */
export const runJavaScript: JavaScriptRunner = (
  code,
  functionName,
  inputs,
  lists = { listArguments: [], returnsList: false },
) =>
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
    worker.postMessage({ code, functionName, inputs, ...lists });
  });
