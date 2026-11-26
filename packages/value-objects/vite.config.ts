import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

// oxlint-disable-next-line typescript/no-unsafe-call -- false positive: this config file is outside tsconfig, so the type-aware linter cannot resolve vite's types
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "AgendaValueObjects",
      fileName: (format) => `index.${format === "es" ? "mjs" : "js"}`,
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["validator", "bignumber.js"],
      output: {
        globals: {
          validator: "validator",
          "bignumber.js": "BigNumber",
        },
      },
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
});
