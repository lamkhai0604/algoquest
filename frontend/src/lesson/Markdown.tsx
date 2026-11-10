import { createElement } from "react";
import styles from "./Lesson.module.css";
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

export function CodeBlock({ code, language }: CodeBlockProps) {
  return (
    <figure className={styles.code}>
      {language && <figcaption>{language}</figcaption>}
      <pre>
        <code>{code}</code>
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
    case "code":
      return <CodeBlock code={block.code} language={block.language} />;
  }
}

export function MarkdownBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className={styles.prose}>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </div>
  );
}
