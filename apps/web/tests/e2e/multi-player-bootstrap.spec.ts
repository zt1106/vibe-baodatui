import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import {
  loginAndEnterLobby,
  createRoom,
  joinPrepareDirect,
  ensureCapacity,
  readyUp,
  startGame,
  type PlayerSession
} from './helpers';

const SESSION_CAPACITY = 3;

test('bootstrap multi-player session for manual gameplay debugging', async ({ browser }) => {
  test.setTimeout(600 * 60 * 1000);
  const blueprints: Array<Pick<PlayerSession, 'label' | 'nickname'>> = [
    { label: 'Host', nickname: 'Host Agent' },
    { label: 'Player 2', nickname: 'Alice Agent' },
    { label: 'Player 3', nickname: 'Bob Agent' }
  ];
  const players: PlayerSession[] = [];
  for (const blueprint of blueprints) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    players.push({ ...blueprint, context, page });
  }

  const [host, playerTwo, playerThree] = players;

  await Promise.all(
    players.map(({ page, nickname, label }) => loginAndEnterLobby(page, nickname, label))
  );

  const createdRoom = await createRoom(host.page);

  await Promise.all([
    joinPrepareDirect(playerTwo.page, createdRoom.prepareUrl),
    joinPrepareDirect(playerThree.page, createdRoom.prepareUrl)
  ]);

  await ensureCapacity(host.page, SESSION_CAPACITY);

  await Promise.all(
    players.map(({ page, label }) => readyUp(page, label))
  );

  await startGame(host.page);

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

  // Keep all three windows alive for manual verification; abort test run when finished.
  await host.page.waitForTimeout(600 * 60 * 1000);
});
