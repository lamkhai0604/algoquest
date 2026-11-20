import { describe, expect, it } from "vitest";
import { LIST_HELPERS, MAX_LIST_LENGTH, TREE_HELPERS } from "./runJavaScript";

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
    expect(
      helpers.toValues(new helpers.ListNode(4, new helpers.ListNode(5))),
    ).toEqual([4, 5]);
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

interface Tree {
  val: number;
  left: Tree | null;
  right: Tree | null;
}

const trees = new Function(
  `${TREE_HELPERS}\nreturn { TreeNode, toTree, fromTree };`,
)() as {
  TreeNode: new (val?: number, left?: Tree | null, right?: Tree | null) => Tree;
  toTree: (values: unknown) => Tree | null;
  fromTree: (root: unknown) => unknown;
};

describe("binary-tree helpers (D-059)", () => {
  it("builds a tree from level order and reads it back", () => {
    const root = trees.toTree([3, 9, 20, null, null, 15, 7]);
    expect(root?.val).toBe(3);
    expect(root?.left?.left).toBeNull();
    expect(root?.right?.left?.val).toBe(15);
    expect(trees.fromTree(root)).toEqual([3, 9, 20, null, null, 15, 7]);
  });

  it("treats an empty array as null and drops trailing nulls", () => {
    expect(trees.toTree([])).toBeNull();
    expect(trees.fromTree(null)).toEqual([]);
    expect(
      trees.fromTree(new trees.TreeNode(1, null, new trees.TreeNode(2))),
    ).toEqual([1, null, 2]);
  });

  it("leaves results that are not trees as they are, and stops at a cycle", () => {
    expect(trees.fromTree([1, 2])).toEqual([1, 2]);
    const root = trees.toTree([1, 2]);
    root!.left!.left = root;
    expect(() => trees.fromTree(root)).toThrow(/cycle/);
  });
});
