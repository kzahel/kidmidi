import { expect, type Page, test } from '@playwright/test';

for (const [name, viewport, touch] of [
  ['desktop', { width: 1280, height: 800 }, false],
  ['phone', { width: 320, height: 568 }, true],
] as const) {
  test.describe(name, () => {
    test.use({ viewport, hasTouch: touch });

    test('Progress exercises launch directly, including a paged pattern while already playing', async ({
      page,
    }) => {
      await page.goto('/');
      await openProgress(page);
      const first = page.getByRole('button', {
        name: 'Play 3 notes',
        exact: true,
      });
      await expect(first).toBeEnabled();
      await expect(
        first.getByLabel('Best: 0 of 3 stars', { exact: true }),
      ).toBeVisible();
      await fitted(page);
      await page.screenshot({ path: `test-results/progress-play-${name}.png` });
      if (touch) await first.tap();
      else {
        await first.focus();
        await page.keyboard.press('Enter');
      }
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(
        page.getByLabel('0 of 6 notes', { exact: true }),
      ).toContainText('3 notes');
      await expect(
        page
          .getByRole('region', { name: 'Find this', exact: true })
          .locator('svg'),
      ).toBeVisible();
      await openProgress(page);
      const scale = page.getByRole('button', {
        name: 'Play C scale up',
        exact: true,
      });
      for (let index = 0; index < 6 && !(await scale.count()); index++)
        await page.getByRole('button', { name: 'Next progress page' }).click();
      await fitted(page);
      if (touch) await scale.tap();
      else await scale.click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(
        page.getByLabel('0 of 16 notes', { exact: true }),
      ).toContainText('C scale up');
      await expect(
        page
          .getByRole('region', { name: 'Play this pattern', exact: true })
          .locator('svg'),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Play C4', exact: true }).click();
      await expect(
        page.getByLabel('1 of 16 notes', { exact: true }),
      ).toBeVisible();
      await page
        .getByRole('button', { name: 'Back to lessons', exact: true })
        .click();
      await expect(
        page.getByRole('button', { name: 'Scales', exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
    });

    test('outside taps dismiss shared modals; inside taps and drags keep them open', async ({
      page,
    }) => {
      await page.goto('/');
      for (const [openerName, title] of [
        ['Learners and rewards', 'Learners & rewards'],
        ['Wardrobe', 'Wardrobe'],
        ['Sound and settings', 'Sound and settings'],
      ]) {
        const opener = page.getByRole('button', {
          name: openerName,
          exact: true,
        });
        await opener.click();
        const dialog = page.getByRole('dialog', { name: title, exact: true });
        await expect(dialog).toBeVisible();
        await page.getByRole('heading', { name: title, exact: true }).click();
        await expect(dialog).toBeVisible();
        // Empty dialog padding is inside the modal, not part of the backdrop.
        const box = (await dialog.boundingBox())!;
        await page.mouse.click(box.x + box.width / 2, box.y + 3);
        await expect(dialog).toBeVisible();
        await page.mouse.move(box.x + box.width / 2, box.y + 3);
        await page.mouse.down();
        await page.mouse.move(3, 3);
        await page.mouse.up();
        await expect(dialog).toBeVisible();
        await page.mouse.move(3, 3);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2, box.y + 3);
        await page.mouse.up();
        await expect(dialog).toBeVisible();
        if (touch) await page.touchscreen.tap(3, 3);
        else await page.mouse.click(3, 3);
        await expect(dialog).toHaveCount(0);
        await expect(opener).toBeFocused();
      }
      // Closing the overlay must not pass the tap through to the piano below it.
      await page
        .getByRole('button', { name: 'Note hunt', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Garden: 3 notes', exact: true })
        .click();
      await page.getByRole('button', { name: 'Learners and rewards' }).click();
      if (touch) await page.touchscreen.tap(3, viewport.height - 3);
      else await page.mouse.click(3, viewport.height - 3);
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(
        page.getByLabel('0 of 6 notes', { exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Learners and rewards' }).click();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
    });
  });
}

async function openProgress(page: Page) {
  await page
    .getByRole('button', { name: 'Learners and rewards', exact: true })
    .click();
  await page.getByRole('button', { name: 'Progress', exact: true }).click();
}
async function fitted(page: Page) {
  await expect
    .poll(() =>
      page.getByRole('dialog').evaluate((dialog) => {
        const bounds = dialog.getBoundingClientRect();
        const cards = [
          ...dialog.querySelectorAll<HTMLButtonElement>('button[data-lesson]'),
        ];
        return (
          cards.length > 0 &&
          dialog.scrollWidth <= dialog.clientWidth &&
          dialog.scrollHeight <= dialog.clientHeight &&
          cards.every((card) => {
            const rect = card.getBoundingClientRect();
            return (
              rect.width >= 48 &&
              rect.height >= 48 &&
              rect.left >= bounds.left &&
              rect.right <= bounds.right &&
              rect.top >= bounds.top &&
              rect.bottom <= bounds.bottom &&
              [...card.children].every((child) => {
                const content = child.getBoundingClientRect();
                return (
                  content.left >= rect.left &&
                  content.right <= rect.right &&
                  content.top >= rect.top &&
                  content.bottom <= rect.bottom
                );
              })
            );
          })
        );
      }),
    )
    .toBe(true);
}
