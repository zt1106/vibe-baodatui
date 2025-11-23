import { expect, test } from './coverageTest';
import type { Page } from '@playwright/test';
import {
  loginAndEnterLobby,
  createRoom,
  joinPrepareDirect,
  readyUp,
  startGame,
  type PlayerSession
} from './helpers';

const SESSION_CAPACITY = 3;
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
