import { api } from "../api";
import type { JSONContent } from "@tiptap/react";

/** A note in the list (D-074). */
export interface NoteSummary {
  id: string;
  title: string;
  snippet: string;
  tags: string[];
  level: number | null;
  updatedAt: string;
}

/** A whole note, for the editor. */
export interface Note {
  id: string;
  title: string;
  body: JSONContent;
  tags: string[];
  level: number | null;
  createdAt: string;
  updatedAt: string;
}

/** What a save sends: the editor document and its plain text. */
export interface NoteInput {
  title: string;
  body: JSONContent;
  bodyText: string;
  tags: string[];
  level: number | null;
}

export function listNotes(filter: {
  q?: string;
  tag?: string;
  level?: number;
}): Promise<NoteSummary[]> {
  const params = new URLSearchParams();
  if (filter.q?.trim()) params.set("q", filter.q.trim());
  if (filter.tag) params.set("tag", filter.tag);
  if (filter.level !== undefined) params.set("level", String(filter.level));
  const query = params.toString();
  return api.get<NoteSummary[]>(`/api/v1/notes${query ? `?${query}` : ""}`);
}

export const getNote = (id: string) => api.get<Note>(`/api/v1/notes/${id}`);
export const createNote = (input: NoteInput) =>
  api.post<Note>("/api/v1/notes", input);
export const updateNote = (id: string, input: NoteInput) =>
  api.put<Note>(`/api/v1/notes/${id}`, input);
export const deleteNote = (id: string) =>
  api.delete<void>(`/api/v1/notes/${id}`);

/** Downloads every note as a zip of Markdown files. */
export async function downloadAllNotes(): Promise<void> {
  const file = await api.download("/api/v1/notes/export");
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "algoquest-notes.zip";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "3 hours ago", "yesterday", in the reader's language. */
export function sinceText(
  iso: string,
  locale: string,
  now = Date.now(),
): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["second", 60],
    ["minute", 60],
    ["hour", 24],
    ["day", 7],
    ["week", 4.35],
    ["month", 12],
    ["year", Infinity],
  ];
  let value = seconds;
  for (const [unit, size] of steps) {
    if (Math.abs(value) < size) {
      return unit === "second" && Math.abs(value) < 45
        ? format.format(0, "second")
        : format.format(Math.round(value), unit);
    }
    value /= size;
  }
  return format.format(Math.round(value), "year");
}
