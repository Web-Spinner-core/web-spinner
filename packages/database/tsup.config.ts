import { defineConfig } from "tsup";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
  clean: true,
  dts: {
    "resolve": true,
    "entry": [
      "./src/index.ts"
    ],
    "compilerOptions": {
      "moduleResolution": "node"
    }
  },
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  minify: isProduction,
  sourcemap: true,
});