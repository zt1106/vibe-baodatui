import { expect, test } from './coverageTest';
import {
  loginAndEnterLobby,
  createRoom,
  joinPrepareDirect,
  readyUp,
  startGame,
  type PlayerSession
} from './helpers';
import { autoAdvanceToPlayPhase } from './utils/autoPlayDriver';

const manualOptIn = process.env.E2E_INCLUDE_MANUAL === 'true';

test('bootstrap multi-player session for manual gameplay debugging', async ({ browser }) => {
  test.skip(!manualOptIn, 'Manual-only scenario; opt in with E2E_INCLUDE_MANUAL=true');
  test.setTimeout(600 * 60 * 1000);
  const blueprints: Array<Pick<PlayerSession, 'label' | 'nickname'>> = [
    { label: '1', nickname: '1' },
    { label: '2', nickname: '2' },
    { label: '3', nickname: '3' }
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

  await autoAdvanceToPlayPhase(players);
  await expect(host.page.getByText(/阶段：出牌阶段/)).toBeVisible({ timeout: 30_000 });

  // Keep all three windows alive for manual verification; abort test run when finished.
  await host.page.waitForTimeout(600 * 60 * 1000);
});
