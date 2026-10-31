import { expect, type Page, test } from '@playwright/test';

const card = (page: Page) =>
  page.getByRole('region', { name: 'Play this pattern', exact: true });
const score = (page: Page) =>
  card(page).getByRole('img', { name: /^Sheet music:/ });
const ghost = (page: Page) => score(page).locator('[data-played-note]');
const hint = (page: Page) =>
  score(page).locator('[class*="__hint-notehead__"]');
const keyHint = (page: Page) => page.locator('[class*="__piano-key__"] > i');
const progress = (page: Page, count: number, length = 3) =>
  page.getByLabel(`${count} of ${length} pattern notes found`, { exact: true });

async function openPattern(page: Page, name = 'Step up') {
  await page.addInitScript(() => {
    Math.random = () => 0.999;
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Note hunt', exact: true }).click();
  await page.getByRole('button', { name: 'Patterns', exact: true }).click();
  const lesson = page.getByRole('button', {
    name: `River: ${name}`,
    exact: true,
  });
  if (!(await lesson.isVisible()))
    await page.getByRole('button', { name: 'Next lesson page' }).click();
  await lesson.click();
  await expect(score(page).locator('svg')).toBeVisible();
}

async function aligned(page: Page, index: number, above: boolean) {
  await expect
    .poll(async () => {
      const target = await score(page)
        .locator('.vf-notehead')
        .nth(index)
        .boundingBox();
      const played = await ghost(page)
        .locator('[data-ghost-head]')
        .boundingBox();
      return (
        !!target &&
        !!played &&
        Math.abs(played.x + played.width / 2 - target.x - target.width / 2) <
          0.1 &&
        (above ? played.y < target.y : played.y > target.y)
      );
    })
    .toBe(true);
}

test('patterns share idle staff/key hints and held feedback while accepting the next note immediately', async ({
  page,
}) => {
  await page.clock.install();
  await openPattern(page);
  const geometry = await score(page).locator('svg').boundingBox();
  await expect(hint(page)).toHaveCount(0);
  await page.clock.fastForward(1801);
  await expect(hint(page)).toHaveCount(1);
  await expect(keyHint(page)).toHaveCount(1);
  await expect(
    page.getByText('Next: C4 · middle C', { exact: true }),
  ).toBeVisible();

  await page.keyboard.press('f');
  await expect(ghost(page)).toHaveAttribute('data-midi', '65');
  await expect(ghost(page)).toHaveAttribute('data-target-index', '0');
  await expect(ghost(page)).toHaveCSS('opacity', '0.5');
  await aligned(page, 0, true);
  await expect(progress(page, 0)).toBeVisible();
  await expect(hint(page)).toHaveCount(0);
  await page.clock.fastForward(1000);
  await expect(keyHint(page)).toHaveCount(0);
  await page.clock.fastForward(801);
  await expect(hint(page)).toHaveCount(1);
  await expect(ghost(page)).toBeVisible();

  await page.keyboard.down('a');
  await expect(progress(page, 1)).toBeVisible();
  await expect(ghost(page)).toHaveCount(0);
  await expect(score(page).locator('[class*="__hit-held__"]')).toHaveCount(1);
  await page.clock.fastForward(5000);
  await expect(keyHint(page)).toHaveCount(0);
  await expect(hint(page)).toHaveCount(0);
  await page.keyboard.press('g');
  await expect(ghost(page)).toHaveAttribute('data-target-index', '1');
  await aligned(page, 1, true);
  // A held C cannot block the next D, and its old release cannot erase D.
  await page.keyboard.down('s');
  await expect(progress(page, 2)).toBeVisible();
  await expect(ghost(page)).toHaveCount(0);
  await page.keyboard.up('a');
  await expect(score(page).locator('[class*="__hit-held__"]')).toHaveCount(1);
  await page.keyboard.press('f');
  await expect(ghost(page)).toHaveAttribute('data-target-index', '2');
  await aligned(page, 2, true);
  await page.keyboard.up('s');
  await page.clock.fastForward(480);
  await expect(hint(page)).toHaveCount(0);
  await page.clock.fastForward(1800);
  await expect(hint(page)).toHaveCount(1);
  await expect(page.getByText('Next: E4', { exact: true })).toBeVisible();
  expect(await score(page).locator('svg').boundingBox()).toEqual(geometry);

  await page.keyboard.down('d');
  await expect(progress(page, 3)).toBeVisible();
  await expect(ghost(page)).toHaveCount(0);
  await page.clock.fastForward(5000);
  await expect(progress(page, 3)).toBeVisible();
  await expect(keyHint(page)).toHaveCount(0);
  await page.keyboard.up('d');
  await page.clock.fastForward(1601);
  await expect(progress(page, 0)).toBeVisible();
  await expect(ghost(page)).toHaveCount(0);
  await expect(hint(page)).toHaveCount(0);
  await expect(page.getByLabel('6 points', { exact: true })).toBeVisible();

  await page.locator('summary').filter({ hasText: 'Options' }).click();
  await page.getByLabel('Idle hints', { exact: true }).uncheck();
  await page.locator('summary').filter({ hasText: 'Options' }).click();
  await page.clock.fastForward(10000);
  await expect(hint(page)).toHaveCount(0);
  await expect(keyHint(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Play C4', exact: true }).click();
  await expect(ghost(page)).toHaveAttribute('data-midi', '60');
  await aligned(page, 0, false);
  await page
    .getByRole('button', { name: 'Restart note hunt', exact: true })
    .click();
  await expect(ghost(page)).toHaveCount(0);
  await expect(progress(page, 0)).toBeVisible();
  await page.clock.fastForward(10000);
  await expect(hint(page)).toHaveCount(0);
});

test('batched MIDI attacks use each recognised pattern position; settings, unplug and mode changes clean feedback', async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const input = Object.assign(new EventTarget(), {
      id: 'pattern-piano',
      name: 'Pattern piano',
      manufacturer: 'Test',
      state: 'connected',
    });
    const access = {
      inputs: new Map([[input.id, input]]),
      onstatechange: null as (() => void) | null,
    };
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: async () => access,
    });
    Object.assign(window, {
      patternMidi: (messages: number[][]) => {
        for (const data of messages)
          input.dispatchEvent(
            Object.assign(new Event('midimessage'), {
              data: new Uint8Array(data),
            }),
          );
      },
      unplugPatternMidi: () => {
        access.inputs.clear();
        access.onstatechange?.();
      },
    });
  });
  await openPattern(page, 'Out and back');
  const send = (messages: number[][]) =>
    page.evaluate(
      (messages) =>
        (
          window as unknown as { patternMidi(messages: number[][]): void }
        ).patternMidi(messages),
      messages,
    );
  await send([
    [0x90, 60, 90],
    [0x90, 62, 90],
    [0x90, 61, 90],
  ]);
  await expect(progress(page, 2, 5)).toBeVisible();
  await expect(ghost(page)).toHaveAttribute('data-midi', '61');
  await expect(ghost(page)).toHaveAttribute('data-target-index', '2');
  await expect(ghost(page).locator('text')).toHaveText('♯');
  await aligned(page, 2, false);
  await send([
    [0x90, 62, 90],
    [0x80, 60, 0],
  ]);
  await expect(progress(page, 2, 5)).toBeVisible();
  await expect(score(page).locator('[class*="__hit-held__"]')).toHaveCount(1);
  await send([
    [0x80, 62, 0],
    [0x80, 61, 0],
    [0x90, 64, 90],
    [0x90, 62, 90],
    [0x90, 60, 90],
  ]);
  await expect(progress(page, 5, 5)).toBeVisible();
  await expect(ghost(page)).toHaveCount(0);
  await send([
    [0x80, 64, 0],
    [0x80, 62, 0],
    [0x80, 60, 0],
  ]);
  await page.clock.fastForward(1601);
  await expect(progress(page, 0, 5)).toBeVisible();
  await expect(score(page).locator('[class*="__hit-notehead__"]')).toHaveCount(
    0,
  );
  await send([
    [0x90, 61, 90],
    [0x80, 61, 0],
  ]);
  await expect(ghost(page)).toBeVisible();
  await page.getByRole('button', { name: 'Sound and settings' }).click();
  await expect(ghost(page)).toHaveCount(0);
  await send([
    [0x90, 60, 90],
    [0x80, 60, 0],
  ]);
  await page.getByRole('button', { name: 'Close sound and settings' }).click();
  await expect(progress(page, 0, 5)).toBeVisible();
  await expect(hint(page)).toHaveCount(0);
  await send([
    [0x90, 61, 90],
    [0x80, 61, 0],
  ]);
  await expect(ghost(page)).toBeVisible();
  await page.evaluate(() =>
    (window as unknown as { unplugPatternMidi(): void }).unplugPatternMidi(),
  );
  await expect(ghost(page)).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Back to lessons', exact: true })
    .click();
  await page.getByRole('button', { name: 'Find notes', exact: true }).click();
  await page
    .getByRole('button', { name: 'Garden: 3 notes', exact: true })
    .click();
  await page.clock.fastForward(10000);
  await expect(page.locator('[data-played-note]')).toHaveCount(0);
  await expect(keyHint(page)).toHaveCount(0);
});

test('pattern ghosts and idle cues fit desktop and phones without moving the written shape', async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPattern(page, 'Moving thirds up');
  await page.keyboard.press('s');
  await expect(ghost(page)).toHaveAttribute('data-midi', '62');
  for (const [layout, viewport] of [
    ['desktop', { width: 1280, height: 800 }],
    ['phone', { width: 390, height: 844 }],
    ['small-phone', { width: 320, height: 568 }],
    ['landscape', { width: 844, height: 390 }],
  ] as const) {
    await page.setViewportSize(viewport);
    await page.clock.runFor(100);
    await aligned(page, 0, true);
    await page.clock.fastForward(1801);
    await expect(hint(page)).toHaveCount(1);
    await expect
      .poll(() =>
        card(page).evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          return (
            document.documentElement.scrollHeight <= innerHeight &&
            document.documentElement.scrollWidth <= innerWidth &&
            [
              ...element.querySelectorAll(
                'svg, [data-played-note], [aria-label$="pattern notes found"] > span',
              ),
            ].every((child) => {
              const rect = child.getBoundingClientRect();
              return (
                rect.left >= bounds.left &&
                rect.right <= bounds.right &&
                rect.top >= bounds.top &&
                rect.bottom <= bounds.bottom
              );
            })
          );
        }),
      )
      .toBe(true);
    await page.screenshot({
      path: `test-results/pattern-feedback-${layout}.png`,
      animations: 'disabled',
    });
  }
});
