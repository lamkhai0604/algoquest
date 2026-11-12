import { useEffect, useRef } from "react";
import styles from "./Celebration.module.css";

const COLORS = ["#f5c451", "#5fe0b8", "#8b7bff", "#ff9a6b", "#6cc6ff"];
const DURATION_MS = 2600;
const PIECES = 140;

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  spin: number;
  angle: number;
  color: string;
}

function reducedMotion(): boolean {
  if (typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function burst(width: number, height: number): Piece[] {
  const pieces: Piece[] = [];
  for (let i = 0; i < PIECES; i++) {
    const fromLeft = i % 2 === 0;
    pieces.push({
      x: fromLeft ? width * 0.15 : width * 0.85,
      y: height * 0.75,
      vx: (fromLeft ? 1 : -1) * (2 + Math.random() * 6),
      vy: -(9 + Math.random() * 8),
      size: 5 + Math.random() * 6,
      spin: (Math.random() - 0.5) * 0.4,
      angle: Math.random() * Math.PI,
      color: COLORS[i % COLORS.length] ?? "#f5c451",
    });
  }
  return pieces;
}

/**
 * A short burst of confetti over the page for a perfect score (D-042).
 * Drawn on one canvas, no library; nothing is shown when the system asks
 * for reduced motion.
 */
export function Celebration() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion()) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);
    const pieces = burst(width, height);
    const started = performance.now();
    let frame = 0;

    const draw = (now: number) => {
      const elapsed = now - started;
      context.clearRect(0, 0, width, height);
      context.globalAlpha = Math.max(0, 1 - elapsed / DURATION_MS);
      for (const piece of pieces) {
        piece.vy += 0.32;
        piece.vx *= 0.99;
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.angle += piece.spin;
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.angle);
        context.fillStyle = piece.color;
        context.fillRect(
          -piece.size / 2,
          -piece.size / 4,
          piece.size,
          piece.size / 2,
        );
        context.restore();
      }
      if (elapsed < DURATION_MS) {
        frame = requestAnimationFrame(draw);
      } else {
        context.clearRect(0, 0, width, height);
      }
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
  );
}
