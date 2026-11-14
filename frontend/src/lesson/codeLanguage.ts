import { createContext, useContext } from "react";

/** The code language a learner reads lessons in, shared by every code switcher on the page. */
export interface CodeLanguage {
  language: string;
  setLanguage: (language: string) => void;
}

export const CodeLanguageContext = createContext<CodeLanguage | null>(null);

export function useCodeLanguage(): CodeLanguage | null {
  return useContext(CodeLanguageContext);
}

const KEY = "algoquest.codeLanguage";
export const DEFAULT_LANGUAGE = "javascript";

/** The saved choice; storage can be missing or blocked, so fall back to the default. */
export function savedLanguage(): string {
  try {
    return localStorage.getItem(KEY) ?? DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function saveLanguage(language: string) {
  try {
    localStorage.setItem(KEY, language);
  } catch {
    // Not saved; the choice still applies on this page.
  }
}

const NAMES: Record<string, string> = {
  javascript: "JavaScript",
  java: "Java",
};

export function languageName(language: string): string {
  return NAMES[language] ?? language;
}
