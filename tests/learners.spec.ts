import { expect, type Page, test } from '@playwright/test';

test.use({ timezoneId: 'Europe/Berlin' });

test('activity menu and profile controls have touch targets on desktop, phone and landscape', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Note hunt', exact: true }),
  ).toBeEnabled();
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    const small = await page.locator('button').evaluateAll((buttons) =>
      buttons.flatMap((button) => {
        const bounds = button.getBoundingClientRect();
        return bounds.width &&
          bounds.height &&
          (bounds.width < 48 || bounds.height < 48)
          ? [button.textContent]
          : [];
      }),
    );
    expect(small).toEqual([]);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
  }
  await openHuntPractice(page);
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    const target = page.getByRole('region', { name: 'Find this', exact: true });
    await expect(target.locator('svg')).toBeVisible();
    await expect
      .poll(async () => (await target.boundingBox())?.height ?? 0)
      .toBeGreaterThan(100);
    const geometry = await target.evaluate((card) => {
      const bounds = card.getBoundingClientRect();
      return {
        height: bounds.height,
        scoreHeight: card.querySelector('[class*="__score__"]')!.clientHeight,
        inside: [...card.children].every((child) => {
          const rect = child.getBoundingClientRect();
          return rect.top >= bounds.top && rect.bottom <= bounds.bottom + 1;
        }),
      };
    });
    expect(geometry.height).toBeGreaterThan(100);
    expect(geometry.scoreHeight).toBeGreaterThan(40);
    expect(geometry.inside).toBe(true);
  }
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Learners and rewards' }).click();
  const dialog = page.getByRole('dialog', { name: 'Learners & rewards' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Learners and rewards' }),
  ).toBeFocused();
});

test('learners keep separate hearts, worlds and cosmetics across switches, reloads and a new review day', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-10-25T12:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Learners and rewards' }).click();
  await page
    .getByRole('textbox', { name: 'Learner name', exact: true })
    .fill('Ada');
  await page.getByRole('button', { name: 'Rename', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Ada', exact: true }),
  ).toBeVisible();
  await closeLearners(page);
  await openHuntPractice(page);
  await expect(page.getByRole('combobox', { name: 'Note range' })).toHaveValue(
    'adaptive',
  );
  for (let round = 0; round < 4; round++) await solve(page);
  await expect(
    page.getByRole('button', { name: 'Learners and rewards' }),
  ).toContainText('1 ✦ · ♥ 12');
  await page
    .getByRole('combobox', { name: 'Note range' })
    .selectOption('octave');
  await page.getByRole('button', { name: 'Learners and rewards' }).click();
  const bow = page.getByRole('button', {
    name: 'Get Party bow for 12 hearts',
    exact: true,
  });
  await expect(bow).toBeEnabled();
  await bow.click();
  await expect(
    page.getByText('World 1 · ♥ 0 · 💎 0', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Choose Party bow', exact: true })
    .click();
  await expect(
    page
      .getByRole('img', { name: 'Fox friend with party bow', exact: true })
      .last(),
  ).toBeVisible();
  await page
    .getByRole('textbox', { name: 'New learner name', exact: true })
    .fill('Ben');
  await page.getByRole('button', { name: 'Add learner', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Ben', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('World 1 · ♥ 0 · 💎 0', { exact: true }),
  ).toBeVisible();
  await page.keyboard.press('a'); // Profile forms never play or award notes.
  await closeLearners(page);
  await expect(page.getByRole('combobox', { name: 'Note range' })).toHaveValue(
    'adaptive',
  );
  await solve(page);
  await page.getByRole('button', { name: 'Learners and rewards' }).click();
  await expect(
    page.getByText('3 hearts earned, forever', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Current learner' }),
  ).toBeEnabled();
  await page
    .getByRole('combobox', { name: 'Current learner' })
    .selectOption({ label: 'Ada' });
  await expect(
    page.getByRole('heading', { name: 'Ada', exact: true }),
  ).toBeVisible();
  await closeLearners(page);
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Learners and rewards' }),
  ).toContainText('Ada');
  await expect(
    page.getByRole('button', { name: 'Learners and rewards' }),
  ).toContainText('1 ✦ · ♥ 0');
  await page.getByRole('button', { name: 'Learners and rewards' }).click();
  await expect(
    page
      .getByRole('img', { name: 'Fox friend with party bow', exact: true })
      .last(),
  ).toBeVisible();
  await expect(
    page.getByText('12 hearts earned, forever', { exact: true }),
  ).toBeVisible();
  await closeLearners(page);

  await page.clock.setSystemTime(new Date('2026-11-01T12:00:00Z'));
  await openHuntPractice(page);
  await expect(
    page.getByText('A little review to start today', { exact: true }),
  ).toBeVisible();
  await solve(page);
  await page.reload();
  await openHuntPractice(page);
  await expect(
    page.getByText('A little review to start today', { exact: true }),
  ).toBeVisible();
  await solve(page);
  await solve(page);
  await expect(
    page.getByText('A little review to start today', { exact: true }),
  ).toHaveCount(0);
  const evidence = await encounters(page);
  const reviews = evidence.filter(
    (event) => event.day === '2026-11-01' && event.reason === 'review',
  );
  expect(reviews).toHaveLength(3);
  expect(new Set(reviews.map((event) => event.target)).size).toBe(3);
  expect(evidence.filter((event) => event.day === '2026-10-25')).toHaveLength(
    5,
  );
});

test('a failed learner save is visible and retry saves the same award once; interrupted time is excluded', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-10-25T12:00:00Z') });
  await page.addInitScript(() => {
    const add = IDBObjectStore.prototype.add;
    let fail = true;
    IDBObjectStore.prototype.add = function (...args) {
      if (this.name === 'encounters' && fail) {
        fail = false;
        throw new Error('Test storage interruption');
      }
      return add.apply(this, args);
    };
  });
  await page.goto('/');
  await openHuntPractice(page);
  await expect(
    page.getByRole('region', { name: 'Find this', exact: true }).locator('svg'),
  ).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.clock.fastForward(60000);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await solve(page, false);
  await expect(page.getByRole('alert')).toContainText(
    'Test storage interruption',
  );
  await page.getByRole('button', { name: 'Retry saving', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  let saved = await encounters(page);
  expect(saved).toHaveLength(1);
  expect(saved[0].reward).toBe(3);
  expect(saved[0].firstResponseMs).toBeNull();
  expect(saved[0].durationMs).toBeNull();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Learners and rewards' }),
  ).toContainText('♥ 3');
  saved = await encounters(page);
  expect(saved).toHaveLength(1);
});

async function closeLearners(page: Page) {
  await page
    .getByRole('button', { name: 'Close learners & rewards', exact: true })
    .click();
}
async function solve(page: Page, advance = true) {
  const target = page.getByRole('region', { name: 'Find this', exact: true });
  await expect(target.locator('svg')).toBeVisible();
  const label = await target
    .locator('[class*="__hunt-note-name__"]')
    .textContent();
  const note = label!.match(/[A-G][♯♭]?\d/)![0];
  await page.getByRole('button', { name: `Play ${note}`, exact: true }).click();
  await expect(
    page.getByLabel('3 hearts earned', { exact: true }),
  ).toBeVisible();
  if (advance) {
    await page.clock.fastForward(1601);
    await expect(
      page.getByLabel('3 hearts available', { exact: true }),
    ).toBeVisible();
  }
}
async function encounters(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('kidmidi-learners', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<import('../src/learning').Encounter[]>(
        (resolve, reject) => {
          const request = db
            .transaction('encounters')
            .objectStore('encounters')
            .getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        },
      );
    } finally {
      db.close();
    }
  });
}

test('the final qualifying review unlocks one new note through the stored curriculum', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-10-25T12:00:00Z') });
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Note hunt', exact: true }),
  ).toBeEnabled();
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open('kidmidi-learners', 1);
      request.onsuccess = () => resolve(request.result);
    });
    try {
      const tx = db.transaction(['learners', 'encounters'], 'readwrite');
      const done = new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error);
      });
      const people = tx.objectStore('learners').getAll();
      people.onsuccess = () => {
        const learnerId = people.result[0].id;
        for (const day of ['2026-10-23', '2026-10-24', '2026-10-25']) {
          for (const target of [60, 64, 67]) {
            const count = day === '2026-10-25' && target === 67 ? 1 : 2;
            for (let i = 0; i < count; i++)
              tx.objectStore('encounters').add({
                id: `seed-${day}-${target}-${i}`,
                learnerId,
                day,
                target,
                guesses: [target],
                startedAt: Date.parse(`${day}T09:00:00Z`) + target * 10 + i,
                spelling: `${target}`,
                firstResponseMs: 1000,
                durationMs: 1000,
                assistance: 'note-name',
                input: 'midi',
                reward: 3,
                reason:
                  day === '2026-10-25' && target !== 67 ? 'review' : 'practice',
              });
          }
        }
      };
      await done;
    } finally {
      db.close();
    }
  });
  await page.reload();
  await openHuntPractice(page);
  const target = page.getByRole('region', { name: 'Find this', exact: true });
  await expect(target).toContainText('G4');
  await expect(
    page.getByText('A little review to start today', { exact: true }),
  ).toBeVisible();
  await solve(page);
  await expect(target).toContainText('D4');
  await expect(
    page.getByText('Meet a new note', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.reload();
  await openHuntPractice(page);
  await expect(target).toContainText('D4');
});

async function openHuntPractice(page: Page) {
  await page.getByRole('button', { name: 'Note hunt', exact: true }).click();
  await page
    .getByRole('button', { name: 'Practice note hunt', exact: true })
    .click();
}
