import { spawn } from "child_process";

const EXPO_PORT = 3000;
const SERVER_READY_DELAY = 2000;

const expo = spawn("bun", ["run", "expo", "start", "--web", "--port", String(EXPO_PORT), "--host", "lan"], {
  stdio: "inherit",
  env: { ...process.env },
});

function waitForPort(port: number, timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const net = require("net");
      const socket = new net.Socket();
      socket.setTimeout(1000);
      socket.on("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.on("error", () => {
        socket.destroy();
        if (Date.now() - start > timeout) {
          reject(new Error(`Port ${port} not available after ${timeout}ms`));
        } else {
          setTimeout(check, 500);
        }
      });
      socket.on("timeout", () => {
        socket.destroy();
        if (Date.now() - start > timeout) {
          reject(new Error(`Port ${port} not available after ${timeout}ms`));
        } else {
          setTimeout(check, 500);
        }
      });
      socket.connect(port, "127.0.0.1");
    };
    check();
  });
}

console.log(`Waiting for Expo dev server on port ${EXPO_PORT}...`);
waitForPort(EXPO_PORT, 120000)
  .then(() => {
    console.log(`Expo dev server ready on port ${EXPO_PORT}`);
    setTimeout(() => {
      const server = spawn("bun", ["run", "server/index.ts"], {
        stdio: "inherit",
        env: { ...process.env },
      });
      server.on("exit", (code) => {
        console.error(`Express server exited with code ${code}`);
        process.exit(code ?? 1);
      });
    }, SERVER_READY_DELAY);
  })
  .catch((err) => {
    console.error("Failed waiting for Expo:", err.message);
    console.log("Starting Express server anyway...");
    const server = spawn("bun", ["run", "server/index.ts"], {
      stdio: "inherit",
      env: { ...process.env },
    });
    server.on("exit", (code) => {
      process.exit(code ?? 1);
    });
  });

expo.on("exit", (code) => {
  console.error(`Expo process exited with code ${code}`);
  process.exit(code ?? 1);
});

process.on("SIGTERM", () => {
  expo.kill("SIGTERM");
  process.exit(0);
});

process.on("SIGINT", () => {
  expo.kill("SIGINT");
  process.exit(0);
});
