const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react-swc");
const path = require("path");
const { tempo } = require("tempo-devtools/dist/vite");

// Add conditional plugins for Tempo
const conditionalPlugins = [];
if (process.env.TEMPO === "true") {
  conditionalPlugins.push(["tempo-devtools/swc", {}]);
}

// Configurazione semplificata senza dipendenze Tempo
module.exports = defineConfig({
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
});
