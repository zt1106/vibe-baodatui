import { expect, test } from './coverageTest';

test.describe('CardRow selection layout', () => {
  test('reverts to baseline position after deselect', async ({ page }) => {
    await page.goto('/card-row-test');
    const firstCard = page.getByRole('option').first();
    await expect(firstCard).toBeVisible();

    await page.waitForTimeout(600);
    const initialBox = await firstCard.boundingBox();
    expect(initialBox).toBeTruthy();

    await firstCard.click({ force: true });
    await page.waitForTimeout(200);
    await firstCard.click({ force: true });
    await page.waitForTimeout(800);

    await expect(firstCard).toHaveAttribute('aria-selected', 'false');
    const finalBox = await firstCard.boundingBox();
    expect(finalBox).toBeTruthy();

    const deltaY = Math.abs((finalBox?.y ?? 0) - (initialBox?.y ?? 0));
    expect(deltaY).toBeLessThan(3);
  });

  test('allows selecting multiple cards by clicking them sequentially', async ({ page }) => {
    await page.goto('/card-row-test');
    const multiRow = page.getByTestId('card-row-multi-select');
    const multiCards = multiRow.getByRole('option');
    const cardCount = await multiCards.count();
    expect(cardCount).toBeGreaterThan(1);

    const firstCard = multiCards.first();
    const lastCard = multiCards.last();

    await page.waitForTimeout(600);
    await firstCard.click();
    await expect(firstCard).toHaveAttribute('aria-selected', 'true');

    await lastCard.click();
    await expect(firstCard).toHaveAttribute('aria-selected', 'true');
    await expect(lastCard).toHaveAttribute('aria-selected', 'true');

    await lastCard.click();
    await expect(lastCard).toHaveAttribute('aria-selected', 'false');
    await expect(firstCard).toHaveAttribute('aria-selected', 'true');
  });
});
