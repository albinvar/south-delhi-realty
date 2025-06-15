"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
exports.setupVite = setupVite;
exports.serveStatic = serveStatic;
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const nanoid_1 = require("nanoid");
const path_1 = __importDefault(require("path"));
const vite_1 = require("vite");
const viteLogger = (0, vite_1.createLogger)();
function log(message, source = "express") {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
    console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app, server) {
    const clientRoot = path_1.default.resolve(__dirname, "..", "client");
    const serverOptions = {
        middlewareMode: true,
        hmr: {
            port: parseInt(process.env.HMR_PORT || '7823', 10),
            host: 'localhost',
            clientPort: parseInt(process.env.HMR_PORT || '7823', 10)
        },
        host: 'localhost',
        allowedHosts: true,
    };
    const vite = await (0, vite_1.createServer)({
        configFile: false,
        root: clientRoot,
        resolve: {
            alias: {
                "@": path_1.default.resolve(clientRoot, "src"),
                "@shared": path_1.default.resolve(__dirname, "..", "shared"),
            },
        },
        plugins: [
            (0, plugin_react_1.default)(),
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
    app.use("*", async (req, res, next) => {
        const url = req.originalUrl;
        if (url.includes('/assets/') ||
            url.includes('/@fs/') ||
            url.includes('/@vite/') ||
            url.includes('/node_modules/') ||
            url.match(/\.(css|js|ts|jsx|tsx|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
            return next();
        }
        try {
            const clientTemplate = path_1.default.resolve(clientRoot, "index.html");
            let template = await fs_1.default.promises.readFile(clientTemplate, "utf-8");
            template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${(0, nanoid_1.nanoid)()}"`);
            const page = await vite.transformIndexHtml(url, template);
            res.status(200).set({ "Content-Type": "text/html" }).end(page);
        }
        catch (e) {
            vite.ssrFixStacktrace(e);
            next(e);
        }
    });
}
function serveStatic(app) {
    const distPath = path_1.default.resolve(__dirname, "..", "public");
    if (!fs_1.default.existsSync(distPath)) {
        throw new Error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
    }
    app.use(express_1.default.static(distPath, {
        maxAge: '1d',
        etag: true,
        lastModified: true
    }));
    app.use("*", (_req, res) => {
        res.sendFile(path_1.default.resolve(distPath, "index.html"));
    });
}
