import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          utils: ['clsx', 'tailwind-merge']
        }
      }
    },
    minify: 'esbuild',
    target: 'es2020'
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