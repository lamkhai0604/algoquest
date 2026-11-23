import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ApiError } from "../api";
import { Button, ConfirmDialog, ErrorState, LoadingState } from "../components";
import { useGame } from "../game/gameContext";
import { useTranslation } from "../i18n";
import styles from "./Notes.module.css";
import { NoteToolbar } from "./NoteToolbar";
import {
  createNote,
  deleteNote,
  getNote,
  sinceText,
  updateNote,
} from "./notesApi";
import type { Note, NoteInput } from "./notesApi";

/** How long the editor waits after the last change before it saves. */
export const SAVE_DELAY_MS = 1000;
const MAX_TAGS = 10;
const TAG = /^[\p{L}\p{N}][\p{L}\p{N} ._+#-]{0,29}$/u;
const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

type Load =
  | { status: "loading" }
  | { status: "error"; notFound: boolean }
  | { status: "ready"; note: Note | null };

/** Opens a note, or a blank one at /notes/new (D-074). */
export function NoteEditorPage() {
  const { t } = useTranslation();
  const { id = "new" } = useParams();
  const [params] = useSearchParams();
  const [loaded, setLoaded] = useState<{ id: string; load: Load } | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // A blank note, or one this page just created: its editor stays as it is.
  const blank = id === "new" || id === created;

  useEffect(() => {
    if (blank) return;
    let live = true;
    getNote(id)
      .then((note) => {
        if (live) setLoaded({ id, load: { status: "ready", note } });
      })
      .catch((error: unknown) => {
        if (!live) return;
        const missing =
          error instanceof ApiError &&
          (error.status === 404 || error.status === 400);
        setLoaded({ id, load: { status: "error", notFound: missing } });
      });
    return () => {
      live = false;
    };
  }, [id, blank, attempt]);

  const load: Load = blank
    ? { status: "ready", note: null }
    : loaded?.id === id
      ? loaded.load
      : { status: "loading" };
  const levelParam = Number(params.get("level"));
  return (
    <div className={styles.page}>
      <Link to="/notes" className={styles.back}>
        ← {t("notes.title")}
      </Link>
      {load.status === "loading" && <LoadingState label={t("notes.loading")} />}
      {load.status === "error" &&
        (load.notFound ? (
          <ErrorState title={t("notes.title")} message={t("notes.notFound")} />
        ) : (
          <ErrorState
            message={t("notes.loadError")}
            onRetry={() => {
              setLoaded(null);
              setAttempt((n) => n + 1);
            }}
          />
        ))}
      {load.status === "ready" && (
        <NoteEditor
          key={load.note?.id ?? "new"}
          note={load.note}
          startLevel={
            Number.isInteger(levelParam) && levelParam > 0 ? levelParam : null
          }
          onCreated={setCreated}
        />
      )}
    </div>
  );
}

type SaveState = "saved" | "dirty" | "saving" | "failed";

function NoteEditor({
  note,
  startLevel,
  onCreated,
}: {
  note: Note | null;
  startLevel: number | null;
  onCreated: (id: string) => void;
}) {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const { levels } = useGame();
  const [title, setTitle] = useState(note?.title ?? "");
  const [tags, setTags] = useState<string[]>(note?.tags ?? []);
  const [level, setLevel] = useState<number | null>(
    note ? note.level : startLevel,
  );
  const [tagDraft, setTagDraft] = useState("");
  const [tagError, setTagError] = useState(false);
  const [status, setStatus] = useState<SaveState>("saved");
  const [updatedAt, setUpdatedAt] = useState(note?.updatedAt ?? null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // The latest values, read by saves that a timer starts; kept in step by the handlers.
  const fields = useRef({ title, tags, level });
  const noteId = useRef(note?.id ?? null);
  const version = useRef(0);
  const savedVersion = useRef(0);
  const saving = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef<() => Promise<void>>(async () => undefined);

  const changed = () => {
    version.current += 1;
    setStatus("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void saveRef.current(), SAVE_DELAY_MS);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["mailto"],
          isAllowedUri: (url) => /^(https?:\/\/|mailto:)/i.test(url),
        },
      }),
    ],
    content: note?.body ?? EMPTY_DOC,
    editorProps: {
      attributes: {
        class: styles.prose ?? "",
        "aria-label": t("notes.body"),
        role: "textbox",
        "aria-multiline": "true",
      },
    },
    onUpdate: () => changed(),
  });

  const input = useCallback((): NoteInput | null => {
    if (!editor) return null;
    const bodyText = editor.getText({ blockSeparator: "\n" });
    const {
      title: rawTitle,
      tags: currentTags,
      level: currentLevel,
    } = fields.current;
    // A new note is not stored until it has something in it.
    if (!noteId.current && !rawTitle.trim() && !bodyText.trim()) return null;
    return {
      title: rawTitle.trim() || t("notes.untitled"),
      body: editor.getJSON(),
      bodyText,
      tags: currentTags,
      level: currentLevel,
    };
  }, [editor, t]);

  const save = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (saving.current) return;
    const data = input();
    if (!data) {
      setStatus("saved");
      return;
    }
    const at = version.current;
    saving.current = true;
    setStatus("saving");
    try {
      if (noteId.current) {
        const saved = await updateNote(noteId.current, data);
        setUpdatedAt(saved.updatedAt);
      } else {
        const saved = await createNote(data);
        noteId.current = saved.id;
        setUpdatedAt(saved.updatedAt);
        onCreated(saved.id);
        void navigate(`/notes/${saved.id}`, { replace: true });
      }
      savedVersion.current = at;
      saving.current = false;
      if (version.current !== at) {
        setStatus("dirty");
        timer.current = setTimeout(() => void saveRef.current(), SAVE_DELAY_MS);
      } else {
        setStatus("saved");
      }
    } catch {
      saving.current = false;
      setStatus("failed");
    }
  }, [input, navigate, onCreated]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  // Leaving the page saves what is left; closing the tab with changes asks first.
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (version.current !== savedVersion.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      if (timer.current) clearTimeout(timer.current);
      if (version.current !== savedVersion.current && !saving.current) {
        void saveRef.current();
      }
    };
  }, []);

  const changeTags = (next: string[]) => {
    setTags(next);
    fields.current.tags = next;
    changed();
  };

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (!tag) return;
    if (!TAG.test(tag) || (tags.length >= MAX_TAGS && !tags.includes(tag))) {
      setTagError(true);
      return;
    }
    setTagError(false);
    setTagDraft("");
    if (!tags.includes(tag)) {
      changeTags([...tags, tag]);
    }
  };

  const onTagKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(tagDraft);
    } else if (
      event.key === "Backspace" &&
      tagDraft === "" &&
      tags.length > 0
    ) {
      changeTags(tags.slice(0, -1));
    }
  };

  const remove = () => {
    if (!noteId.current) {
      void navigate("/notes");
      return;
    }
    setDeleting(true);
    deleteNote(noteId.current)
      .then(() => {
        version.current = savedVersion.current;
        void navigate("/notes");
      })
      .catch(() => {
        setDeleting(false);
        setConfirming(false);
        setStatus("failed");
      });
  };

  const levelOptions = levels.status === "ready" ? levels.data : [];

  return (
    <>
      <p className={styles.status} role="status">
        {status === "saved" && updatedAt && (
          <span className={styles.saved}>✓ {t("notes.saved")}</span>
        )}
        {status === "saving" && t("notes.saving")}
        {status === "failed" && (
          <span className={styles.failed}>
            {t("notes.unsaved")}{" "}
            <Button size="sm" variant="secondary" onClick={() => void save()}>
              {t("common.retry")}
            </Button>
          </span>
        )}
      </p>
      <section className={styles.editor}>
        <input
          className={styles.titleInput}
          aria-label={t("notes.titleLabel")}
          placeholder={t("notes.untitled")}
          maxLength={200}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            fields.current.title = event.target.value;
            changed();
          }}
        />
        <div className={styles.fields}>
          <label className={styles.field}>
            <span>{t("notes.level")}</span>
            <select
              value={level ?? ""}
              onChange={(event) => {
                const next = event.target.value
                  ? Number(event.target.value)
                  : null;
                setLevel(next);
                fields.current.level = next;
                changed();
              }}
            >
              <option value="">{t("notes.noLevel")}</option>
              {levelOptions.map((option) => (
                <option key={option.number} value={option.number}>
                  {option.number} · {option.title}
                </option>
              ))}
              {level !== null &&
                !levelOptions.some((o) => o.number === level) && (
                  <option value={level}>{level}</option>
                )}
            </select>
          </label>
          <div className={styles.field}>
            <span id="note-tags">{t("notes.tags")}</span>
            <span
              className={styles.tagEditor}
              role="group"
              aria-labelledby="note-tags"
            >
              {tags.map((tag) => (
                <span key={tag} className={styles.tagSmall}>
                  {tag}
                  <button
                    type="button"
                    className={styles.tagRemove}
                    aria-label={`${t("notes.removeTag")} ${tag}`}
                    onClick={() =>
                      changeTags(tags.filter((other) => other !== tag))
                    }
                  >
                    ✕
                  </button>
                </span>
              ))}
              <input
                className={styles.tagInput}
                aria-label={t("notes.addTag")}
                placeholder={
                  tags.length < MAX_TAGS ? `+ ${t("notes.addTag")}` : ""
                }
                value={tagDraft}
                aria-invalid={tagError}
                onChange={(event) => {
                  setTagError(false);
                  setTagDraft(event.target.value);
                }}
                onKeyDown={onTagKey}
                onBlur={() => addTag(tagDraft)}
              />
            </span>
          </div>
        </div>
        {tagError && (
          <p className={styles.problem} role="alert">
            {t("notes.tagRule")}
          </p>
        )}
        {editor && <NoteToolbar editor={editor} />}
        <EditorContent editor={editor} className={styles.body} />
        <div className={styles.foot}>
          <span>
            {updatedAt
              ? `${t("notes.lastChange")} ${sinceText(updatedAt, locale)}`
              : ""}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
            <span className={styles.danger}>{t("notes.delete")}</span>
          </Button>
        </div>
      </section>
      {confirming && (
        <ConfirmDialog
          title={t("notes.deleteTitle")}
          confirmLabel={t("notes.delete")}
          cancelLabel={t("notes.cancel")}
          onConfirm={remove}
          onCancel={() => setConfirming(false)}
          busy={deleting}
        >
          {t("notes.deleteBody")}
        </ConfirmDialog>
      )}
    </>
  );
}
