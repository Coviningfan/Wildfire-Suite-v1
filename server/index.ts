import express from "express";
import cors from "cors";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

const app = express();
const PORT = 3001;

const allowedOrigins = [
  /\.replit\.dev$/,
  /\.repl\.co$/,
  /^https?:\/\/localhost/,
  /^https?:\/\/127\.0\.0\.1/,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(pattern => pattern.test(origin))) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express API server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
