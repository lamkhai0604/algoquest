import { useRef } from "react";
import type { KeyboardEvent } from "react";
import styles from "./Code.module.css";
import { tokenize } from "./highlight";
import type { CodeLanguage } from "./types";

const INDENT = "  ";

interface CodeEditorProps {
  value: string;
  language: CodeLanguage;
  onChange: (value: string) => void;
  label: string;
}

/**
 * A small code editor without a library (D-046): line numbers, Tab and
 * Shift+Tab indentation, Enter keeps the indentation, and basic colouring.
 * The text area sits over a coloured copy of the code.
 */
export function CodeEditor({
  value,
  language,
  onChange,
  label,
}: CodeEditorProps) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const shadowRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const lines = value.split("\n").length;

  const replace = (start: number, end: number, text: string, caret: number) => {
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      areaRef.current?.setSelectionRange(caret, caret);
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const area = event.currentTarget;
    const { selectionStart: start, selectionEnd: end } = area;
    if (event.key === "Tab") {
      event.preventDefault();
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      if (event.shiftKey) {
        if (value.startsWith(INDENT, lineStart)) {
          replace(
            lineStart,
            lineStart + INDENT.length,
            "",
            Math.max(lineStart, start - INDENT.length),
          );
        }
      } else {
        replace(start, end, INDENT, start + INDENT.length);
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const indent = /^[ \t]*/.exec(value.slice(lineStart, start))?.[0] ?? "";
      const opens = /[{[(]\s*$/.test(value.slice(lineStart, start));
      const text = "\n" + indent + (opens ? INDENT : "");
      replace(start, end, text, start + text.length);
    }
  };

  const syncScroll = () => {
    const area = areaRef.current;
    if (!area) return;
    if (shadowRef.current) {
      shadowRef.current.scrollTop = area.scrollTop;
      shadowRef.current.scrollLeft = area.scrollLeft;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = area.scrollTop;
  };

  return (
    <div className={styles.editor}>
      <div className={styles.gutter} ref={gutterRef} aria-hidden="true">
        {Array.from({ length: lines }, (_, index) => (
          <span key={index}>{index + 1}</span>
        ))}
      </div>
      <div className={styles.surface}>
        <pre className={styles.shadow} ref={shadowRef} aria-hidden="true">
          {tokenize(value, language).map((token, index) =>
            token.kind === "plain" ? (
              token.text
            ) : (
              <span key={index} className={styles[token.kind]}>
                {token.text}
              </span>
            ),
          )}
          {"\n"}
        </pre>
        <textarea
          ref={areaRef}
          className={styles.area}
          aria-label={label}
          value={value}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          wrap="off"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          onScroll={syncScroll}
        />
      </div>
    </div>
  );
}
