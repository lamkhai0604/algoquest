export type Theme = "dark" | "light";

const STORAGE_KEY = "algoquest.theme";

export function readStoredTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null; // storage can be unavailable (private mode, embedded views)
  }
}

export function storeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // The choice still applies for this visit.
  }
}

export function initialTheme(): Theme {
  const stored = readStoredTheme();
  if (stored) return stored;
  const query = "(prefers-color-scheme: light)";
  return window.matchMedia?.(query).matches ? "light" : "dark";
}
