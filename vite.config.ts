import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { tempo } from "tempo-devtools/dist/vite";

const conditionalPlugins = [];

// @ts-ignore
if (process.env.TEMPO === "true") {
  conditionalPlugins.push(["tempo-devtools/swc", {}]);
}

// https://vitejs.dev/config/
export default defineConfig({
  base:
    process.env.NODE_ENV === "development"
      ? "/"
      : process.env.VITE_BASE_PATH || "/",
  optimizeDeps: {
    entries: ["src/main.tsx", "src/tempobook/**/*"],
    esbuildOptions: {
      target: "es2020",
    },
  },
  plugins: [
    react({
      plugins: conditionalPlugins,
    }),
    tempo(),
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // @ts-ignore
    allowedHosts: process.env.TEMPO === "true" ? true : undefined,
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    target: "es2020",
  },
  // Ensure proper handling of CommonJS modules
  esbuild: {
    target: "es2020",
    format: "esm",
    tsconfigRaw: {
      compilerOptions: {
        target: "es2020",
        module: "esnext",
        moduleResolution: "node",
        esModuleInterop: true,
        resolveJsonModule: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
  define: {
    // Aggiungi questa definizione per evitare errori con process
    "process.env": process.env,
    "process.versions": process.versions || {},
  },
});
