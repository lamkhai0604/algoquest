/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

/** The site name used everywhere unless VITE_APP_NAME is set at build time. */
const DEFAULT_APP_NAME = "AlgoQuest";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const appName = env.VITE_APP_NAME?.trim() || DEFAULT_APP_NAME;
  return {
    plugins: [
      react(),
      {
        name: "app-name",
        // Puts the site name into index.html (page title and description).
        transformIndexHtml: (html: string) =>
          html.replaceAll("%APP_NAME%", appName),
      },
    ],
    define: {
      "import.meta.env.VITE_APP_NAME": JSON.stringify(appName),
    },
    server: { port: 5173 },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
      css: { modules: { classNameStrategy: "non-scoped" } },
    },
  };
});
