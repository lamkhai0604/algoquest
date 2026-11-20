/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Set by vite.config.ts: VITE_APP_NAME, or AlgoQuest. */
  readonly VITE_APP_NAME: string;
}
