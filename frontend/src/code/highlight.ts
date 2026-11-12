import type { CodeLanguage } from "./types";

export type TokenKind = "keyword" | "string" | "number" | "comment" | "plain";

export interface Token {
  kind: TokenKind;
  text: string;
}

const KEYWORDS: Record<CodeLanguage, Set<string>> = {
  javascript: new Set(
    "break case catch class const continue default do else false for function if in let new null of return switch this throw true try typeof undefined var while".split(
      " ",
    ),
  ),
  java: new Set(
    "boolean break case catch char class continue default do double else false final for if import int long new null private public return short static String switch this throw true try void while Integer Long Map HashMap Set HashSet List ArrayList Arrays".split(
      " ",
    ),
  ),
};

const PATTERN =
  /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|("(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?|`(?:[^`\\]|\\.)*`?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g;

/** Splits code into tokens for basic colouring (D-046). */
export function tokenize(code: string, language: CodeLanguage): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const match of code.matchAll(PATTERN)) {
    const start = match.index;
    if (start > last)
      tokens.push({ kind: "plain", text: code.slice(last, start) });
    const [text, comment, string, number, word] = match;
    let kind: TokenKind = "plain";
    if (comment) kind = "comment";
    else if (string) kind = "string";
    else if (number) kind = "number";
    else if (word && KEYWORDS[language].has(word)) kind = "keyword";
    tokens.push({ kind, text });
    last = start + text.length;
  }
  if (last < code.length)
    tokens.push({ kind: "plain", text: code.slice(last) });
  return tokens;
}
