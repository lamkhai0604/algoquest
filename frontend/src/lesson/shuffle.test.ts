import { describe, expect, it } from "vitest";
import { shuffledOrder } from "./shuffle";

describe("shuffledOrder", () => {
  it("returns every index exactly once", () => {
    for (let run = 0; run < 50; run++) {
      const order = shuffledOrder(4);
      expect([...order].sort()).toEqual([0, 1, 2, 3]);
    }
  });

  it("can move the first option to any place", () => {
    const places = new Set<number>();
    for (let run = 0; run < 200; run++) {
      places.add(shuffledOrder(4).indexOf(0));
    }
    expect(places).toEqual(new Set([0, 1, 2, 3]));
  });

  it("follows the random source", () => {
    expect(shuffledOrder(3, () => 0)).toEqual([1, 2, 0]);
    expect(shuffledOrder(3, () => 0.999)).toEqual([0, 1, 2]);
    expect(shuffledOrder(0)).toEqual([]);
    expect(shuffledOrder(1)).toEqual([0]);
  });
});
