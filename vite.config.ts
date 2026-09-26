import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// @ts-expect-error type error without @types/node package
import process from "node:process";
const host = process.env.TAURI_DEV_HOST;

function authBridgePlugin() {
  const pendingSessions = new Map<string, any>();

  return {
    name: 'dayframe-auth-bridge',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (!req.url || !req.url.startsWith('/api/auth-bridge')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost:1420');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              const key = data.flowId || data.email;
              if (key && data.session) {
                pendingSessions.set(key, data.session);
                if (data.flowId && data.email) {
                  pendingSessions.set(data.email, data.session);
                }
                setTimeout(() => {
                  if (data.flowId) pendingSessions.delete(data.flowId);
                  if (data.email) pendingSessions.delete(data.email);
                }, 5 * 60 * 1000);
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err: any) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Invalid JSON' }));
            }
          });
          return;
        }

        if (req.method === 'GET') {
          const flowId = url.searchParams.get('flow');
          const email = url.searchParams.get('email');
          const key = flowId || email;

          res.setHeader('Content-Type', 'application/json');
          if (key && pendingSessions.has(key)) {
            const session = pendingSessions.get(key);
            res.end(JSON.stringify({ found: true, session }));
          } else {
            res.end(JSON.stringify({ found: false }));
          }
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react(), tailwindcss(), authBridgePlugin()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
