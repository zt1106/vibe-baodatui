
import { test, expect } from '@playwright/test';

test('two players can join and bet', async ({ browser, page }) => {
  const pageA = page;
  const pageB = await browser.newPage();

  await pageA.goto('/');
  await pageB.goto('/');

  await pageA.getByTestId('nickname-input').fill('Alice');
  await pageA.getByTestId('enter-lobby-btn').click();
  await expect(pageA).toHaveURL(/\/lobby$/);
  await pageA.getByTestId('nickname-input').fill('Alice');
  await pageA.getByTestId('join-btn').click();

  await pageB.getByTestId('nickname-input').fill('Bob');
  await pageB.getByTestId('enter-lobby-btn').click();
  await expect(pageB).toHaveURL(/\/lobby$/);
  await pageB.getByTestId('nickname-input').fill('Bob');
  await pageB.getByTestId('join-btn').click();

  await expect(pageA.getByTestId('seats')).toContainText('Alice');
  await expect(pageA.getByTestId('seats')).toContainText('Bob');

  await pageA.getByTestId('bet-input').fill('10');
  await pageA.getByTestId('bet-btn').click();
  await expect(pageB.getByTestId('pot')).toHaveText('$10');

  await pageB.getByTestId('bet-input').fill('10');
  await pageB.getByTestId('bet-btn').click();
  await expect(pageA.getByTestId('pot')).toHaveText('$20');
});
