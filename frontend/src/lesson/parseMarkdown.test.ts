import { describe, expect, it } from "vitest";
import { parseInline, parseMarkdown } from "./parseMarkdown";

describe("parseMarkdown", () => {
  it("reads headings, paragraphs, lists, quotes, and code", () => {
    const blocks = parseMarkdown(
      [
        "# Title",
        "",
        "## Section",
        "First line",
        "second line.",
        "",
        "- one",
        "- two",
        "",
        "1. first",
        "2. second",
        "",
        "> quoted",
        "> text",
        "",
        "```javascript",
        "const a = 1;",
        "",
        "# not a heading",
        "```",
      ].join("\n"),
    );

    expect(blocks).toEqual([
      { type: "heading", level: 1, text: "Title" },
      { type: "heading", level: 2, text: "Section" },
      { type: "paragraph", text: "First line second line." },
      { type: "list", ordered: false, items: ["one", "two"] },
      { type: "list", ordered: true, items: ["first", "second"] },
      { type: "quote", text: "quoted text" },
      {
        type: "code",
        language: "javascript",
        code: "const a = 1;\n\n# not a heading",
      },
    ]);
  });

  it("keeps HTML as plain text", () => {
    expect(parseMarkdown("<script>alert(1)</script>")).toEqual([
      { type: "paragraph", text: "<script>alert(1)</script>" },
    ]);
  });
});

describe("parseInline", () => {
  it("reads bold, italic, and code", () => {
    expect(parseInline("Use **one** pass, *not* two: `O(n)`.")).toEqual([
      { type: "text", text: "Use " },
      { type: "bold", text: "one" },
      { type: "text", text: " pass, " },
      { type: "italic", text: "not" },
      { type: "text", text: " two: " },
      { type: "code", text: "O(n)" },
      { type: "text", text: "." },
    ]);
  });

  it("leaves a lone star alone", () => {
    expect(parseInline("3 * 4 = 12")).toEqual([
      { type: "text", text: "3 * 4 = 12" },
    ]);
  });
});
