import { useSyncExternalStore } from "react";
import en from "./locales/en.json";
import vi from "./locales/vi.json";

export const DEFAULT_LOCALE = "en" as const;
export type Locale = "en" | "vi";
export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "vi"];
export const translations = { en, vi } as const;
export type TranslationKey =
  | `common.${keyof typeof en.common}`
  | `nav.${keyof typeof en.nav}`
  | `game.${keyof typeof en.game}`
  | `lesson.${keyof typeof en.lesson}`
  | `language.${keyof typeof en.language}`
  | `pattern.${keyof typeof en.pattern}`
  | `home.${keyof typeof en.home}`
  | `profile.${keyof typeof en.profile}`
  | `footer.${keyof typeof en.footer}`
  | `level.${keyof typeof en.level}`
  | `profileExtra.${keyof typeof en.profileExtra}`
  | `solve.${keyof typeof en.solve}`
  | `walkthrough.${keyof typeof en.walkthrough}`;

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "vi";
}

const STORAGE_KEY = "algoquest.locale";
function initialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved && isLocale(saved) ? saved : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}
let currentLocale: Locale = initialLocale();
if (typeof document !== "undefined")
  document.documentElement.lang = currentLocale;
const listeners = new Set<() => void>();

export function getLocale(): Locale {
  return currentLocale;
}
export function setLocale(next: Locale): void {
  if (currentLocale === next) return;
  currentLocale = next;
  if (typeof document !== "undefined") document.documentElement.lang = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage may be blocked */
    }
  }
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale, () => DEFAULT_LOCALE);
}
export function translate(locale: Locale, key: TranslationKey): string {
  const [section = "", item = ""] = key.split(".");
  const dict = translations[locale] as unknown as Record<
    string,
    Record<string, string>
  >;
  const fallback = en as unknown as Record<string, Record<string, string>>;
  return dict[section]?.[item] ?? fallback[section]?.[item] ?? key;
}
export function useTranslation() {
  const locale = useLocale();
  return { locale, t: (key: TranslationKey) => translate(locale, key) };
}
