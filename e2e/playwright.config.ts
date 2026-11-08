import { defineConfig } from "@playwright/test";

// Smoke run (T-106): the app is already running (see .github/workflows/smoke.yml).
export default defineConfig({
  testDir: ".",
  timeout: 60_000,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "results/report.json" }]],
  outputDir: "results/artifacts",
  use: {
    baseURL: process.env.FRONTEND_URL ?? "http://localhost:5173",
    colorScheme: "dark",
    viewport: { width: 1280, height: 800 },
  },
});
