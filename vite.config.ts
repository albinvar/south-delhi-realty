import react from "@vitejs/plugin-react";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Detect if we're in a workspace environment (like DigitalOcean)
const isWorkspace = process.cwd().includes('/workspace') || process.cwd().includes('\\workspace');

// Function to resolve client directory
const getClientRoot = () => {
  const possiblePaths = [
    path.resolve(__dirname, "client"),
    path.resolve(process.cwd(), "client"),
    "client"
  ];
  
  for (const clientPath of possiblePaths) {
    try {
      const indexPath = path.resolve(clientPath, "index.html");
      if (fs.existsSync(indexPath)) {
        console.log(`Found client at: ${clientPath}`);
        return clientPath;
      }
    } catch (e) {
      // Continue to next path
    }
  }
  
  // Fallback
  return path.resolve(__dirname, "client");
};

const clientRoot = getClientRoot();

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(clientRoot, "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: clientRoot,
  build: {
    outDir: path.resolve(__dirname, "dist", "public"),
    emptyOutDir: true,
  },
  define: {
    global: 'globalThis',
  },
});
