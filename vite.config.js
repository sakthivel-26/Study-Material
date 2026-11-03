import { defineConfig } from "vite";
import path from "node:path";
import geminiHandler from "./api/gemini.js";
import groqHandler from "./api/groq.js";

const vendor = (name) => path.resolve("src/vendor", name);

// Vercel runs files in /api automatically, but plain `vite` does not. Mount
// the same handlers during local development so AI extraction works without
// requiring a second backend process.
const localApiPlugin = () => ({
  name: "local-ai-api-routes",
  configureServer(server) {
    const handlers = { "/api/gemini": geminiHandler, "/api/groq": groqHandler };
    server.middlewares.use(async (req, res, next) => {
      const pathname = new URL(req.url || "/", "http://localhost").pathname;
      const handler = handlers[pathname];
      if (!handler) return next();

      try {
        if (!["GET", "HEAD", "OPTIONS"].includes(req.method || "GET")) {
          const chunks = [];
          let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 10 * 1024 * 1024) throw new Error("Request body exceeds 10 MB");
            chunks.push(chunk);
          }
          const raw = Buffer.concat(chunks).toString("utf8");
          req.body = raw ? JSON.parse(raw) : {};
        }
        res.status = code => { res.statusCode = code; return res; };
        res.json = value => {
          if (!res.headersSent) res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify(value));
        };
        await handler(req, res);
      } catch (error) {
        if (!res.headersSent) res.statusCode = 500;
        if (!res.writableEnded) res.end(JSON.stringify({ error: error.message }));
      }
    });
  },
});

export default defineConfig({
  plugins: [localApiPlugin()],
  esbuild: { jsx: "automatic" },
  // Native esbuild dependency optimization is blocked by the Windows Codex
  // sandbox. Use equivalent browser-ready ESM builds for the CommonJS React
  // packages and let Vite serve the remaining ESM dependencies directly.
  resolve: {
    alias: [
      { find: /^react\/jsx-dev-runtime$/, replacement: vendor("jsx-dev-runtime.mjs") },
      { find: /^react\/jsx-runtime$/, replacement: vendor("jsx-runtime.mjs") },
      { find: /^react-dom\/client$/, replacement: vendor("react-dom-client.mjs") },
      { find: /^react-dom$/, replacement: vendor("react-dom.mjs") },
      { find: /^react-router-dom$/, replacement: vendor("react-router-dom.mjs") },
      { find: /^lucide-react$/, replacement: vendor("lucide-react.mjs") },
      { find: /^framer-motion$/, replacement: vendor("framer-motion.mjs") },
      { find: /^react$/, replacement: vendor("react.mjs") },
    ],
  },
  optimizeDeps: {
    noDiscovery: true,
    include: [],
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    hmr: {
      host: "localhost",
    },
    proxy: {
      "/api/nvidia": {
        target: "https://integrate.api.nvidia.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nvidia/, "")
      },
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true
      }
    }
  },
});
