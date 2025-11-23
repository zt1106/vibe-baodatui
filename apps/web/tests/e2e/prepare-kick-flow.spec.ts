import { expect, test } from './coverageTest';

import { createRoom, joinPrepareDirect, loginAndEnterLobby } from './helpers';

test.describe('Prepare room moderation', () => {
  test('host can remove a player and they are returned to the lobby', async ({ browser }) => {
    const hostContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const guestContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    const guestNickname = 'Guest Runner';

    try {
      await loginAndEnterLobby(hostPage, 'Host Judge', 'Host');
      await loginAndEnterLobby(guestPage, guestNickname, 'Guest');

      const createdRoom = await createRoom(hostPage);
      await joinPrepareDirect(guestPage, createdRoom.prepareUrl);

      await expect(hostPage.getByTestId('prepare-player-list')).toContainText(guestNickname, {
        timeout: 20_000
      });

      const guestCard = hostPage
        .getByTestId('prepare-player-list')
        .locator('article', { hasText: guestNickname });
      await expect(guestCard).toBeVisible({ timeout: 20_000 });
      await guestCard.getByRole('button', { name: '移出' }).click();

      await expect(hostPage.getByTestId('prepare-player-list')).not.toContainText(guestNickname, {
        timeout: 20_000
      });

      await guestPage.waitForURL('**/lobby', { timeout: 20_000 });
      await expect(guestPage.getByTestId('lobby-user-summary')).toBeVisible({ timeout: 20_000 });
    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });
});
