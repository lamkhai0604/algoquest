import { useEffect, useState } from "react";
import { useTranslation } from "../i18n";
import { cx } from "../components";
import styles from "./Lesson.module.css";
import { InlineText } from "./Markdown";
import { StillVisual } from "./Walkthrough";
import { FIGURE_FRAME_MS } from "./figure";
import type { Figure, FigureFrame } from "./figure";

function StackFrame({ frame }: { frame: FigureFrame }) {
  const { t } = useTranslation();
  const items = frame.items ?? [];
  return (
    <div className={styles.figPile}>
      {frame.out && (
        <span className={cx(styles.figPlate, styles.figLeaving)}>
          {frame.out} ↑
        </span>
      )}
      <ol className={styles.figPileItems} aria-label={t("walkthrough.stack")}>
        {items.length === 0 && (
          <li className={styles.figEmpty}>{t("walkthrough.empty")}</li>
        )}
        {[...items].reverse().map((item, i) => (
          <li
            key={`${i}-${item}`}
            className={cx(styles.figPlate, i === 0 && styles.figTop)}
          >
            {item}
            {i === 0 && (
              <span className={styles.figTag}>{t("walkthrough.figTop")}</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function QueueFrame({ frame }: { frame: FigureFrame }) {
  const { t } = useTranslation();
  const items = frame.items ?? [];
  return (
    <div className={styles.figLine}>
      {frame.out && (
        <span className={cx(styles.figPlate, styles.figLeaving)}>
          ← {frame.out}
        </span>
      )}
      <span className={styles.figDoor}>{t("walkthrough.figFront")}</span>
      <ol className={styles.figLineItems} aria-label={t("walkthrough.queue")}>
        {items.length === 0 && (
          <li className={styles.figEmpty}>{t("walkthrough.empty")}</li>
        )}
        {items.map((item, i) => (
          <li
            key={`${i}-${item}`}
            className={cx(styles.figPlate, i === 0 && styles.figTop)}
          >
            {item}
          </li>
        ))}
      </ol>
      <span className={styles.figDoor}>{t("walkthrough.figBack")}</span>
    </div>
  );
}

function Caption({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <figcaption className={styles.figCaption}>
      <InlineText text={text} />
    </figcaption>
  );
}

/**
 * A picture inside a lesson (D-072): a row of frames that shows a data
 * structure changing one operation at a time, or a decorative image. Play
 * lights the frames one by one and loops until Stop.
 */
export function LessonFigure({ figure }: { figure: Figure }) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const [lit, setLit] = useState(0);
  const frames = figure.frames ?? [];

  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const timer = setInterval(
      () => setLit((at) => (at + 1) % frames.length),
      FIGURE_FRAME_MS,
    );
    return () => clearInterval(timer);
  }, [playing, frames.length]);

  if (figure.kind === "image") {
    return (
      <figure className={styles.figure}>
        <img
          className={styles.figImage}
          src={figure.src}
          alt={figure.alt ?? ""}
          loading="lazy"
        />
        <Caption text={figure.caption} />
      </figure>
    );
  }

  const toggle = () => {
    if (!playing) setLit(0);
    setPlaying(!playing);
  };

  return (
    <figure
      className={cx(styles.figure, playing && styles.figPlaying)}
      aria-label={t("walkthrough.figure")}
    >
      <div className={styles.figBar}>
        <button
          type="button"
          className={styles.figPlay}
          aria-pressed={playing}
          onClick={toggle}
        >
          {playing
            ? `■ ${t("walkthrough.figStop")}`
            : `▶ ${t("walkthrough.figPlay")}`}
        </button>
      </div>
      <ol
        className={cx(
          styles.figFrames,
          figure.kind === "visual" && styles.figFramesWide,
          frames.some((frame) => frame.visual?.next) && styles.figFramesRow,
        )}
      >
        {frames.map((frame, i) => (
          <li
            key={i}
            className={cx(
              styles.figFrame,
              playing && i === lit && styles.figLit,
            )}
            aria-current={playing && i === lit ? "step" : undefined}
          >
            <span className={styles.figStep}>
              <span aria-hidden="true">{i + 1}</span>
              <span className="sr-only">
                {t("walkthrough.figFrame")} {i + 1}:
              </span>
              <code>{frame.op}</code>
            </span>
            {figure.kind === "stack" && <StackFrame frame={frame} />}
            {figure.kind === "queue" && <QueueFrame frame={frame} />}
            {figure.kind === "visual" && frame.visual && (
              <StillVisual visual={frame.visual} />
            )}
          </li>
        ))}
      </ol>
      <Caption text={figure.caption} />
    </figure>
  );
}
