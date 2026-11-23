import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ButtonLink, Card } from "../components";
import { useTranslation } from "../i18n";
import styles from "./Notes.module.css";
import { listNotes, sinceText } from "./notesApi";
import type { NoteSummary } from "./notesApi";

/** The notes linked to a level, on the level page (D-074). */
export function LevelNotes({ level }: { level: number }) {
  const { t, locale } = useTranslation();
  const [notes, setNotes] = useState<NoteSummary[] | null>(null);

  useEffect(() => {
    let live = true;
    listNotes({ level })
      .then((found) => live && setNotes(found))
      .catch(() => live && setNotes([]));
    return () => {
      live = false;
    };
  }, [level]);

  return (
    <Card heading={t("notes.levelNotes")}>
      <div className={styles.levelNotes}>
        {notes !== null && notes.length === 0 && (
          <p className={styles.lead}>{t("notes.levelEmpty")}</p>
        )}
        {notes !== null && notes.length > 0 && (
          <ul className={styles.levelNotesList}>
            {notes.map((note) => (
              <li key={note.id}>
                <Link to={`/notes/${note.id}`} className={styles.levelNote}>
                  <span>{note.title}</span>
                  <span className={styles.meta}>
                    {sinceText(note.updatedAt, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div>
          <ButtonLink
            to={`/notes/new?level=${level}`}
            variant="secondary"
            size="sm"
          >
            + {t("notes.levelNew")}
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}
