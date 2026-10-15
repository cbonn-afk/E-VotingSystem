import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Skip the project's Tailwind v4 PostCSS config during tests — component
  // tests only need CSS imports (e.g. react-datepicker) to no-op, not to be
  // processed by the Tailwind plugin (which can't load in the test transform).
  css: { postcss: { plugins: [] } },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@core": path.resolve(__dirname, "src/@core"),
      "@layouts": path.resolve(__dirname, "src/@layouts"),
      "@menu": path.resolve(__dirname, "src/@menu"),
      "@assets": path.resolve(__dirname, "src/assets"),
      "@components": path.resolve(__dirname, "src/components"),
      "@configs": path.resolve(__dirname, "src/configs"),
      "@views": path.resolve(__dirname, "src/views"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    clearMocks: true,
    maxWorkers: 4,
  },
});
