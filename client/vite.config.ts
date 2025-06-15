import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve("src"),
      "@shared": path.resolve("../shared"),
    },
  },
  define: {
    global: 'globalThis',
  },
}); 