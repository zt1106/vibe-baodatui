import type { Page } from '@playwright/test';
import type { PlayerSession } from '../helpers';

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

export async function autoAdvanceToPlayPhase(players: PlayerSession[]) {
  await resolvePhaseWithRandomActions(players, '叫分阶段', '加倍阶段', [/不叫/, /1 分/, /2 分/, /3 分/]);
  await resolvePhaseWithRandomActions(players, '加倍阶段', '出牌阶段', [/加倍/, /不加倍/, /再加倍/, /不再加倍/]);
}
