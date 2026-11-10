/**
 * A small Markdown reader for lesson text. It supports the subset lessons
 * use: headings, paragraphs, "-" lists, "1." lists, ">" quotes, fenced code,
 * and inline bold, italic, and code. Output is data, never HTML strings.
 */
export type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; text: string }
  | { type: "code"; language: string; code: string };

export type Inline =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "code"; text: string };

const BULLET = /^- (.*)$/;
const NUMBERED = /^\d+\. (.*)$/;
const HEADING = /^(#{1,4}) (.*)$/;

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  const line = () => lines[i] ?? "";

  while (i < lines.length) {
    const current = line();
    if (current.trim() === "") {
      i++;
    } else if (current.startsWith("```")) {
      const language = current.slice(3).trim();
      const code: string[] = [];
      i++;
      while (i < lines.length && !line().startsWith("```")) {
        code.push(line());
        i++;
      }
      i++; // closing fence
      blocks.push({ type: "code", language, code: code.join("\n") });
    } else if (HEADING.test(current)) {
      const match = HEADING.exec(current);
      const level = match?.[1]?.length ?? 1;
      blocks.push({ type: "heading", level, text: match?.[2] ?? "" });
      i++;
    } else if (BULLET.test(current) || NUMBERED.test(current)) {
      const pattern = BULLET.test(current) ? BULLET : NUMBERED;
      const items: string[] = [];
      while (i < lines.length && pattern.test(line())) {
        items.push(pattern.exec(line())?.[1] ?? "");
        i++;
      }
      blocks.push({ type: "list", ordered: pattern === NUMBERED, items });
    } else if (current.startsWith(">")) {
      const text: string[] = [];
      while (i < lines.length && line().startsWith(">")) {
        text.push(line().replace(/^> ?/, ""));
        i++;
      }
      blocks.push({ type: "quote", text: text.join(" ") });
    } else {
      const text: string[] = [];
      while (i < lines.length && isParagraphLine(line())) {
        text.push(line().trim());
        i++;
      }
      blocks.push({ type: "paragraph", text: text.join(" ") });
    }
  }
  return blocks;
}

function isParagraphLine(text: string): boolean {
  return (
    text.trim() !== "" &&
    !text.startsWith("```") &&
    !text.startsWith(">") &&
    !HEADING.test(text) &&
    !BULLET.test(text) &&
    !NUMBERED.test(text)
  );
}

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;

function wrappedIn(piece: string, mark: string): boolean {
  return (
    piece.length > 2 * mark.length &&
    piece.startsWith(mark) &&
    piece.endsWith(mark)
  );
}

export function parseInline(text: string): Inline[] {
  const parts: Inline[] = [];
  for (const piece of text.split(INLINE)) {
    if (piece === "") continue;
    if (wrappedIn(piece, "**")) {
      parts.push({ type: "bold", text: piece.slice(2, -2) });
    } else if (wrappedIn(piece, "`")) {
      parts.push({ type: "code", text: piece.slice(1, -1) });
    } else if (wrappedIn(piece, "*")) {
      parts.push({ type: "italic", text: piece.slice(1, -1) });
    } else {
      parts.push({ type: "text", text: piece });
    }
  }
  return parts;
}
