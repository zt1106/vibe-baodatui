import { test, expect } from '@playwright/test';

test('two players maintain independent login sessions', async ({ browser, page }) => {
  const pageA = page;
  const pageB = await browser.newPage();

  await pageA.goto('/');
  await pageB.goto('/');

  await pageA.getByTestId('nickname-input').fill('Alice');
  await pageA.getByTestId('enter-lobby-btn').click();
  await expect(pageA).toHaveURL(/\/lobby$/);
  await expect(pageA.getByTestId('lobby-user-summary')).toContainText('Alice');
  await expect(pageA.getByTestId('lobby-room-card').first()).toBeVisible();
  await expect(pageA.getByTestId('lobby-connection-indicator')).toBeVisible();

  await pageB.getByTestId('nickname-input').fill('Bob');
  await pageB.getByTestId('enter-lobby-btn').click();
  await expect(pageB).toHaveURL(/\/lobby$/);
  await expect(pageB.getByTestId('lobby-user-summary')).toContainText('Bob');
  await expect(pageB.getByTestId('lobby-room-card').first()).toBeVisible();
  await expect(pageB.getByTestId('lobby-connection-indicator')).toBeVisible();

  await pageA.goto('/');
  await expect(pageA.getByTestId('nickname-input')).toHaveValue('Logged in as Alice');

  await pageB.goto('/');
  await expect(pageB.getByTestId('nickname-input')).toHaveValue('Logged in as Bob');
});
