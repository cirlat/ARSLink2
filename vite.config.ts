import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { tempo } from "tempo-devtools/dist/vite";
import path from "path";

const conditionalPlugins = [];
if (process.env.TEMPO === "true") {
  conditionalPlugins.push(["tempo-devtools/swc", {}]);
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      plugins: [...conditionalPlugins],
    }),
    tempo(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: process.env.TEMPO === "true" ? true : undefined,
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2020",
    },
    exclude: ["pg", "pg-native", "bcryptjs"],
  },
  build: {
    target: "es2020",
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development",
    ),
    "process.env.ELECTRON_RUN_AS_NODE": JSON.stringify(
      process.env.ELECTRON_RUN_AS_NODE,
    ),
    "process.versions.node": JSON.stringify(process.versions?.node || "16.0.0"),
    "process.platform": JSON.stringify(process.platform || "browser"),
  },
});
