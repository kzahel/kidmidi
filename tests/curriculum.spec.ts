import { expect, type Page, test } from '@playwright/test';
import { type LearnerSnapshot, withPurchase } from '../src/learners';
import { finishLesson, gardenGraduate, newLearner } from './fixtures/journey';

test('labelled lessons fit desktop, tablets and phones; direct choices earn badges and buy a gem pet', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Note hunt', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Lessons', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Garden: 5 notes', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Read notes', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Treehouse: Quick', exact: true }),
  ).toBeEnabled();
  // A new learner can jump straight to the hardest reading lesson.
  await page
    .getByRole('button', { name: 'Treehouse: Quick', exact: true })
    .click();
  await expect(target(page).locator('svg')).toBeVisible();
  await expect(page.getByLabel('0 points', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Back to lessons', exact: true })
    .click();
  await page.getByRole('button', { name: 'Coming soon', exact: true }).click();
  await expect(
    page.getByText('Discover bass clef', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Next lesson page' }).click();
  await expect(page.getByText('Notes together', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Find notes', exact: true }).click();
  for (const [name, viewport] of [
    ['desktop', { width: 1280, height: 800 }],
    ['tablet', { width: 1024, height: 768 }],
    ['tablet-portrait', { width: 768, height: 1024 }],
    ['phone', { width: 390, height: 844 }],
    ['small-phone', { width: 320, height: 568 }],
    ['landscape', { width: 844, height: 390 }],
  ] as const) {
    await page.setViewportSize(viewport);
    await fits(
      page,
      '[aria-label="Learning map"] button, [class*="__map-footer__"]',
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
      .getByRole('button', { name: 'Back to lessons', exact: true })
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
  await page.getByRole('button', { name: 'Read notes', exact: true }).click();
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
    .getByRole('button', { name: 'Preview Puppy friend', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Get Puppy friend for 3 gems', exact: true })
    .click();
  await expect(
    page.getByText('4 badges · ♥ 204 · 💎 2', { exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.reload();
  await page.getByRole('button', { name: 'Note hunt', exact: true }).click();
  await page.getByRole('button', { name: 'Read notes', exact: true }).click();
  await expect(
    page.getByRole('button', {
      name: 'Treehouse: 3 notes, badge earned',
      exact: true,
    }),
  ).toBeEnabled();
  await expect(
    page.getByLabel('204 hearts, 2 gems', { exact: true }),
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
  await page.getByRole('button', { name: 'Read notes', exact: true }).click();
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
  await page.getByRole('button', { name: 'Learners', exact: true }).click();
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
  await page.getByRole('button', { name: 'Read notes', exact: true }).click();
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

test('a failed final badge save can be retried without blocking experimentation or doubling gems', async ({
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
  await page
    .getByRole('button', { name: 'Back to lessons', exact: true })
    .click();
  await page.getByRole('button', { name: 'Read notes', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Treehouse: 8 notes', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Retry saving', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  const savedState = await saved(page);
  expect(savedState.learner.badges).toHaveLength(3);
  expect(
    savedState.learner.badges!.reduce((sum, badge) => sum + badge.gems, 0),
  ).toBe(3);
  expect(
    savedState.purchases.filter(
      (purchase) => purchase.itemId === 'gate-treehouse',
    ),
  ).toHaveLength(0);
});

test('patterns can be tried first, accept connected notes and keep the celebration at phrase boundaries', async ({
  page,
}) => {
  const time = new Date('2026-10-25T10:00:00Z');
  await page.clock.install({ time });
  await page.goto('/');
  await page.getByRole('button', { name: 'Note hunt', exact: true }).click();
  await page.getByRole('button', { name: 'Patterns', exact: true }).click();
  for (const [name, viewport] of [
    ['desktop', { width: 1280, height: 800 }],
    ['tablet', { width: 1024, height: 768 }],
    ['phone', { width: 390, height: 844 }],
    ['small-phone', { width: 320, height: 568 }],
    ['landscape', { width: 844, height: 390 }],
  ] as const) {
    await page.setViewportSize(viewport);
    await page.clock.runFor(50);
    await fits(
      page,
      '[aria-label="Learning map"] button, [class*="__map-footer__"]',
    );
    await page.screenshot({ path: `test-results/pattern-map-${name}.png` });
    if (name === 'small-phone') {
      await page.getByRole('button', { name: 'Next lesson page' }).click();
      await expect(
        page.getByRole('button', { name: 'River: Out and back', exact: true }),
      ).toBeVisible();
      await fits(page, '[aria-label="Learning map"] button');
      await page.screenshot({
        path: 'test-results/pattern-map-small-phone-page-2.png',
      });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole('button', { name: 'River: Out and back', exact: true })
    .click();
  const card = page.getByRole('region', { name: 'Play this pattern' });
  for (const [name, viewport] of [
    ['desktop', { width: 1280, height: 800 }],
    ['tablet', { width: 1024, height: 768 }],
    ['phone', { width: 390, height: 844 }],
    ['small-phone', { width: 320, height: 568 }],
    ['landscape', { width: 844, height: 390 }],
  ] as const) {
    await page.setViewportSize(viewport);
    await page.clock.runFor(50);
    await expect(card.locator('svg')).toBeVisible();
    await fits(
      page,
      '[aria-label="Play this pattern"], [class*="__keyboard__"], [class*="__hunt-controls__"] > *',
    );
    await expect
      .poll(() =>
        card.getByRole('img', { name: /^Sheet music:/ }).evaluate((score) => {
          const bounds = score.getBoundingClientRect();
          const svg = score.querySelector('svg')!.getBoundingClientRect();
          return (
            svg.left >= bounds.left - 1 &&
            svg.right <= bounds.right + 1 &&
            svg.top >= bounds.top - 1 &&
            svg.bottom <= bounds.bottom + 1
          );
        }),
      )
      .toBe(true);
    await page.screenshot({ path: `test-results/pattern-play-${name}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (let phrase = 0; phrase < 4; phrase++) {
    await expect(card.locator('svg')).toBeVisible();
    const label = await card
      .getByRole('img', { name: /^Sheet music:/ })
      .getAttribute('aria-label');
    const notes = label!
      .match(/Sheet music: ([\d, ]+)/)![1]
      .split(',')
      .map(Number);
    expect(notes).toHaveLength(5);
    if (phrase === 0) {
      await playPitch(page, 61); // A wrong note waits; it never resets the phrase.
      await expect(
        page.getByLabel('0 of 5 pattern notes found', { exact: true }),
      ).toBeVisible();
    }
    for (let i = 0; i < notes.length; i++) {
      await playPitch(page, notes[i]);
      await expect(
        page.getByLabel(`${i + 1} of 5 pattern notes found`, { exact: true }),
      ).toBeVisible();
      if (i === 0 && phrase === 0) {
        await page.getByRole('button', { name: 'Sound and settings' }).click();
        await page
          .getByRole('button', { name: 'Close sound and settings' })
          .click();
        await expect(
          page.getByLabel('1 of 5 pattern notes found', { exact: true }),
        ).toBeVisible();
      }
    }
    const previous = await card
      .getByRole('img', { name: /^Sheet music:/ })
      .getAttribute('aria-label');
    await playPitch(page, 60); // Extra celebration input cannot score twice.
    await page.clock.runFor(50);
    await page.clock.fastForward(1000);
    await expect(
      card.getByRole('img', { name: previous!, exact: true }),
    ).toBeVisible();
    await page.clock.fastForward(650);
    await page.clock.runFor(50);
    if (phrase < 3)
      await expect(
        page.getByLabel('0 of 5 pattern notes found', { exact: true }),
      ).toBeVisible();
  }
  await expect(
    page.getByRole('region', { name: 'Lesson complete' }),
  ).toContainText('💎 +1');
  await expect.poll(async () => (await saved(page)).encounters.length).toBe(20);
  const snapshot = await saved(page);
  expect(snapshot.learner.badges?.map((badge) => badge.lessonId)).toEqual([
    'returns',
  ]);
  expect(
    snapshot.encounters.reduce((sum, event) => sum + event.reward, 0),
  ).toBe(59);
  expect(snapshot.purchases).toHaveLength(0);
  await page.reload();
  await page.getByRole('button', { name: 'Note hunt', exact: true }).click();
  await page.getByRole('button', { name: 'Patterns', exact: true }).click();
  await expect(
    page.getByRole('button', {
      name: 'River: Out and back, badge earned',
      exact: true,
    }),
  ).toBeEnabled();
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
      page.locator('[class*="__lessons__"] > *').evaluateAll((cards) =>
        cards.every((card) => {
          const bounds = card.getBoundingClientRect();
          return [...card.children].every((child) => {
            const rect = child.getBoundingClientRect();
            return (
              !rect.width ||
              (rect.top >= bounds.top &&
                rect.bottom <= bounds.bottom &&
                rect.left >= bounds.left &&
                rect.right <= bounds.right)
            );
          });
        }),
      ),
    )
    .toBe(true);
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
