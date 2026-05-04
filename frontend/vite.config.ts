import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

const plugins = [react(), tailwindcss(), vitePluginManusRuntime()];

export default defineConfig({
  plugins,
  base: '/',
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "src/assets"),
      "@components": path.resolve(import.meta.dirname, "src/components"),
      "@features": path.resolve(import.meta.dirname, "src/features"),
      "@pages": path.resolve(import.meta.dirname, "src/pages"),
      "@hooks": path.resolve(import.meta.dirname, "src/hooks"),
      "@services": path.resolve(import.meta.dirname, "src/services"),
      "@stores": path.resolve(import.meta.dirname, "src/stores"),
      "@constants": path.resolve(import.meta.dirname, "src/constants"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname),
  build: {
    rollupOptions: {
      input: path.resolve(import.meta.dirname, "index.html"),
    },
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true, // Fail if port is busy instead of auto-switching
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
