/**
 * The site name, in one place. It comes from VITE_APP_NAME at build time and
 * defaults to "AlgoQuest" (see vite.config.ts). Text in the translation files
 * writes it as {appName}.
 */
export const APP_NAME: string = import.meta.env.VITE_APP_NAME;

/** The letter in the logo mark: the first letter of the name. */
export const APP_INITIAL = APP_NAME.charAt(0).toUpperCase();
