import { test, expect } from '@playwright/test';

test.describe('Home authentication flow', () => {
  test('logs in and shows status across pages', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('img', { name: '抱大腿 logo' })).toBeVisible();
    const nicknameInput = page.getByTestId('nickname-input');
    await expect(page.getByTestId('random-nickname-btn')).toBeVisible();
    await nicknameInput.fill('  Alice  ');

    await page.getByTestId('enter-lobby-btn').click();
    await expect(page).toHaveURL(/\/lobby$/);
    await expect(page.getByTestId('lobby-user-summary')).toContainText('Alice');
    await expect(page.getByTestId('lobby-room-card').first()).toBeVisible();
    await expect(page.getByTestId('lobby-connection-indicator')).toBeVisible();

    await page.goto('/');
    const homeInput = page.getByTestId('nickname-input');
    await expect(homeInput).toHaveValue('Logged in as Alice');
    await expect(homeInput).toBeDisabled();
    await expect(page.getByTestId('logout-btn')).toBeVisible();
    await expect(page.locator('[data-testid="random-nickname-btn"]')).toHaveCount(0);
  });

  test('assigns a random nickname when no nickname is provided', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('nickname-input').fill('   ');
    await page.getByTestId('enter-lobby-btn').click();

    await expect(page).toHaveURL(/\/lobby$/);
    const loginBadge = page.getByTestId('lobby-user-summary').getByText(/^已登录：/);
    const loginBadgeText = (await loginBadge.textContent()) ?? '';
    const assignedNickname = loginBadgeText.replace('已登录：', '').trim();
    expect(assignedNickname.length).toBeGreaterThan(0);
    expect(assignedNickname).toMatch(/^[A-Za-z]+ [A-Za-z]+$/);
    await expect(page.getByTestId('lobby-room-card').first()).toBeVisible();
    await expect(page.getByTestId('lobby-connection-indicator')).toBeVisible();

    await page.goto('/');
    const homeInput = page.getByTestId('nickname-input');
    await expect(homeInput).toBeDisabled();
    await expect(homeInput).toHaveValue(`Logged in as ${assignedNickname}`);
    await expect(page.getByTestId('logout-btn')).toBeVisible();
  });

  test('logout clears session state', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('nickname-input').fill('Bob');
    await page.getByTestId('enter-lobby-btn').click();
    await expect(page).toHaveURL(/\/lobby$/);

    await page.goto('/');
    await page.getByTestId('logout-btn').click();

    await expect(page.locator('[data-testid="logout-btn"]')).toHaveCount(0);
    const homeInput = page.getByTestId('nickname-input');
    await expect(homeInput).not.toBeDisabled();
    await expect(homeInput).toHaveValue('');
    await expect(page.getByTestId('random-nickname-btn')).toBeVisible();
  });
});
