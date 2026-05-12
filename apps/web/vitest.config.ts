import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["**/__tests__/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // 'server-only' is a Next.js-only sentinel that throws when imported
      // in a client bundle. In tests (node), we want it to be a no-op so
      // we can import server-side modules directly.
      "server-only": path.resolve(__dirname, "__tests__/stubs/server-only.ts"),
    },
  },
});
