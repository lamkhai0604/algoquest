import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Button, cx, ErrorState, LoadingState } from "../components";
import { useTranslation } from "../i18n";
import { NoteEditor } from "./NoteEditorPage";
import styles from "./Notes.module.css";
import { getNote, listNotes, sinceText } from "./notesApi";
import type { Note, NoteSummary } from "./notesApi";

type View =
  | { kind: "list" }
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "edit"; note: Note | null };

/**
 * Quick notes on the lesson page (D-076): a small button by the title opens a panel at the side
 * (at the bottom on a phone) with the notes of this level and the editor, so a learner writes an
 * idea down without leaving the lesson. When the title scrolls away, the button floats in the
 * corner. N opens and closes the panel.
 */
export function QuickNotes({ level }: { level: number }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [floating, setFloating] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);

  // The button by the title floats in the corner once the title is out of view.
  useEffect(() => {
    const node = anchor.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) =>
      setFloating(entry ? !entry.isIntersecting : false),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key === "Escape" && open) {
        setOpen(false);
        return;
      }
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const button = (className: string, ref?: typeof anchor) => (
    <button
      ref={ref}
      type="button"
      className={className}
      aria-label={t("notes.quickOpenLabel")}
      aria-expanded={open}
      aria-controls="quick-notes"
      onClick={() => setOpen((o) => !o)}
    >
      <span aria-hidden="true">✎</span> {t("notes.quickOpen")}
    </button>
  );

  return (
    <>
      {button(styles.quickButton ?? "", anchor)}
      {floating && !open && button(styles.quickFloat ?? "")}
      {open && <QuickPanel level={level} onClose={() => setOpen(false)} />}
    </>
  );
}

function QuickPanel({
  level,
  onClose,
}: {
  level: number;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [view, setView] = useState<View>({ kind: "list" });
  const [editorKey, setEditorKey] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  const openNote = (id: string) => {
    setView({ kind: "loading" });
    getNote(id)
      .then((note) => setView({ kind: "edit", note }))
      .catch(() => setView({ kind: "error" }));
  };

  const startNew = () => {
    setEditorKey((k) => k + 1);
    setView({ kind: "edit", note: null });
  };

  return (
    <aside
      id="quick-notes"
      className={styles.drawer}
      aria-labelledby="quick-notes-heading"
    >
      <div className={styles.drawerHead}>
        <h2
          id="quick-notes-heading"
          ref={heading}
          tabIndex={-1}
          className={styles.drawerTitle}
        >
          {t("notes.quickTitle")} {level}
        </h2>
        <button
          type="button"
          className={styles.drawerClose}
          aria-label={t("notes.quickClose")}
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <div className={styles.drawerBody}>
        {view.kind !== "list" && (
          <button
            type="button"
            className={styles.drawerBack}
            onClick={() => setView({ kind: "list" })}
          >
            ← {t("notes.quickBack")}
          </button>
        )}
        {view.kind === "list" && (
          <QuickList level={level} onOpen={openNote} onNew={startNew} />
        )}
        {view.kind === "loading" && <LoadingState label={t("notes.loading")} />}
        {view.kind === "error" && <ErrorState message={t("notes.loadError")} />}
        {view.kind === "edit" && (
          <NoteEditor
            key={view.note?.id ?? `new-${editorKey}`}
            note={view.note}
            startLevel={level}
            onCreated={() => undefined}
            compact
          />
        )}
      </div>
      <p className={styles.drawerFoot}>{t("notes.quickKeys")}</p>
    </aside>
  );
}

function QuickList({
  level,
  onOpen,
  onNew,
}: {
  level: number;
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  const { t, locale } = useTranslation();
  const [notes, setNotes] = useState<NoteSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    listNotes({ level })
      .then((found) => {
        if (live) setNotes(found);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [level, attempt]);

  const retry = useCallback(() => {
    setFailed(false);
    setAttempt((n) => n + 1);
  }, []);

  return (
    <div className={styles.levelNotes}>
      <div>
        <Button size="sm" onClick={onNew}>
          + {t("notes.levelNew")}
        </Button>
      </div>
      {failed && <ErrorState message={t("notes.loadError")} onRetry={retry} />}
      {!failed && notes === null && <LoadingState label={t("notes.loading")} />}
      {notes !== null && notes.length === 0 && (
        <p className={styles.lead}>{t("notes.levelEmpty")}</p>
      )}
      {notes !== null && notes.length > 0 && (
        <ul className={styles.levelNotesList}>
          {notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                className={cx(styles.levelNote, styles.levelNoteButton)}
                onClick={() => onOpen(note.id)}
              >
                <span>{note.title}</span>
                <span className={styles.meta}>
                  {sinceText(note.updatedAt, locale)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Link to="/notes" className={styles.drawerLink}>
        {t("notes.quickFullPage")} →
      </Link>
    </div>
  );
}
