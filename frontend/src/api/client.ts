/** RFC 9457 problem detail, as returned by the backend for every error. */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetail | null;

  constructor(status: number, problem: ProblemDetail | null, message?: string) {
    super(
      message ??
        problem?.detail ??
        problem?.title ??
        `Request failed with status ${status}`,
    );
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  getToken?: () => string | null;
  fetchFn?: typeof fetch;
  /** Extra attempts for GET requests on network errors and 502/503/504. */
  retries?: number;
  retryDelayMs?: number;
  /** After this long, the request counts as slow ("waking the server"). */
  slowAfterMs?: number;
  /** Called when the server answers 401, for example after the token expired. */
  onUnauthorized?: () => void;
  /** Headers added to every request. */
  extraHeaders?: () => Record<string, string>;
}

export interface ApiClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  /** Subscribes to the "waking the server" state; returns an unsubscribe. */
  onWakingChange(listener: (waking: boolean) => void): () => void;
  isWaking(): boolean;
}

const RETRYABLE_STATUS = new Set([502, 503, 504]);

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

async function readProblem(response: Response): Promise<ProblemDetail | null> {
  try {
    return (await response.json()) as ProblemDetail;
  } catch {
    return null;
  }
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const {
    baseUrl,
    getToken = () => null,
    fetchFn = (input, init) => fetch(input, init),
    retries = 3,
    retryDelayMs = 1000,
    slowAfterMs = 3000,
    onUnauthorized,
    extraHeaders = () => ({}),
  } = options;

  const listeners = new Set<(waking: boolean) => void>();
  let slowRequests = 0;

  const changeSlow = (delta: number) => {
    const before = slowRequests > 0;
    slowRequests += delta;
    const after = slowRequests > 0;
    if (before !== after) listeners.forEach((listener) => listener(after));
  };

  async function request<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
  ): Promise<T> {
    const attempts = method === "GET" ? retries + 1 : 1;
    const headers: Record<string, string> = {
      ...extraHeaders(),
      Accept: "application/json",
    };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    let slow = false;
    const timer = setTimeout(() => {
      slow = true;
      changeSlow(1);
    }, slowAfterMs);

    try {
      for (let attempt = 1; ; attempt++) {
        let response: Response;
        try {
          response = await fetchFn(baseUrl + path, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
          });
        } catch {
          if (attempt < attempts) {
            await delay(retryDelayMs * attempt);
            continue;
          }
          throw new ApiError(0, null, "Cannot reach the server.");
        }
        if (RETRYABLE_STATUS.has(response.status) && attempt < attempts) {
          await delay(retryDelayMs * attempt);
          continue;
        }
        if (!response.ok) {
          if (response.status === 401) onUnauthorized?.();
          throw new ApiError(response.status, await readProblem(response));
        }
        if (response.status === 204) return undefined as T;
        return (await response.json()) as T;
      }
    } finally {
      clearTimeout(timer);
      if (slow) changeSlow(-1);
    }
  }

  return {
    get<T>(path: string) {
      return request<T>("GET", path);
    },
    post<T>(path: string, body?: unknown) {
      return request<T>("POST", path, body);
    },
    onWakingChange(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    isWaking: () => slowRequests > 0,
  };
}
