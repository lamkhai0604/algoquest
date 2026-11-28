import { describe, expect, it } from "vitest";
import { hasLevelTest, levelLabel, levelShort } from "./levelLabel";

describe("level labels", () => {
  it("keeps algorithm level numbers", () => {
    expect(levelLabel(1)).toBe("Level 1");
    expect(levelLabel(27)).toBe("Level 27");
    expect(levelShort(27)).toBe("27");
  });

  it("counts System Design levels from 1", () => {
    expect(levelLabel(28)).toBe("SD 1");
    expect(levelLabel(29)).toBe("SD 2");
    expect(levelShort(53)).toBe("SD 26");
  });
});

describe("hasLevelTest", () => {
  it("is true for algorithm levels and false for System Design levels", () => {
    expect(hasLevelTest(1)).toBe(true);
    expect(hasLevelTest(27)).toBe(true);
    expect(hasLevelTest(28)).toBe(false);
    expect(hasLevelTest(46)).toBe(false);
  });
});
