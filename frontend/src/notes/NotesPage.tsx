import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../api";
import { Button, ButtonLink, ErrorState, LoadingState, cx } from "../components";
import { useTranslation } from "../i18n";
import styles from "./Notes.module.css";
import { downloadAllNotes, listNotes, sinceText } from "./notesApi";
import type { NoteSummary } from "./notesApi";

type Load =
  | { status: "loading" }
  | { status: "error"; forbidden: boolean }
  | { status: "ready"; notes: NoteSummary[] };

/** The Owner's notes (D-074): search, filter by tag, open, start a new one. */
export function NotesPage() {
  const { t, locale } = useTranslation();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [allTags, setAllTags] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);

  // Search waits until typing pauses.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    listNotes({ q: search, tag: tag ?? undefined })
      .then((notes) => {
        if (!live) return;
        setLoad({ status: "ready", notes });
        if (!search.trim() && !tag) {
          setTotal(notes.length);
          setAllTags([...new Set(notes.flatMap((note) => note.tags))].sort());
        }
      })
      .catch((error: unknown) => {
        if (!live) return;
        setLoad({
          status: "error",
          forbidden: error instanceof ApiError && error.status === 403,
        });
      });
    return () => {
      live = false;
    };
  }, [search, tag, attempt]);

  const retry = () => {
    setLoad({ status: "loading" });
    setAttempt((n) => n + 1);
  };

  const download = () => {
    setDownloading(true);
    setDownloadFailed(false);
    downloadAllNotes()
      .catch(() => setDownloadFailed(true))
      .finally(() => setDownloading(false));
  };

  const filtered = search.trim() !== "" || tag !== null;
  const notes = load.status === "ready" ? load.notes : [];
  const tagChips = useMemo(
    () => (tag && !allTags.includes(tag) ? [...allTags, tag] : allTags),
    [allTags, tag],
  );

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.heading}>{t("notes.title")}</h1>
          <p className={styles.lead}>{t("notes.lead")}</p>
        </div>
        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={download}
            disabled={downloading || total === 0}
          >
            ⤓ {t("notes.downloadAll")}
          </Button>
          <ButtonLink to="/notes/new">+ {t("notes.new")}</ButtonLink>
        </div>
      </div>
      {downloadFailed && (
        <p className={styles.problem} role="alert">
          {t("notes.downloadFailed")}
        </p>
      )}

      <input
        type="search"
        className={styles.search}
        placeholder={t("notes.search")}
        aria-label={t("notes.search")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {tagChips.length > 0 && (
        <div className={styles.tags} role="group" aria-label={t("notes.tags")}>
          <button
            type="button"
            className={cx(styles.tag, tag === null && styles.tagOn)}
            aria-pressed={tag === null}
            onClick={() => setTag(null)}
          >
            {t("notes.allTags")} · {total}
          </button>
          {tagChips.map((name) => (
            <button
              type="button"
              key={name}
              className={cx(styles.tag, tag === name && styles.tagOn)}
              aria-pressed={tag === name}
              onClick={() => setTag(tag === name ? null : name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {load.status === "loading" && <LoadingState label={t("notes.loading")} />}
      {load.status === "error" &&
        (load.forbidden ? (
          <ErrorState title={t("notes.title")} message={t("notes.forbidden")} />
        ) : (
          <ErrorState message={t("notes.loadError")} onRetry={retry} />
        ))}
      {load.status === "ready" && notes.length === 0 && (
        <p className={styles.empty}>
          {filtered ? t("notes.noMatch") : t("notes.empty")}
        </p>
      )}
      {notes.length > 0 && (
        <ul className={styles.grid}>
          {notes.map((note) => (
            <li key={note.id}>
              <Link to={`/notes/${note.id}`} className={styles.card}>
                <h2 className={styles.cardTitle}>{note.title}</h2>
                {note.snippet && <p className={styles.snippet}>{note.snippet}</p>}
                {note.tags.length > 0 && (
                  <span className={styles.cardTags}>
                    {note.tags.map((name) => (
                      <span key={name} className={styles.tagSmall}>
                        {name}
                      </span>
                    ))}
                  </span>
                )}
                <span className={styles.meta}>
                  <span className={styles.level}>
                    {note.level !== null ? `${t("notes.level")} ${note.level}` : ""}
                  </span>
                  <span>{sinceText(note.updatedAt, locale)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
