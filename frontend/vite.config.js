import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["school-desk.jpg", "icon.svg"],
      manifest: {
        name: "LearnVult",
        short_name: "LearnVult",
        description: "Offline learning resources for secondary schools in Sierra Leone",
        theme_color: "#0b3d2e",
        background_color: "#0b3d2e",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,jpg,png,ico,woff2}"],
        navigateFallback: "/index.html"
      }
    })
  ],
  server: {
    port: 5173,
    proxy: { "/api": "http://127.0.0.1:8000" }
  }
});
