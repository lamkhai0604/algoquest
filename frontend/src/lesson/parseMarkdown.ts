/**
 * A small Markdown reader for lesson text. It supports the subset lessons
 * use: headings, paragraphs, "-" lists, "1." lists, ">" quotes, fenced code,
 * pipe tables, and inline bold, italic, and code. Output is data, never HTML strings.
 */
export type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; text: string }
  | { type: "code"; language: string; code: string }
  | { type: "table"; header: string[]; rows: string[][] };

export type Inline =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "code"; text: string };

const BULLET = /^- (.*)$/;
const NUMBERED = /^\d+\. (.*)$/;
const HEADING = /^(#{1,4}) (.*)$/;
const TABLE_ROW = /^\|.*\|\s*$/;
const TABLE_RULE = /^\|(\s*:?-+:?\s*\|)+\s*$/;

function cellsOf(row: string): string[] {
  return row
    .trim()
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

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
    } else if (TABLE_ROW.test(current) && TABLE_RULE.test(lines[i + 1] ?? "")) {
      const header = cellsOf(current);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && TABLE_ROW.test(line())) {
        rows.push(cellsOf(line()));
        i++;
      }
      blocks.push({ type: "table", header, rows });
    } else if (current.startsWith(">")) {
      const text: string[] = [];
      while (i < lines.length && line().startsWith(">")) {
        text.push(line().replace(/^> ?/, ""));
        i++;
      }
      blocks.push({ type: "quote", text: text.join(" ") });
    } else {
      // The first line always belongs to the paragraph, so a line that only looks like
      // the start of another block (a lone table row) cannot stall the reader.
      const text: string[] = [current.trim()];
      i++;
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
    !TABLE_ROW.test(text) &&
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
