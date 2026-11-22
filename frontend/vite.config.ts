/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

/** The site name used everywhere unless VITE_APP_NAME is set at build time. */
const DEFAULT_APP_NAME = "AlgoQuest";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const appName = env.VITE_APP_NAME?.trim() || DEFAULT_APP_NAME;
  // Link previews need an absolute image address: VITE_SITE_URL, or the
  // production address that Vercel provides at build time.
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const siteUrl = (
    env.VITE_SITE_URL?.trim() || (vercelHost ? `https://${vercelHost}` : "")
  ).replace(/\/$/, "");
  return {
    plugins: [
      react(),
      {
        name: "app-name",
        // Puts the site name and address into index.html (title, description,
        // and link-preview tags).
        transformIndexHtml: (html: string) =>
          html
            .replaceAll("%APP_NAME%", appName)
            .replaceAll("%SITE_URL%", siteUrl),
      },
    ],
    define: {
      "import.meta.env.VITE_APP_NAME": JSON.stringify(appName),
    },
    server: {
      port: 5173,
      // Content tests read the lessons in ../content as raw text.
      fs: { allow: [".", "../content"] },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
      css: { modules: { classNameStrategy: "non-scoped" } },
    },
  };
});
