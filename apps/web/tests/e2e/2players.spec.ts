import { test, expect } from '@playwright/test';

test('two players maintain independent login sessions', async ({ browser, page }) => {
  const pageA = page;
  const pageB = await browser.newPage();

  await pageA.goto('/');
  await pageB.goto('/');

  await pageA.getByTestId('nickname-input').fill('Alice');
  await pageA.getByTestId('enter-lobby-btn').click();
  await expect(pageA).toHaveURL(/\/lobby$/);
  await expect(pageA.getByTestId('lobby-login-status')).toContainText('Alice');

  await pageB.getByTestId('nickname-input').fill('Bob');
  await pageB.getByTestId('enter-lobby-btn').click();
  await expect(pageB).toHaveURL(/\/lobby$/);
  await expect(pageB.getByTestId('lobby-login-status')).toContainText('Bob');

  await pageA.goto('/');
  await expect(pageA.getByTestId('login-status')).toContainText('Alice');

  await pageB.goto('/');
  await expect(pageB.getByTestId('login-status')).toContainText('Bob');
});
