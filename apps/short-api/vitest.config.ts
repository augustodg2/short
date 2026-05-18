import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    globalSetup: "./src/tests/helpers/globalSetup.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
