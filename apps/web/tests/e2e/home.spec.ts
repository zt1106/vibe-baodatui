import { test, expect } from '@playwright/test';

test.describe('Home hero onboarding', () => {
  test('enters the lobby with a trimmed nickname', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('img', { name: 'Stacked poker chip logo' })).toBeVisible();
    const nicknameInput = page.getByTestId('nickname-input');
    await expect(nicknameInput).toBeVisible();

    await nicknameInput.fill('  Alice  ');
    await page.getByTestId('enter-lobby-btn').click();

    await expect(page).toHaveURL(/\/lobby$/);
    await expect(page.getByTestId('nickname-input')).toHaveValue('Alice');
  });

  test('generates a curated nickname and persists it on reload', async ({ page }) => {
    await page.addInitScript(() => {
      Math.random = () => 0;
    });

    await page.goto('/');

    const nicknameInput = page.getByTestId('nickname-input');
    await nicknameInput.fill('');
    await page.getByTestId('random-nickname-btn').click();

    await expect(nicknameInput).toHaveValue('Li Wei');

    await page.reload();
    await expect(page.getByTestId('nickname-input')).toHaveValue('Li Wei');
  });

  test('falls back to Guest when no nickname is provided', async ({ page }) => {
    await page.goto('/');

    const nicknameInput = page.getByTestId('nickname-input');
    await nicknameInput.fill('   ');
    await page.getByTestId('enter-lobby-btn').click();

    await expect(page).toHaveURL(/\/lobby$/);
    await expect(page.getByTestId('nickname-input')).toHaveValue('Guest');
  });
});
