import react from "@vitejs/plugin-react";
import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createLogger, createServer as createViteServer } from "vite";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const clientRoot = path.resolve(__dirname, "..", "client");
  
  const serverOptions = {
    middlewareMode: true,
    hmr: { 
      port: parseInt(process.env.HMR_PORT || '7823', 10), // Use separate port for HMR
      host: 'localhost', // Use localhost for development
      clientPort: parseInt(process.env.HMR_PORT || '7823', 10)
    },
    host: 'localhost', // Ensure server also binds to localhost
    allowedHosts: true as true,
  };

  const vite = await createViteServer({
    configFile: false,
    root: clientRoot,
    resolve: {
      alias: {
        "@": path.resolve(clientRoot, "src"),
        "@shared": path.resolve(__dirname, "..", "shared"),
      },
    },
    plugins: [
      react(),
    ],
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  
  // Only serve HTML for non-asset requests
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip processing for asset requests (CSS, JS, images, etc.)
    if (url.includes('/assets/') || 
        url.includes('/@fs/') || 
        url.includes('/@vite/') ||
        url.includes('/node_modules/') ||
        url.match(/\.(css|js|ts|jsx|tsx|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(clientRoot, "index.html");

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // When running from dist/server, the public directory is at dist/public
  // Use process.cwd() which works in both development and production Docker
  const distPath = path.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Set proper MIME types for static assets
  app.use('/assets', express.static(path.resolve(distPath, 'assets'), {
    maxAge: '1y', // Long cache for hashed assets
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
    }
  }));

  // Serve other static files (images, fonts, etc.)
  app.use(express.static(distPath, {
    maxAge: '1d', // Cache for 1 day
    etag: true,
    lastModified: true
  }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
