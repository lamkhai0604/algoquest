import { describe, expect, it } from "vitest";
import { LIST_HELPERS, MAX_LIST_LENGTH } from "./runJavaScript";

interface Node {
  val: number;
  next: Node | null;
}

/** The worker's list helpers, loaded the way the worker loads them. */
const helpers = new Function(
  `${LIST_HELPERS}\nreturn { ListNode, toNodes, toValues };`,
)() as {
  ListNode: new (val?: number, next?: Node | null) => Node;
  toNodes: (values: unknown) => Node | null;
  toValues: (head: unknown) => unknown;
};

describe("linked-list helpers (D-058)", () => {
  it("builds a chain from values and reads it back", () => {
    const head = helpers.toNodes([1, 2, 3]);
    expect(head?.val).toBe(1);
    expect(head?.next?.next?.val).toBe(3);
    expect(head?.next?.next?.next).toBeNull();
    expect(helpers.toValues(head)).toEqual([1, 2, 3]);
  });

  it("treats an empty list as null and null as an empty list", () => {
    expect(helpers.toNodes([])).toBeNull();
    expect(helpers.toValues(null)).toEqual([]);
  });

  it("gives the player's code a ListNode with default values", () => {
    const node = new helpers.ListNode();
    expect(node).toEqual({ val: 0, next: null });
    expect(helpers.toValues(new helpers.ListNode(4, new helpers.ListNode(5)))).toEqual([4, 5]);
  });

  it("leaves results that are not lists as they are", () => {
    expect(helpers.toValues([7, 8])).toEqual([7, 8]);
    expect(helpers.toValues(3)).toBe(3);
  });

  it("stops at a cycle instead of running forever", () => {
    const head = helpers.toNodes([1, 2]);
    head!.next!.next = head;
    expect(() => helpers.toValues(head)).toThrow(/cycle/);
    expect(MAX_LIST_LENGTH).toBe(100_000);
  });
});
