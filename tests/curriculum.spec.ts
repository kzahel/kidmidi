import { expect, type Page, test } from '@playwright/test';
import { type LearnerSnapshot, withPurchase } from '../src/learners';
import { finishLesson, gardenGraduate, newLearner } from './fixtures/journey';

test('picture-led worlds fit desktop and phones; lessons earn badges, open a gate and buy a gem pet', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Note hunt', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Garden: 5 notes', exact: true }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'World 2: Treehouse', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Open Treehouse for 60 hearts' }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'World 3: Cave, coming soon', exact: true })
    .click();
  await expect(page.getByText('Soon', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'World 1: Garden', exact: true })
    .click();
  for (const [name, viewport] of [
    ['desktop', { width: 1280, height: 800 }],
    ['phone', { width: 390, height: 844 }],
    ['landscape', { width: 844, height: 390 }],
  ] as const) {
    await page.setViewportSize(viewport);
    await fits(
      page,
      '[class*="__worlds__"] button, [class*="__lessons__"] button',
    );
    await page.screenshot({ path: `test-results/curriculum-map-${name}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [name, rounds] of [
    ['3 notes', 6],
    ['5 notes', 10],
    ['8 notes', 16],
  ] as const) {
    await page
      .getByRole('button', { name: `Garden: ${name}`, exact: true })
      .click();
    await playLesson(page, rounds, 3);
    await expect(
      page.getByRole('region', { name: 'Lesson complete' }),
    ).toContainText('💎 +1');
    await page
      .getByRole('button', { name: 'Learning map', exact: true })
      .click();
    await expect(
      page.getByRole('button', {
        name: `Garden: ${name}, badge earned`,
        exact: true,
      }),
    ).toBeEnabled();
  }
  await expect(
    page.getByLabel('96 hearts, 3 gems', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'World 2: Treehouse', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Open Treehouse for 60 hearts', exact: true })
    .click();
  await expect(
    page.getByLabel('36 hearts, 3 gems', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Treehouse: 3 notes', exact: true })
    .click();
  await expect(target(page).locator('svg')).toBeVisible();
  await expect(target(page)).not.toContainText(/[A-G]4/);
  for (const [name, viewport] of [
    ['desktop', { width: 1280, height: 800 }],
    ['landscape', { width: 844, height: 390 }],
    ['phone', { width: 390, height: 844 }],
  ] as const) {
    await page.setViewportSize(viewport);
    await fits(page, '[class*="__hunt-card__"], [class*="__keyboard__"]');
    await expect
      .poll(() =>
        target(page).evaluate((card) => {
          const bounds = card.getBoundingClientRect();
          return [...card.children].every((child) => {
            const rect = child.getBoundingClientRect();
            return rect.top >= bounds.top && rect.bottom <= bounds.bottom + 1;
          });
        }),
      )
      .toBe(true);
    await page.screenshot({ path: `test-results/curriculum-read-${name}.png` });
  }
  await playLesson(page, 6, 6, true);
  await expect(
    page.getByRole('region', { name: 'Lesson complete' }),
  ).not.toContainText('💎');
  await page.getByRole('button', { name: 'Play lesson again' }).click();
  await playLesson(page, 6, 6);
  await expect(
    page.getByRole('region', { name: 'Lesson complete' }),
  ).toContainText('💎 +2');
  await page.screenshot({ path: 'test-results/curriculum-result-phone.png' });
  await fits(page, '[aria-label="Lesson complete"], [class*="__keyboard__"]');
  await page.getByRole('button', { name: 'Play lesson again' }).click();
  await playLesson(page, 6, 6);
  await expect(
    page.getByRole('region', { name: 'Lesson complete' }),
  ).not.toContainText('💎');
  await page.getByRole('button', { name: 'Learners and rewards' }).click();
  await page
    .getByRole('button', { name: 'Get Puppy friend for 3 gems', exact: true })
    .click();
  await expect(
    page.getByText('World 2 · ♥ 144 · 💎 2', { exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.reload();
  await page.getByRole('button', { name: 'Note hunt', exact: true }).click();
  await page
    .getByRole('button', { name: 'World 2: Treehouse', exact: true })
    .click();
  await expect(
    page.getByRole('button', {
      name: 'Treehouse: 3 notes, badge earned',
      exact: true,
    }),
  ).toBeEnabled();
  await expect(
    page.getByLabel('144 hearts, 2 gems', { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('button', { name: 'Learners and rewards' })
      .getByRole('img', { name: 'Puppy friend' }),
  ).toBeVisible();
});

test('help and guesses survive settings; switching learner discards the old lesson and its callbacks', async ({
  page,
}) => {
  await page.clock.install();
  await seed(page, withPurchase(gardenGraduate(), 'gate-treehouse', 'gate', 0));
  await page.getByRole('button', { name: 'Note hunt', exact: true }).click();
  await page
    .getByRole('button', { name: 'World 2: Treehouse', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Treehouse: 3 notes', exact: true })
    .click();
  const note = await pitch(page);
  await page.getByRole('button', { name: 'Show note name' }).click();
  await page.getByRole('button', { name: 'Play D4', exact: true }).click();
  await page.getByRole('button', { name: 'Sound and settings' }).click();
  await page.clock.fastForward(60000);
  await page
    .getByRole('button', { name: 'Close sound and settings', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Show note name' }),
  ).toHaveCount(0);
  expect(await pitch(page)).toBe(note);
  await playPitch(page, note);
  await expect(
    page.getByLabel('4 hearts earned', { exact: true }),
  ).toBeVisible();
  await expect
    .poll(
      async () =>
        (await saved(page)).encounters.filter(
          (event) => event.lesson?.id === 'read-three',
        ).length,
    )
    .toBe(1);
  const encounter = (await saved(page)).encounters.find(
    (event) => event.lesson?.id === 'read-three',
  )!;
  expect(encounter.assistance).toBe('note-name');
  expect(encounter.guesses).toEqual([62, note]);
  expect(encounter.durationMs).toBeNull();
  await page.getByRole('button', { name: 'Learners and rewards' }).click();
  await page.getByRole('textbox', { name: 'New learner name' }).fill('Sibling');
  await page.getByRole('button', { name: 'Add learner', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Sibling', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.clock.fastForward(3000);
  await expect(page.getByRole('combobox', { name: 'Note range' })).toHaveValue(
    'adaptive',
  );
  await expect(target(page)).toContainText('C4');
  await expect(page.getByLabel('0 points', { exact: true })).toBeVisible();
  const sibling = await saved(page);
  expect(sibling.encounters).toHaveLength(0);
  expect(sibling.learner.badges ?? []).toHaveLength(0);
});

test('optional fluency waits indefinitely and never shows a countdown; quick accurate finds earn its badge', async ({
  page,
}) => {
  await page.clock.install();
  let state = withPurchase(gardenGraduate(), 'gate-treehouse', 'gate', 0);
  for (const id of ['read-three', 'read-five', 'read-octave'])
    state = finishLesson(state, id);
  await seed(page, state);
  await page.getByRole('button', { name: 'Note hunt', exact: true }).click();
  await page
    .getByRole('button', { name: 'World 2: Treehouse', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Treehouse: Quick', exact: true })
    .click();
  await playLesson(page, 16, 9, false, 60000);
  await expect(
    page.getByRole('region', { name: 'Lesson complete' }),
  ).not.toContainText('💎');
  expect(
    (await saved(page)).learner.badges?.some(
      (badge) => badge.lessonId === 'fluent-octave',
    ),
  ).toBe(false);
  await page.getByRole('button', { name: 'Play lesson again' }).click();
  await playLesson(page, 16, 9, false, 1000);
  await expect(
    page.getByRole('region', { name: 'Lesson complete' }),
  ).toContainText('💎 +2');
  expect(
    (await saved(page)).learner.badges?.some(
      (badge) => badge.lessonId === 'fluent-octave',
    ),
  ).toBe(true);
});

test('a failed final badge save blocks the gate until retry and never doubles gems', async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    let fail = true;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === 'learners' && args[0].badges?.length === 3 && fail) {
        fail = false;
        throw new Error('Test badge save interruption');
      }
      return put.apply(this, args);
    };
  });
  const state = finishLesson(
    finishLesson(newLearner(), 'find-three'),
    'find-five',
  );
  await seed(page, state);
  await page.getByRole('button', { name: 'Note hunt', exact: true }).click();
  await page
    .getByRole('button', { name: 'Garden: 8 notes', exact: true })
    .click();
  await playLesson(page, 16, 3);
  await expect(page.getByRole('alert')).toContainText(
    'Test badge save interruption',
  );
  await page.getByRole('button', { name: 'Learning map', exact: true }).click();
  await page
    .getByRole('button', { name: 'World 2: Treehouse', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Open Treehouse for 60 hearts' }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Retry saving', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Open Treehouse for 60 hearts' })
    .click();
  const savedState = await saved(page);
  expect(savedState.learner.badges).toHaveLength(3);
  expect(
    savedState.learner.badges!.reduce((sum, badge) => sum + badge.gems, 0),
  ).toBe(3);
  expect(
    savedState.purchases.filter(
      (purchase) => purchase.itemId === 'gate-treehouse',
    ),
  ).toHaveLength(1);
});

function target(page: Page) {
  return page.getByRole('region', { name: 'Find this', exact: true });
}
async function pitch(page: Page) {
  await expect(target(page).locator('svg')).toBeVisible();
  const label = await target(page)
    .getByRole('img', { name: /^Sheet music:/ })
    .getAttribute('aria-label');
  return Number(label!.match(/Sheet music: (\d+)/)![1]);
}
async function playPitch(page: Page, midi: number) {
  const names = [
    'C',
    'C♯',
    'D',
    'D♯',
    'E',
    'F',
    'F♯',
    'G',
    'G♯',
    'A',
    'A♯',
    'B',
  ];
  await page
    .getByRole('button', {
      name: `Play ${names[midi % 12]}${Math.floor(midi / 12) - 1}`,
      exact: true,
    })
    .click();
}
async function playLesson(
  page: Page,
  rounds: number,
  reward: number,
  help = false,
  delay = 0,
) {
  for (let i = 0; i < rounds; i++) {
    const note = await pitch(page);
    if (help)
      await page.getByRole('button', { name: 'Show note name' }).click();
    if (delay) await page.clock.fastForward(delay);
    await expect(page.getByRole('timer')).toHaveCount(0);
    await playPitch(page, note);
    await expect(
      page.getByLabel(`${reward} hearts earned`, { exact: true }),
    ).toBeVisible();
    await page.clock.fastForward(1601);
    if (i === rounds - 1)
      await expect(
        page.getByRole('region', { name: 'Lesson complete' }),
      ).toBeVisible();
    else
      await expect(
        page.getByLabel(`${reward} hearts available`, { exact: true }),
      ).toBeVisible();
  }
}
async function fits(page: Page, selector: string) {
  await expect
    .poll(() =>
      page.evaluate(
        (selector) =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight &&
          [...document.querySelectorAll(selector)].every((element) => {
            const rect = element.getBoundingClientRect();
            return (
              rect.left >= 0 &&
              rect.right <= innerWidth &&
              rect.top >= 0 &&
              rect.bottom <= innerHeight
            );
          }),
        selector,
      ),
    )
    .toBe(true);
}
async function seed(page: Page, state: LearnerSnapshot) {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Note hunt', exact: true }),
  ).toBeEnabled();
  await page.evaluate(async (state) => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const req = indexedDB.open('kidmidi-learners', 1);
      req.onsuccess = () => resolve(req.result);
    });
    try {
      const tx = db.transaction(
        ['learners', 'settings', 'encounters', 'purchases'],
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
        tx.objectStore('encounters').add(event);
      for (const purchase of state.purchases)
        tx.objectStore('purchases').add(purchase);
      await done;
    } finally {
      db.close();
    }
  }, state);
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Note hunt', exact: true }),
  ).toBeEnabled();
}
async function saved(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const req = indexedDB.open('kidmidi-learners', 1);
      req.onsuccess = () => resolve(req.result);
    });
    try {
      const tx = db.transaction([
        'learners',
        'settings',
        'encounters',
        'purchases',
      ]);
      const request = <T>(req: IDBRequest<T>) =>
        new Promise<T>((resolve) => {
          req.onsuccess = () => resolve(req.result);
        });
      const id = (await request(
        tx.objectStore('settings').get('selected'),
      )) as string;
      const [learner, encounters, purchases] = await Promise.all([
        request(tx.objectStore('learners').get(id)),
        request(tx.objectStore('encounters').index('learnerId').getAll(id)),
        request(tx.objectStore('purchases').index('learnerId').getAll(id)),
      ]);
      return { learner, encounters, purchases } as LearnerSnapshot;
    } finally {
      db.close();
    }
  });
}
