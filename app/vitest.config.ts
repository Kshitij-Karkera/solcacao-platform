// vitest.config.ts: settings for unit tests (run with `npm run test`).

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Simulated browser DOM so components can render in tests
    environment: "jsdom",
    // Allows describe/it/expect without importing them
    globals: true,
    // Shared setup that runs before each test file
    setupFiles: ["./src/test/setup.ts"],
    // Which files count as tests
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    // Same '@/...' import alias as the app
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
