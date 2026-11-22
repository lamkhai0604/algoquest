import { createElement, useState } from "react";
import { cx } from "../components";
import { useTranslation } from "../i18n";
import { languageName, useCodeLanguage } from "./codeLanguage";
import styles from "./Lesson.module.css";
import { LessonFigure } from "./LessonFigure";
import { parseFigure } from "./figure";
import { parseInline } from "./parseMarkdown";
import type { Block } from "./parseMarkdown";

export function InlineText({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((part, index) => {
        if (part.type === "bold") {
          return <strong key={index}>{part.text}</strong>;
        }
        if (part.type === "italic") return <em key={index}>{part.text}</em>;
        if (part.type === "code") {
          return (
            <code key={index} className={styles.inlineCode}>
              {part.text}
            </code>
          );
        }
        return <span key={index}>{part.text}</span>;
      })}
    </>
  );
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

function CopyButton({ code }: { code: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type="button" className={styles.copy} onClick={copy}>
      {copied ? t("common.copied") : t("common.copy")}
    </button>
  );
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  return (
    <figure className={styles.code}>
      <figcaption className={styles.codeHeader}>
        <span>{language ? languageName(language) : ""}</span>
        <CopyButton code={code} />
      </figcaption>
      <pre>
        <code>{code}</code>
      </pre>
    </figure>
  );
}

type CodeBlockData = Extract<Block, { type: "code" }>;

/**
 * The same code in several languages: one tab per language, one shown at a time. The choice is
 * shared across the page when a CodeLanguageContext is present.
 */
function CodeTabs({ blocks }: { blocks: CodeBlockData[] }) {
  const { t } = useTranslation();
  const shared = useCodeLanguage();
  const [local, setLocal] = useState(blocks[0]?.language ?? "");
  const wanted = shared?.language ?? local;
  const choose = shared?.setLanguage ?? setLocal;
  const shown = blocks.find((block) => block.language === wanted) ?? blocks[0];
  if (!shown) return null;
  return (
    <figure className={styles.code}>
      <figcaption className={styles.codeHeader}>
        <span
          role="tablist"
          aria-label={t("lesson.codeLanguage")}
          className={styles.langTabs}
        >
          {blocks.map((block) => (
            <button
              key={block.language}
              type="button"
              role="tab"
              aria-selected={block === shown}
              className={cx(
                styles.langTab,
                block === shown && styles.langTabOn,
              )}
              onClick={() => choose(block.language)}
            >
              {languageName(block.language)}
            </button>
          ))}
        </span>
        <CopyButton code={shown.code} />
      </figcaption>
      <pre role="tabpanel" aria-label={`${languageName(shown.language)} code`}>
        <code>{shown.code}</code>
      </pre>
    </figure>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "heading":
      // Lesson headings start one level below the page title.
      return createElement(
        `h${Math.min(block.level + 1, 6)}`,
        { className: styles.heading },
        <InlineText text={block.text} />,
      );
    case "paragraph":
      return (
        <p>
          <InlineText text={block.text} />
        </p>
      );
    case "list": {
      const items = block.items.map((item, index) => (
        <li key={index}>
          <InlineText text={item} />
        </li>
      ));
      return block.ordered ? <ol>{items}</ol> : <ul>{items}</ul>;
    }
    case "quote":
      return (
        <blockquote className={styles.quote}>
          <InlineText text={block.text} />
        </blockquote>
      );
    case "code": {
      const figure =
        block.language === "figure" ? parseFigure(block.code) : null;
      if (figure) return <LessonFigure figure={figure} />;
      return <CodeBlock code={block.code} language={block.language} />;
    }
    case "table":
      return (
        <div className={styles.tableWrap}>
          <table className={styles.stateTable}>
            <thead>
              <tr>
                {block.header.map((cell, index) => (
                  <th key={index} scope="col">
                    <InlineText text={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, index) => (
                    <td key={index}>
                      <InlineText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

type Piece = { block: Block } | { tabs: CodeBlockData[] };

/** Joins back-to-back code blocks in different languages into one switcher. */
function groupCode(blocks: Block[]): Piece[] {
  const pieces: Piece[] = [];
  for (const block of blocks) {
    const last = pieces[pieces.length - 1];
    if (
      block.type === "code" &&
      block.language &&
      block.language !== "figure"
    ) {
      if (
        last &&
        "tabs" in last &&
        !last.tabs.some((tab) => tab.language === block.language)
      ) {
        last.tabs.push(block);
      } else {
        pieces.push({ tabs: [block] });
      }
    } else {
      pieces.push({ block });
    }
  }
  return pieces;
}

export function MarkdownBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className={styles.prose}>
      {groupCode(blocks).map((piece, index) => {
        if ("block" in piece)
          return <BlockView key={index} block={piece.block} />;
        const [only] = piece.tabs;
        if (only && piece.tabs.length === 1) {
          return (
            <CodeBlock key={index} code={only.code} language={only.language} />
          );
        }
        return <CodeTabs key={index} blocks={piece.tabs} />;
      })}
    </div>
  );
}
