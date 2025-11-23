import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type Logger = (...messages: unknown[]) => void;

export type SpawnedService = {
  label: string;
  process: ChildProcessWithoutNullStreams;
  ready: Promise<void>;
  url: string;
};

type StartProcessOptions = {
  label: string;
  args: string[];
  env: NodeJS.ProcessEnv;
  readyCheck: () => Promise<boolean>;
  timeoutMs: number;
  url: string;
  logger?: Logger;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../../..');

const DEFAULT_BACKEND_TIMEOUT_MS = 30_000;
const DEFAULT_FRONTEND_TIMEOUT_MS = 60_000;

export async function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const address = server.address();
      if (typeof address === 'object' && address) {
        resolve(address.port);
      } else {
        reject(new Error('Failed to allocate a port'));
      }
      server.close();
    });
  });
}

async function waitForReady(check: () => Promise<boolean>, timeoutMs: number, label: string, logger: Logger) {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      if (await check()) {
        logger(label, 'ready signal received');
        return;
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  const detail =
    lastError instanceof Error ? lastError.message : lastError ? String(lastError) : 'timeout';
  throw new Error(`Timed out waiting for ${label} (${detail})`);
}

export async function stopProcess(proc?: ChildProcessWithoutNullStreams | null) {
  if (!proc || proc.killed || proc.exitCode !== null) return;
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      if (proc.exitCode === null) {
        proc.kill('SIGKILL');
      }
    }, 5_000);
    proc.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    proc.kill('SIGINT');
  });
}

function startProcess(options: StartProcessOptions): SpawnedService {
  const { label, args, env, readyCheck, timeoutMs, url, logger = console.log } = options;
  logger('spawning', label, 'cmd:', ['pnpm', ...args].join(' '), 'url:', url);
  const child = spawn('pnpm', args, { env, stdio: ['pipe', 'pipe', 'pipe'], cwd: repoRoot });
  let logs = '';
  child.stdout.on('data', (chunk) => {
    logs += chunk.toString();
    logger(label, 'stdout:', chunk.toString().trim());
  });
  child.stderr.on('data', (chunk) => {
    logs += chunk.toString();
    logger(label, 'stderr:', chunk.toString().trim());
  });

  const ready = waitForReady(async () => {
    if (child.exitCode !== null) {
      throw new Error(`${label} exited with code ${child.exitCode}`);
    }
    return readyCheck();
  }, timeoutMs, label, logger).catch(async (error) => {
    await stopProcess(child);
    const trimmed = logs.trim();
    const logNote = trimmed ? `\n${trimmed}` : '';
    throw new Error(`${label} failed to start: ${error.message}${logNote}`);
  });

  return { label, process: child, ready, url };
}

export function startBackend(
  port: number,
  webPort: number,
  options: { logger?: Logger; timeoutMs?: number } = {}
): SpawnedService {
  const backendUrl = `http://127.0.0.1:${port}`;
  const { logger = console.log, timeoutMs = DEFAULT_BACKEND_TIMEOUT_MS } = options;
  logger('starting backend', { backendUrl, webPort });
  const env = {
    ...process.env,
    PORT: String(port),
    WEB_ORIGINS: `http://localhost:${webPort},http://127.0.0.1:${webPort}`
  };
  return startProcess({
    label: 'backend (auto-play)',
    args: ['-C', 'apps/server', 'exec', 'tsx', 'src/index.ts', '--', '--auto-play', '--port', String(port)],
    env,
    readyCheck: async () => {
      try {
        const res = await fetch(`${backendUrl}/health`);
        return res.ok;
      } catch {
        return false;
      }
    },
    timeoutMs,
    url: backendUrl,
    logger
  });
}

export function startFrontend(
  port: number,
  backendUrl: string,
  options: { logger?: Logger; timeoutMs?: number } = {}
): SpawnedService {
  const frontendUrl = `http://127.0.0.1:${port}`;
  const { logger = console.log, timeoutMs = DEFAULT_FRONTEND_TIMEOUT_MS } = options;
  logger('starting frontend', { frontendUrl, backendUrl });
  const env = {
    ...process.env,
    NEXT_PUBLIC_SOCKET_URL: backendUrl,
    PORT: String(port)
  };
  return startProcess({
    label: 'frontend',
    args: ['-C', 'apps/web', 'exec', 'next', 'dev', '-p', String(port), '--hostname', '127.0.0.1'],
    env,
    readyCheck: async () => {
      try {
        const res = await fetch(frontendUrl);
        return res.ok;
      } catch {
        return false;
      }
    },
    timeoutMs,
    url: frontendUrl,
    logger
  });
}
