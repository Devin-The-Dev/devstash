import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/actions/**/*.test.ts", "src/lib/**/*.test.ts"],
  },
});
