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
  | `language.${keyof typeof en.language}`;

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "vi";
}

/** Pure lookup: safe to use in existing components without installing a library. */
export function translate(locale: Locale, key: TranslationKey): string {
  const [section, item] = key.split(".") as [keyof typeof en, string];
  const fallback = (en[section] as Record<string, string>)[item];
  return (translations[locale][section] as Record<string, string>)[item] ?? fallback ?? key;
}
