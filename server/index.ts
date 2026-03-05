import express from "express";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import http from "http";

const app = express();
const PORT = 5000;
const EXPO_PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function start() {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use((req, res) => {
    const target = `http://localhost:${EXPO_PORT}${req.originalUrl}`;
    const proxyReq = http.request(
      target,
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

    proxyReq.on("error", (_err) => {
      res.status(502).json({ message: "Expo dev server not available yet" });
    });

    req.pipe(proxyReq, { end: true });
  });

  const server = http.createServer(app);

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
    console.log(`Proxying to Expo dev server on port ${EXPO_PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
