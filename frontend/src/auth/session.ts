/**
 * The app's sign-in token (D-036): kept in memory and in sessionStorage, so it survives a reload
 * but not a closed tab. It is sent only as a bearer header, never in a URL.
 */
export interface Session {
  token: string;
  expiresAt: string;
}

const STORAGE_KEY = "algoquest.session";
const listeners = new Set<() => void>();
let current: Session | null | undefined;

function load(): Session | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function isExpired(session: Session): boolean {
  return new Date(session.expiresAt).getTime() <= Date.now();
}

export function getToken(): string | null {
  if (current === undefined) current = load();
  if (current && isExpired(current)) clearSession();
  return current?.token ?? null;
}

export function setSession(session: Session): void {
  current = session;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable: the session lasts until the page is closed.
  }
  listeners.forEach((listener) => listener());
}

export function clearSession(): void {
  current = null;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored.
  }
  listeners.forEach((listener) => listener());
}

/** Subscribes to sign-in and sign-out; returns an unsubscribe function. */
export function onSessionChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** For tests: forget the in-memory copy so the next read uses storage. */
export function resetSessionCache(): void {
  current = undefined;
}
