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
    await expect(page.getByTestId('lobby-login-status')).toContainText('Alice');

    await page.goto('/');
    const homeInput = page.getByTestId('nickname-input');
    await expect(homeInput).toHaveValue('Logged in as Alice');
    await expect(homeInput).toBeDisabled();
    await expect(page.getByTestId('logout-btn')).toBeVisible();
    await expect(page.locator('[data-testid="random-nickname-btn"]')).toHaveCount(0);
  });

  test('falls back to Guest when no nickname is provided', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('nickname-input').fill('   ');
    await page.getByTestId('enter-lobby-btn').click();

    await expect(page).toHaveURL(/\/lobby$/);
    await expect(page.getByTestId('lobby-login-status')).toContainText('Guest');

    await page.goto('/');
    const homeInput = page.getByTestId('nickname-input');
    await expect(homeInput).toBeDisabled();
    await expect(homeInput).toHaveValue('Logged in as Guest');
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
