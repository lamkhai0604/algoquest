import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import type { ReactNode } from "react";
import { cx } from "../components";
import { useTranslation } from "../i18n";
import type { TranslationKey } from "../i18n";
import styles from "./Notes.module.css";

/** The formatting buttons above the note editor (D-074). */
export function NoteToolbar({ editor }: { editor: Editor }) {
  const { t } = useTranslation();
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      large: e.isActive("heading", { level: 2 }),
      small: e.isActive("heading", { level: 3 }),
      normal: e.isActive("paragraph"),
      bullets: e.isActive("bulletList"),
      numbers: e.isActive("orderedList"),
      code: e.isActive("codeBlock"),
      link: e.isActive("link"),
    }),
  });

  const run = () => editor.chain().focus();
  const toggleLink = () => {
    if (state.link) {
      run().extendMarkRange("link").unsetLink().run();
      return;
    }
    const answer = window.prompt(t("notes.linkPrompt"), "https://");
    if (!answer || answer.trim() === "https://") return;
    const href = /^(https?:\/\/|mailto:)/i.test(answer.trim())
      ? answer.trim()
      : `https://${answer.trim()}`;
    run().extendMarkRange("link").setLink({ href }).run();
  };

  const tool = (
    key: TranslationKey,
    active: boolean,
    action: () => void,
    face: ReactNode,
  ) => (
    <button
      type="button"
      className={cx(styles.tool, active && styles.toolOn)}
      aria-pressed={active}
      aria-label={t(key)}
      title={t(key)}
      onMouseDown={(event) => event.preventDefault()}
      onClick={action}
    >
      {face}
    </button>
  );

  return (
    <div
      className={styles.toolbar}
      role="toolbar"
      aria-label={t("notes.toolbar")}
    >
      {tool("notes.bold", state.bold, () => run().toggleBold().run(), <b>B</b>)}
      {tool(
        "notes.italic",
        state.italic,
        () => run().toggleItalic().run(),
        <i>I</i>,
      )}
      {tool(
        "notes.underline",
        state.underline,
        () => run().toggleUnderline().run(),
        <u>U</u>,
      )}
      <span className={styles.sep} aria-hidden="true" />
      {tool(
        "notes.large",
        state.large,
        () => run().toggleHeading({ level: 2 }).run(),
        t("notes.large"),
      )}
      {tool(
        "notes.small",
        state.small,
        () => run().toggleHeading({ level: 3 }).run(),
        t("notes.small"),
      )}
      {tool(
        "notes.normal",
        state.normal && !state.large && !state.small,
        () => run().setParagraph().run(),
        t("notes.normal"),
      )}
      <span className={styles.sep} aria-hidden="true" />
      {tool(
        "notes.bullets",
        state.bullets,
        () => run().toggleBulletList().run(),
        "•",
      )}
      {tool(
        "notes.numbers",
        state.numbers,
        () => run().toggleOrderedList().run(),
        "1.",
      )}
      <span className={styles.sep} aria-hidden="true" />
      {tool(
        "notes.code",
        state.code,
        () => run().toggleCodeBlock().run(),
        "</>",
      )}
      {tool("notes.link", state.link, toggleLink, "🔗")}
    </div>
  );
}
