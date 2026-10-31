import { expect, type Page, test } from '@playwright/test';
import { journeyProgress, lessons } from '../src/curriculum';
import { type LearnerSnapshot, progress } from '../src/learners';
import { finishLesson, newLearner } from './fixtures/journey';

const layouts = [
  ['desktop', { width: 1280, height: 800 }],
  ['phone', { width: 390, height: 844 }],
  ['small-phone', { width: 320, height: 568 }],
  ['landscape', { width: 844, height: 390 }],
] as const;

test('picture navigation and songs fit; listening is separate from playing and cancels on navigation', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/');
  for (const [name, size] of layouts) {
    await page.setViewportSize(size);
    await fits(page);
    await page.screenshot({ path: `test-results/picture-home-${name}.png` });
  }
  await page.getByRole('button', { name: 'Play a song', exact: true }).click();
  for (const [name, size] of layouts) {
    await page.setViewportSize(size);
    await fits(page);
    await page.screenshot({ path: `test-results/picture-songs-${name}.png` });
  }
  await page
    .getByRole('button', { name: 'Listen to Twinkle, Twinkle', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Stop listening to Twinkle, Twinkle' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page
    .getByRole('button', { name: 'Listen to Hot Cross Buns', exact: true })
    .click();
  await expect(
    page.getByRole('button', {
      name: 'Listen to Twinkle, Twinkle',
      exact: true,
    }),
  ).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('a');
  await expect(
    page.getByRole('button', { name: /^Stop listening/ }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Listen to Hot Cross Buns', exact: true })
    .click();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.getByRole('button', { name: 'Play a song', exact: true }).click();
  await expect(
    page.getByRole('button', { name: /^Stop listening/ }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Twinkle, Twinkle', exact: true })
    .click();
  await expect(
    page.getByRole('img', { name: /^Sheet music: 60, 60, 67/ }).first(),
  ).toBeVisible();
});

test('backdrops preview without spending, buy once, follow every activity and remain local to a learner', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Wardrobe', exact: true }),
  ).toBeEnabled();
  const funded = lessons.reduce(
    (state, lesson) => finishLesson(state, lesson.id),
    newLearner(),
  );
  await seed(page, funded);
  await page
    .getByRole('button', { name: 'Open wardrobe', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Wardrobe', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Learners', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Dress up', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Places', exact: true }).click();
  const stage = page.getByLabel('Outfit preview');
  for (const [id, name, price] of [
    ['treehouse-scene', 'Treehouse', '60 hearts'],
    ['moon-scene', 'Moon garden', '3 gems'],
    ['ocean-scene', 'Underwater', '4 gems'],
    ['castle-scene', 'Spooky castle', '5 gems'],
  ]) {
    await page
      .getByRole('button', { name: `Preview ${name}`, exact: true })
      .click();
    await expect(stage.locator(`[data-backdrop="${id}"]`)).toHaveCount(1);
    expect((await saved(page)).purchases).toHaveLength(0);
    await page.screenshot({ path: `test-results/scene-${id}.png` });
    await expect(
      page.getByRole('button', {
        name: `Get ${name} for ${price}`,
        exact: true,
      }),
    ).toBeEnabled();
  }
  await page
    .getByRole('button', { name: 'Get Spooky castle for 5 gems', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Spooky castle equipped', exact: true }),
  ).toBeDisabled();
  const state = await saved(page);
  expect(state.learner.backdrop).toBe('castle-scene');
  expect(state.purchases).toHaveLength(1);
  expect(progress(state)).toEqual(progress(funded));
  expect(journeyProgress(state).gemBalance).toBe(
    journeyProgress(funded).gemBalance - 5,
  );
  for (const [name, size] of layouts) {
    await page.setViewportSize(size);
    await fits(page);
    await page.screenshot({ path: `test-results/picture-shop-${name}.png` });
  }
  await page
    .getByRole('button', { name: 'Preview Meadow', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Choose Meadow', exact: true })
    .click();
  expect((await saved(page)).purchases).toHaveLength(1);
  await page
    .getByRole('button', { name: 'Preview Spooky castle', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Choose Spooky castle', exact: true })
    .click();
  await expect
    .poll(async () => (await saved(page)).learner.backdrop)
    .toBe('castle-scene');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(
    page
      .getByRole('region', { name: 'Activities', exact: true })
      .locator('[data-backdrop="castle-scene"]'),
  ).toHaveCount(1);
  await page.getByRole('button', { name: 'Note hunt', exact: true }).click();
  for (const [name, size] of layouts) {
    await page.setViewportSize(size);
    await fits(page);
    await expect(page.locator('[data-lesson-art="find-three"]')).toBeVisible();
    await page.screenshot({ path: `test-results/picture-lessons-${name}.png` });
  }
  await page
    .getByRole('button', { name: 'Garden: 3 notes', exact: true })
    .click();
  const buddy = page.getByRole('complementary', {
    name: 'Your piano companion',
  });
  await expect(buddy.locator('[data-backdrop="castle-scene"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.getByRole('button', { name: 'Just explore', exact: true }).click();
  await expect(buddy.locator('[data-backdrop="castle-scene"]')).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Learners and rewards' }).click();
  await page.getByRole('button', { name: 'Learners', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'New learner name', exact: true })
    .fill('Sibling');
  await page.getByRole('button', { name: 'Add learner', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Sibling', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(buddy.locator('[data-backdrop="castle-scene"]')).toHaveCount(0);
});

test('spoken help uses an installed voice only and stops when music begins', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const log: string[] = [];
    (window as unknown as { speechLog: string[] }).speechLog = log;
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: class {
        text: string;
        constructor(text: string) {
          this.text = text;
        }
      },
    });
    const synth = new EventTarget();
    Object.defineProperty(window, 'speechSynthesis', {
      value: Object.assign(synth, {
        getVoices: () => [
          { name: 'Network', lang: 'en-US', localService: false },
          { name: 'Installed', lang: 'en-GB', localService: true },
        ],
        speak: (utterance: SpeechSynthesisUtterance) =>
          log.push(`${utterance.voice?.name}: ${utterance.text}`),
        cancel: () => log.push('cancel'),
      }),
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Hear help', exact: true }).click();
  expect(
    await page.evaluate(() =>
      (window as unknown as { speechLog: string[] }).speechLog.at(-1),
    ),
  ).toMatch(/^Installed: Choose/);
  await page.getByRole('button', { name: 'Play a song', exact: true }).click();
  await page
    .getByRole('button', { name: 'Listen to Twinkle, Twinkle', exact: true })
    .click();
  await page.getByRole('button', { name: 'Hear help', exact: true }).click();
  await expect(
    page.getByRole('button', { name: /^Stop listening/ }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Twinkle, Twinkle', exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      (window as unknown as { speechLog: string[] }).speechLog.at(-1),
    ),
  ).toBe('cancel');
});

async function fits(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const root =
          document.querySelector('dialog[open]') ??
          document.querySelector('main')!;
        return (
          root.scrollHeight <= root.clientHeight + 1 &&
          root.scrollWidth <= root.clientWidth + 1 &&
          [...root.querySelectorAll('button')]
            .filter(
              (button) =>
                !button.closest(
                  '[aria-label$="gallery"], [aria-label="Shop filters"]',
                ),
            )
            .every((button) => {
              const r = button.getBoundingClientRect();
              return (
                !r.width ||
                (r.width >= 48 &&
                  r.height >= 48 &&
                  r.left >= 0 &&
                  r.right <= innerWidth + 1 &&
                  r.top >= 0 &&
                  r.bottom <= innerHeight + 1)
              );
            })
        );
      }),
    )
    .toBe(true);
}
async function seed(page: Page, state: LearnerSnapshot) {
  await expect(
    page.getByRole('button', { name: 'Wardrobe', exact: true }),
  ).toBeEnabled();
  await page.evaluate(async (state) => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open('kidmidi-learners', 1);
      r.onsuccess = () => resolve(r.result);
    });
    const tx = db.transaction(
      ['learners', 'encounters', 'purchases', 'settings'],
      'readwrite',
    );
    const done = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
    tx.objectStore('learners').clear();
    tx.objectStore('learners').put(state.learner);
    tx.objectStore('settings').put(state.learner.id, 'selected');
    tx.objectStore('encounters').clear();
    tx.objectStore('purchases').clear();
    for (const event of state.encounters)
      tx.objectStore('encounters').put(event);
    for (const purchase of state.purchases)
      tx.objectStore('purchases').put(purchase);
    await done;
    db.close();
  }, state);
  await page.reload();
}
async function saved(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open('kidmidi-learners', 1);
      r.onsuccess = () => resolve(r.result);
    });
    const tx = db.transaction(['learners', 'encounters', 'purchases']);
    const all = <T>(name: string) =>
      new Promise<T[]>((resolve) => {
        const r = tx.objectStore(name).getAll();
        r.onsuccess = () => resolve(r.result);
      });
    const [learners, encounters, purchases] = await Promise.all([
      all<LearnerSnapshot['learner']>('learners'),
      all<LearnerSnapshot['encounters'][number]>('encounters'),
      all<LearnerSnapshot['purchases'][number]>('purchases'),
    ]);
    db.close();
    return { learner: learners[0], encounters, purchases };
  });
}
