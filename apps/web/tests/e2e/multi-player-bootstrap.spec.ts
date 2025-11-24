import type { Browser } from '@playwright/test';
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
import { autoAdvanceToPlayPhase } from './utils/autoPlayDriver';
import {
  getAvailablePort,
  startBackend,
  startFrontend,
  stopProcess,
  type SpawnedService
} from './utils/serverHarness';

const manualOptIn = process.env.E2E_INCLUDE_MANUAL === 'true';

const log = (...messages: unknown[]) => {
  console.log('[bootstrap-e2e]', ...messages);
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
    backend = await startBackend(backendPort, webPort, { logger: log });
    log('waiting for backend ready...', backend.url);
    await backend.ready;

    frontend = await startFrontend(webPort, backend.url, { logger: log });
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
    const prepareUrl = `**/game/${encodeURIComponent(createdRoom.tableId)}/prepare`;
    await Promise.race([
      host.page.waitForURL(prepareUrl, { timeout: 120_000 }),
      host.page.getByText(/阶段：本局结束/).waitFor({ timeout: 90_000 }).catch(() => undefined)
    ]);

    log('round complete; waiting for result dialog');
    await host.page.waitForURL(prepareUrl, { timeout: 120_000 });

    const resultDialog = host.page.getByRole('dialog', { name: '本局结果' });
    await expect(resultDialog).toBeVisible({ timeout: 20_000 });
    await expect(resultDialog.getByText(/你(赢|输)了/)).toBeVisible({ timeout: 5_000 });

    log('result dialog visible; holding for 2s before ending');
    await host.page.waitForTimeout(2_000);

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
