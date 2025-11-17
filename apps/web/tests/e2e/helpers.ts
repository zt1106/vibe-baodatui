import { expect, type BrowserContext, type Page } from '@playwright/test';

const BASE_URL = (process.env.E2E_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const urlFor = (path: string) => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${normalized}`;
};

export async function loginAndEnterLobby(page: Page, nickname: string, label: string) {
  await page.goto(urlFor('/'));
  const nicknameInput = page.getByTestId('nickname-input');
  await expect(nicknameInput, `${label} sees nickname input on landing`).toBeVisible();
  await nicknameInput.fill(nickname);
  await page.getByTestId('enter-lobby-btn').click();
  await page.waitForURL('**/lobby', { timeout: 20_000 });
  await expect(page.getByTestId('lobby-user-summary')).toBeVisible({ timeout: 20_000 });
}

export async function createRoom(page: Page) {
  await expect(page.getByTestId('create-room-button')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('create-room-button').click();
  await page.waitForURL('**/game/**/prepare', { timeout: 20_000 });
  const currentUrl = page.url();
  const tableMatch = currentUrl.match(/\/game\/([^/]+)\/prepare/i);
  if (!tableMatch) {
    throw new Error(`无法解析房间 ID：${currentUrl}`);
  }
  const tableId = decodeURIComponent(tableMatch[1]);
  await expect(page.getByTestId('room-code')).toContainText(tableId, { timeout: 15_000 });
  const encodedId = encodeURIComponent(tableId);
  return {
    tableId,
    prepareUrl: urlFor(`/game/${encodedId}/prepare`),
    playUrl: urlFor(`/game/${encodedId}/play`)
  };
}

export async function joinPrepareDirect(page: Page, prepareUrl: string) {
  await page.goto(prepareUrl);
  await expect(page.getByTestId('prepare-player-list')).toBeVisible({ timeout: 20_000 });
}

export async function ensureCapacity(page: Page, target: number) {
  const valueLocator = page.getByTestId('capacity-value');
  const decrementButton = page.getByTestId('capacity-decrement');
  const incrementButton = page.getByTestId('capacity-increment');
  const saveButton = page.getByTestId('capacity-save-button');
  await Promise.all([
    expect(valueLocator).toBeVisible(),
    expect(decrementButton).toBeVisible(),
    expect(incrementButton).toBeVisible(),
    expect(saveButton).toBeVisible()
  ]);

  const readValue = async () => {
    const text = (await valueLocator.innerText()).trim();
    const parsed = Number.parseInt(text, 10);
    if (Number.isNaN(parsed)) {
      throw new Error(`无法解析座位配置值：${text}`);
    }
    return parsed;
  };

  const applyDelta = async (direction: 'increase' | 'decrease') => {
    const button = direction === 'increase' ? incrementButton : decrementButton;
    await button.click();
    await page.waitForTimeout(150);
  };

  let guard = 0;
  while ((await readValue()) !== target) {
    if (guard++ > 30) {
      throw new Error('调整桌面容量时超出尝试上限。');
    }
    const current = await readValue();
    if (current > target) {
      await applyDelta('decrease');
    } else {
      await applyDelta('increase');
    }
  }

  if (!(await saveButton.isDisabled())) {
    await saveButton.click();
    await expect(saveButton).toBeDisabled({ timeout: 10_000 });
  }
}

export async function readyUp(page: Page, label: string) {
  const readyButton = page.getByTestId('ready-button');
  await expect(readyButton, `${label} ready button renders`).toBeVisible({ timeout: 20_000 });
  await expect(readyButton, `${label} waits to become enabled`).toBeEnabled({ timeout: 20_000 });
  const currentLabel = (await readyButton.innerText()).trim();
  if (currentLabel.includes('已准备')) {
    return;
  }
  await readyButton.click();
  await expect(readyButton, `${label} toggles to prepared`).toHaveText(/已准备/, { timeout: 15_000 });
}

export async function startGame(page: Page) {
  const startButton = page.getByTestId('start-game-button');
  await expect(startButton).toBeVisible({ timeout: 15_000 });
  await expect(startButton).toBeEnabled({ timeout: 15_000 });
  await startButton.click();
}

export type PlayerSession = {
  label: string;
  nickname: string;
  context: BrowserContext;
  page: Page;
};