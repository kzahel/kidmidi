import { expect, type Page, test } from '@playwright/test';
import { gardenGraduate } from './fixtures/journey';

test('back to lessons stays prominent on small screens and returns to the chosen lesson group', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Note hunt', exact: true }).click();
  await page.getByRole('button', { name: 'Patterns', exact: true }).click();
  await page
    .getByRole('button', { name: 'River: Step down', exact: true })
    .click();
  for (const viewport of [
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    const back = page.getByRole('button', {
      name: 'Back to lessons',
      exact: true,
    });
    await expect(back).toBeVisible();
    await expect(back).toContainText('← Lessons');
    expect(
      await back.evaluate((button) => {
        const rect = button.getBoundingClientRect();
        return (
          rect.width >= 48 &&
          rect.height >= 48 &&
          rect.top >= 0 &&
          rect.right <= innerWidth
        );
      }),
    ).toBe(true);
    await expect(
      page.getByRole('button', { name: 'Home', exact: true }),
    ).toBeVisible();
  }
  await page
    .getByRole('button', { name: 'Back to lessons', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Patterns', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('heading', { name: 'Lessons', exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/lessons-return-landscape.png' });
});

test('reward previews cost nothing, accessories are wearable, and the fitted collection survives reload', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Note hunt', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Learners and rewards' }).click();
  await page.getByRole('button', { name: 'Dress up', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Get Party bow for 12 hearts' }),
  ).toBeDisabled();
  await expect(page.getByRole('dialog').getByRole('status')).toContainText(
    '12 more hearts',
  );
  await page
    .getByRole('button', { name: 'Preview Star charm', exact: true })
    .click();
  await expect(
    page
      .getByLabel('Outfit preview')
      .getByRole('img', { name: 'Fox friend with star charm', exact: true }),
  ).toBeVisible();
  expect(await purchases(page)).toHaveLength(0);
  await page.keyboard.press('Escape');

  // A completed Garden funds a crown and its three gems fund the puppy.
  await page.evaluate(async (state) => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const req = indexedDB.open('kidmidi-learners', 1);
      req.onsuccess = () => resolve(req.result);
    });
    const tx = db.transaction(
      ['learners', 'encounters', 'settings'],
      'readwrite',
    );
    const done = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
    tx.objectStore('learners').clear();
    tx.objectStore('learners').put(state.learner);
    tx.objectStore('settings').put(state.learner.id, 'selected');
    for (const event of state.encounters)
      tx.objectStore('encounters').put(event);
    await done;
    db.close();
  }, gardenGraduate());
  await page.reload();
  await page.getByRole('button', { name: 'Learners and rewards' }).click();
  await page.getByRole('button', { name: 'Dress up', exact: true }).click();
  await page.getByRole('button', { name: 'Next rewards', exact: true }).click();
  await expect(
    page
      .getByLabel('Outfit preview')
      .getByRole('img', { name: 'Fox friend with cosy scarf', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Preview Daisy crown', exact: true })
    .click();
  await expect(
    page
      .getByLabel('Outfit preview')
      .getByRole('img', { name: 'Fox friend with daisy crown', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Next rewards', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Get Golden crown for 48 hearts' }),
  ).toBeEnabled();
  expect(await purchases(page)).toHaveLength(0);
  await page
    .getByRole('button', { name: 'Get Golden crown for 48 hearts' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Golden crown equipped' }),
  ).toBeDisabled();
  await expect(
    page.getByText('3 badges · ♥ 48 · 💎 3', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Friends', exact: true }).click();
  await page.getByRole('button', { name: 'Next rewards', exact: true }).click();
  await page
    .getByRole('button', { name: 'Preview Puppy friend', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Get Puppy friend for 3 gems' })
    .click();
  await expect(
    page.getByLabel('Outfit preview').getByRole('img', {
      name: 'Puppy friend with golden crown',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Puppy friend equipped' }),
  ).toBeDisabled();
  expect(await purchases(page)).toHaveLength(2);
  await expect(
    page.getByText('3 badges · ♥ 48 · 💎 0', { exact: true }),
  ).toBeVisible();

  for (const [name, viewport] of [
    ['desktop', { width: 1280, height: 800 }],
    ['tablet', { width: 1024, height: 768 }],
    ['tablet-portrait', { width: 768, height: 1024 }],
    ['phone', { width: 390, height: 844 }],
    ['small-phone', { width: 320, height: 568 }],
    ['landscape', { width: 844, height: 390 }],
  ] as const) {
    await page.setViewportSize(viewport);
    await fitted(page);
    await page.screenshot({
      path: `test-results/rewards-${name}.png`,
      animations: 'disabled',
    });
    await page.getByRole('button', { name: 'Dress up', exact: true }).click();
    await fitted(page);
    await page.screenshot({
      path: `test-results/charms-${name}.png`,
      animations: 'disabled',
    });
    for (const tab of ['Learners', 'Progress', 'Rewards']) {
      await page.getByRole('button', { name: tab, exact: true }).click();
      await fitted(page);
      if (tab === 'Progress') {
        await page
          .getByRole('combobox', { name: 'Progress view' })
          .selectOption('badges');
        await fitted(page);
        await page
          .getByRole('combobox', { name: 'Progress view' })
          .selectOption('about');
        await fitted(page);
      }
    }
  }
  await page.keyboard.press('Escape');
  await page.reload();
  await page.getByRole('button', { name: 'Learners and rewards' }).click();
  await expect(
    page.getByLabel('Outfit preview').getByRole('img', {
      name: 'Puppy friend with golden crown',
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Dress up', exact: true }).click();
  await page
    .getByRole('button', { name: 'Take off charm', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Choose Golden crown', exact: true }),
  ).toBeEnabled();
  await page
    .getByRole('button', { name: 'Choose Golden crown', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Golden crown equipped' }),
  ).toBeDisabled();
  expect(await purchases(page)).toHaveLength(2);
});

async function fitted(page: Page) {
  await expect
    .poll(() =>
      page.getByRole('dialog').evaluate((dialog) => {
        const bounds = dialog.getBoundingClientRect();
        return (
          [...dialog.querySelectorAll('button, article')].every((node) => {
            const box = node.getBoundingClientRect();
            return [...node.children].every((child) => {
              const rect = child.getBoundingClientRect();
              return (
                !rect.width ||
                (rect.left >= box.left - 1 &&
                  rect.right <= box.right + 1 &&
                  rect.top >= box.top - 1 &&
                  rect.bottom <= box.bottom + 1)
              );
            });
          }) &&
          dialog.scrollHeight <= dialog.clientHeight + 1 &&
          dialog.scrollWidth <= dialog.clientWidth + 1 &&
          bounds.top >= 0 &&
          bounds.bottom <= innerHeight &&
          [
            ...dialog.querySelectorAll(
              'button, input, select, h3, [aria-label="Outfit preview"], [role="status"]',
            ),
          ].every((node) => {
            const rect = node.getBoundingClientRect();
            return (
              !rect.width ||
              (rect.left >= bounds.left &&
                rect.right <= bounds.right &&
                rect.top >= bounds.top &&
                rect.bottom <= bounds.bottom &&
                (!(node instanceof HTMLButtonElement) ||
                  (rect.width >= 48 && rect.height >= 48)))
            );
          })
        );
      }),
    )
    .toBe(true);
}
async function purchases(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const req = indexedDB.open('kidmidi-learners', 1);
      req.onsuccess = () => resolve(req.result);
    });
    const result = await new Promise<unknown[]>((resolve) => {
      const req = db.transaction('purchases').objectStore('purchases').getAll();
      req.onsuccess = () => resolve(req.result);
    });
    db.close();
    return result;
  });
}
