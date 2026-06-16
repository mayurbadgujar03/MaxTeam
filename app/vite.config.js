import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import electron from "vite-plugin-electron";

export default defineConfig(({ mode }) => ({
  base: './',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    electron({
      entry: "electron/main.js",
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo_tab_icon.png"],
      manifest: {
        name: "Flowbase",
        short_name: "Flowbase",
        description: "Engineering Project Management Workspace",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "logo_tab_icon.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "logo_tab_icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
