import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    host: "0.0.0.0",       // aceita conexões externas no container
    port: 3000,            // porta do preview
    allowedHosts: ["kw8k0w4swko04ococo8kwo08.157.90.31.2.sslip.io"],   // libera qualquer host (sslip.io incluso)
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
