import { spawn } from "child_process";

const expo = spawn("bun", ["run", "expo", "start", "--web", "--port", "5000", "--host", "lan"], {
  stdio: "inherit",
  env: { ...process.env },
});

const server = spawn("bun", ["run", "server/index.ts"], {
  stdio: "inherit",
  env: { ...process.env },
});

expo.on("exit", (code) => {
  console.error(`Expo process exited with code ${code}`);
  server.kill("SIGTERM");
  process.exit(code ?? 1);
});

server.on("exit", (code) => {
  console.error(`Express server exited with code ${code}`);
});

process.on("SIGTERM", () => {
  expo.kill("SIGTERM");
  server.kill("SIGTERM");
  process.exit(0);
});

process.on("SIGINT", () => {
  expo.kill("SIGINT");
  server.kill("SIGINT");
  process.exit(0);
});
