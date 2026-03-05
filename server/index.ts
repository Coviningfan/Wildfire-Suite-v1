import express from "express";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import http from "http";

const app = express();
const PORT = 5000;
const EXPO_PORT = 3000;

const apiRouter = express.Router();
apiRouter.use(express.json());
apiRouter.use(express.urlencoded({ extended: true }));

async function start() {
  await setupAuth(app, apiRouter);
  registerAuthRoutes(apiRouter);

  apiRouter.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", apiRouter);

  const server = http.createServer((req, res) => {
    if (req.url?.startsWith("/api")) {
      app(req, res);
      return;
    }

    const proxyReq = http.request(
      `http://localhost:${EXPO_PORT}${req.url}`,
      {
        method: req.method,
        headers: {
          ...req.headers,
          host: `localhost:${EXPO_PORT}`,
        },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      }
    );

    proxyReq.on("error", () => {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Expo dev server not available yet" }));
    });

    req.pipe(proxyReq, { end: true });
  });

  server.on("upgrade", (req, socket, head) => {
    const proxyReq = http.request(
      `http://localhost:${EXPO_PORT}${req.url}`,
      {
        method: req.method,
        headers: {
          ...req.headers,
          host: `localhost:${EXPO_PORT}`,
        },
      }
    );

    proxyReq.on("upgrade", (proxyRes, proxySocket, proxyHead) => {
      socket.write(
        `HTTP/${proxyRes.httpVersion} ${proxyRes.statusCode} ${proxyRes.statusMessage}\r\n` +
          Object.entries(proxyRes.headers)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\r\n") +
          "\r\n\r\n"
      );
      if (proxyHead.length) socket.write(proxyHead);
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    });

    proxyReq.on("error", () => {
      socket.end();
    });

    proxyReq.end();
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Express API server running on port ${PORT}`);
    console.log(`Proxying non-API requests to Expo on port ${EXPO_PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
