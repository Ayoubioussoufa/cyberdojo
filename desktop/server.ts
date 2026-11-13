/**
 * Starts the CyberDojo server for the window to load: the Next.js server the
 * website runs on, bound to this computer only. Packaged, it is the standalone
 * build shipped in the app's resources; with CYBERDOJO_DESKTOP_DEV=1 it is
 * `next dev` from the repository.
 */
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { app, utilityProcess } from "electron";

/** A fixed port keeps the page's origin, and with it the browser-side settings such as the theme, between launches. */
const PREFERRED_PORT = 41820;
/**
 * The loopback interface, by name. Next calls itself "localhost" in the URLs it hands to src/proxy.ts;
 * bound to "127.0.0.1" it takes its own rewrites for another site and fetches them over HTTP, in a loop.
 */
const HOST = "localhost";
const START_TIMEOUT_MS = 120_000;

export interface Server {
  origin: string;
  /** The window proves itself to the server with this. See src/server/desktop.ts. */
  token: string;
  stop: () => void;
}

const dev = process.env.CYBERDOJO_DESKTOP_DEV === "1";

/** `wanted` when it is free, otherwise any free port. */
function freePort(wanted: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", () => (wanted === 0 ? reject(new Error("No free port on this computer.")) : resolve(freePort(0))));
    probe.listen(wanted, HOST, () => {
      const { port } = probe.address() as net.AddressInfo;
      probe.close(() => resolve(port));
    });
  });
}

async function answers(origin: string): Promise<boolean> {
  try {
    await fetch(`${origin}/api/auth/me/`, { signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}

export async function startServer(log: (line: string) => void): Promise<Server> {
  const port = await freePort(PREFERRED_PORT);
  const origin = `http://${HOST}:${port}`;
  const token = randomBytes(32).toString("base64url");
  const root = app.isPackaged ? path.join(process.resourcesPath, "server") : path.join(__dirname, "..", "server");
  const data = app.getPath("userData");
  fs.mkdirSync(data, { recursive: true });
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PORT: String(port),
    HOSTNAME: HOST,
    NEXT_PUBLIC_CYBERDOJO_DESKTOP: "1",
    CYBERDOJO_DESKTOP_TOKEN: token,
    CYBERDOJO_DB: path.join(data, "cyberdojo.db"),
    NEXT_TELEMETRY_DISABLED: "1",
  };

  let stop: () => void;
  let exited = false;
  const onExit = () => {
    exited = true;
  };
  if (dev) {
    const repo = process.cwd();
    const child = spawn(process.execPath, [path.join(repo, "node_modules", "next", "dist", "bin", "next"), "dev", "-p", String(port), "-H", HOST], {
      cwd: repo,
      env: { ...env, ELECTRON_RUN_AS_NODE: "1" },
    });
    child.stdout.on("data", (d: Buffer) => log(`server: ${d.toString().trimEnd()}`));
    child.stderr.on("data", (d: Buffer) => log(`server: ${d.toString().trimEnd()}`));
    child.once("exit", onExit);
    stop = () => child.kill();
  } else {
    const child = utilityProcess.fork(path.join(root, "server.js"), [], {
      cwd: root,
      env: { ...env, NODE_ENV: "production", CYBERDOJO_TUTOR_INDEX: path.join(root, "tutor-index.json") },
      stdio: "pipe",
      serviceName: "CyberDojo server",
    });
    child.stdout?.on("data", (d: Buffer) => log(`server: ${d.toString().trimEnd()}`));
    child.stderr?.on("data", (d: Buffer) => log(`server: ${d.toString().trimEnd()}`));
    child.once("exit", onExit);
    stop = () => child.kill();
  }

  const deadline = Date.now() + START_TIMEOUT_MS;
  while (!(await answers(origin))) {
    if (exited) throw new Error("The CyberDojo server stopped while starting. The log has the reason.");
    if (Date.now() > deadline) {
      stop();
      throw new Error("The CyberDojo server took too long to start.");
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  return { origin, token, stop };
}
