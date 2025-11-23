import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Browser, Page } from '@playwright/test';
import { expect, test } from './coverageTest';
import {
  loginAndEnterLobby,
  createRoom,
  joinPrepareDirect,
  readyUp,
  startGame,
  setE2eBaseUrl,
  type PlayerSession
} from './helpers';

const manualOptIn = process.env.E2E_INCLUDE_MANUAL === 'true';
const BACKEND_START_TIMEOUT_MS = 30_000;
const FRONTEND_START_TIMEOUT_MS = 60_000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../..');

const log = (...messages: unknown[]) => {
  console.log('[bootstrap-e2e]', ...messages);
};

type SpawnedService = {
  label: string;
  process: ChildProcessWithoutNullStreams;
  ready: Promise<void>;
  url: string;
};

test('bootstrap multi-player session for auto-play', async ({ browser }) => {
  test.skip(!manualOptIn, 'Manual-only scenario; opt in with E2E_INCLUDE_MANUAL=true');
  test.setTimeout(240_000);

  const backendPort = await getAvailablePort();
  let webPort = await getAvailablePort();
  if (webPort === backendPort) {
    webPort = await getAvailablePort();
  }

  let backend: SpawnedService | null = null;
  let frontend: SpawnedService | null = null;
  let players: PlayerSession[] = [];

  try {
    log('allocating ports', { backendPort, webPort });
    backend = await startBackend(backendPort, webPort);
    log('waiting for backend ready...', backend.url);
    await backend.ready;

    frontend = await startFrontend(webPort, backend.url);
    log('waiting for frontend ready...', frontend.url);
    await frontend.ready;
    setE2eBaseUrl(frontend.url);

    log('logging in players');
    players = await bootstrapPlayers(browser);

    const [host, playerTwo, playerThree] = players;

    log('creating room...');
    const createdRoom = await createRoom(host.page);

    await Promise.all([
      joinPrepareDirect(playerTwo.page, createdRoom.prepareUrl),
      joinPrepareDirect(playerThree.page, createdRoom.prepareUrl)
    ]);

    await Promise.all(players.map(({ page, label }) => readyUp(page, label)));

    await startGame(host.page);
    log('game started; navigating to play view');

    await Promise.all(
      players.map(({ page }) =>
        page.waitForURL(`**/game/${encodeURIComponent(createdRoom.tableId)}/play`, {
          timeout: 30_000
        })
      )
    );

    await Promise.all(
      players.map(({ page }) =>
        expect(page.getByTestId('game-table-stage')).toBeVisible({ timeout: 30_000 })
      )
    );

    log('entered play view; waiting for auto-play progression');
    await autoAdvanceToPlayPhase(players);
    await expect(host.page.getByText(/阶段：出牌阶段/)).toBeVisible({ timeout: 30_000 });
    await expect(host.page.getByText(/阶段：本局结束/)).toBeVisible({ timeout: 90_000 });

  } finally {
    await Promise.all(
      players.map(async ({ context }) => {
        try {
          await context.close();
        } catch {
          // ignore
        }
      })
    );
    await stopProcess(frontend?.process);
    await stopProcess(backend?.process);
  }
});

async function bootstrapPlayers(browser: Browser) {
  const blueprints: Array<Pick<PlayerSession, 'label' | 'nickname'>> = [
    { label: '1', nickname: '1' },
    { label: '2', nickname: '2' },
    { label: '3', nickname: '3' }
  ];
  const players: PlayerSession[] = [];
  for (const blueprint of blueprints) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await loginAndEnterLobby(page, blueprint.nickname, blueprint.label);
    players.push({ ...blueprint, context, page });
  }
  return players;
}

async function getAvailablePort(): Promise<number> {
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

async function waitForReady(check: () => Promise<boolean>, timeoutMs: number, label: string) {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      if (await check()) {
        log(label, 'ready signal received');
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

async function stopProcess(proc?: ChildProcessWithoutNullStreams | null) {
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

function startProcess(
  label: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  readyCheck: () => Promise<boolean>,
  timeoutMs: number,
  url: string
): SpawnedService {
  log('spawning', label, 'cmd:', ['pnpm', ...args].join(' '), 'url:', url);
  const child = spawn('pnpm', args, { env, stdio: ['pipe', 'pipe', 'pipe'], cwd: repoRoot });
  let logs = '';
  child.stdout.on('data', (chunk) => {
    logs += chunk.toString();
    log(label, 'stdout:', chunk.toString().trim());
  });
  child.stderr.on('data', (chunk) => {
    logs += chunk.toString();
    log(label, 'stderr:', chunk.toString().trim());
  });

  const ready = waitForReady(async () => {
    if (child.exitCode !== null) {
      throw new Error(`${label} exited with code ${child.exitCode}`);
    }
    return readyCheck();
  }, timeoutMs, label).catch(async (error) => {
    await stopProcess(child);
    const trimmed = logs.trim();
    const logNote = trimmed ? `\n${trimmed}` : '';
    throw new Error(`${label} failed to start: ${error.message}${logNote}`);
  });

  return { label, process: child, ready, url };
}

async function startBackend(port: number, webPort: number): Promise<SpawnedService> {
  const backendUrl = `http://127.0.0.1:${port}`;
  log('starting backend', { backendUrl, webPort });
  const env = {
    ...process.env,
    PORT: String(port),
    WEB_ORIGINS: `http://localhost:${webPort},http://127.0.0.1:${webPort}`
  };
  return startProcess(
    'backend (auto-play)',
    ['-C', 'apps/server', 'exec', 'tsx', 'src/index.ts', '--', '--auto-play', '--port', String(port)],
    env,
    async () => {
      try {
        const res = await fetch(`${backendUrl}/health`);
        return res.ok;
      } catch {
        return false;
      }
    },
    BACKEND_START_TIMEOUT_MS,
    backendUrl
  );
}

async function startFrontend(port: number, backendUrl: string): Promise<SpawnedService> {
  const frontendUrl = `http://127.0.0.1:${port}`;
  log('starting frontend', { frontendUrl, backendUrl });
  const env = {
    ...process.env,
    NEXT_PUBLIC_SOCKET_URL: backendUrl,
    PORT: String(port)
  };
  return startProcess(
    'frontend',
    ['-C', 'apps/web', 'exec', 'next', 'dev', '-p', String(port), '--hostname', '127.0.0.1'],
    env,
    async () => {
      try {
        const res = await fetch(frontendUrl);
        return res.ok;
      } catch {
        return false;
      }
    },
    FRONTEND_START_TIMEOUT_MS,
    frontendUrl
  );
}

function pickRandom<T>(items: T[]): T | null {
  if (!items.length) return null;
  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? null;
}

async function readPhaseLabel(page: Page) {
  try {
    const phaseLocator = page.getByText(/阶段：/).first();
    const content = await phaseLocator.textContent({ timeout: 2_000 });
    if (!content) return null;
    const match = content.match(/阶段：\s*([^·]+)/);
    return match ? match[1].trim() : content.trim();
  } catch {
    return null;
  }
}

async function waitForPhaseOrActions(page: Page, target: string, actionLabels: RegExp[], timeout = 60_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const phase = await readPhaseLabel(page);
    if (phase?.includes(target)) {
      return;
    }
    const actionAvailable = await hasEnabledAction(page, actionLabels);
    if (actionAvailable) {
      return;
    }
    await page.waitForTimeout(500);
  }
  throw new Error(`Timed out waiting for phase ${target}`);
}

async function hasEnabledAction(page: Page, labels: RegExp[]) {
  const candidates = [];
  for (const label of labels) {
    const locator = page.getByRole('button', { name: label });
    const count = await locator.count();
    for (let i = 0; i < count; i += 1) {
      const button = locator.nth(i);
      const [visible, disabled] = await Promise.all([
        button.isVisible().catch(() => false),
        button.isDisabled().catch(() => true)
      ]);
      if (visible && !disabled) {
        candidates.push(button);
      }
    }
  }
  return candidates.length > 0;
}

async function clickRandomEnabledAction(page: Page, labels: RegExp[]) {
  const candidates = [];
  for (const label of labels) {
    const locator = page.getByRole('button', { name: label });
    const count = await locator.count();
    for (let i = 0; i < count; i += 1) {
      const button = locator.nth(i);
      const [visible, disabled] = await Promise.all([
        button.isVisible().catch(() => false),
        button.isDisabled().catch(() => true)
      ]);
      if (visible && !disabled) {
        candidates.push(button);
      }
    }
  }
  const pick = pickRandom(candidates);
  if (!pick) return false;
  await pick.click();
  return true;
}

async function resolvePhaseWithRandomActions(
  players: PlayerSession[],
  phaseLabel: string,
  nextPhaseLabel: string,
  actionLabels: RegExp[]
) {
  const [host] = players;
  await waitForPhaseOrActions(host.page, phaseLabel, actionLabels);
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    const currentPhase = await readPhaseLabel(host.page);
    if (currentPhase?.includes(nextPhaseLabel)) {
      return;
    }
    if (!currentPhase?.includes(phaseLabel)) {
      await host.page.waitForTimeout(400);
      continue;
    }

    for (const { page } of players) {
      const seatPhase = await readPhaseLabel(page);
      if (!seatPhase?.includes(phaseLabel)) continue;
      const clicked = await clickRandomEnabledAction(page, actionLabels);
      if (clicked) {
        await page.waitForTimeout(250);
      }
    }

    await host.page.waitForTimeout(500);
  }

  throw new Error(`Timed out resolving ${phaseLabel} -> ${nextPhaseLabel}`);
}

async function autoAdvanceToPlayPhase(players: PlayerSession[]) {
  await resolvePhaseWithRandomActions(players, '叫分阶段', '加倍阶段', [/不叫/, /1 分/, /2 分/, /3 分/]);
  await resolvePhaseWithRandomActions(players, '加倍阶段', '出牌阶段', [/加倍/, /不加倍/, /再加倍/, /不再加倍/]);
}
