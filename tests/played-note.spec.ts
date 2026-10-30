import { expect, type Page, test } from '@playwright/test';

async function openSong(page: Page, song = 'Twinkle, Twinkle') {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Learners and rewards' }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Play a song', exact: true }).click();
  await page.getByRole('button', { name: song, exact: true }).click();
  await expect(page.locator('[class*="__score__"] svg').first()).toBeVisible();
}
const score = (page: Page) => page.getByRole('img', { name: /^Sheet music:/ });
const ghost = (page: Page) => score(page).locator('[data-played-note]');
const head = (page: Page) => ghost(page).locator('[data-ghost-head]');

async function aligned(page: Page, index: number, above: boolean) {
  await expect
    .poll(async () => {
      const target = await score(page)
        .locator('.vf-notehead')
        .nth(index)
        .boundingBox();
      const played = await head(page).boundingBox();
      return (
        !!target &&
        !!played &&
        Math.abs(played.x + played.width / 2 - (target.x + target.width / 2)) <
          0.1 &&
        (above ? played.y < target.y : played.y > target.y)
      );
    })
    .toBe(true);
}

test('song misses show one persistent half-opacity pitch at the waiting note, independently of held hit feedback', async ({
  page,
}) => {
  await page.clock.install();
  await openSong(page);
  const original = await score(page).locator('svg').boundingBox();
  await page.keyboard.press('d');
  await expect(ghost(page)).toHaveAttribute('data-midi', '64');
  await expect(ghost(page)).toHaveAttribute('data-target-index', '0');
  await expect(ghost(page)).toHaveCSS('opacity', '0.5');
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
  await aligned(page, 0, true);
  await page.clock.runFor(5000);
  await expect(ghost(page)).toBeVisible();
  await page.getByRole('button', { name: 'Play D4', exact: true }).click();
  await expect(ghost(page)).toHaveCount(1);
  await expect(ghost(page)).toHaveAttribute('data-midi', '62');
  await aligned(page, 0, true);
  await page.keyboard.down('a');
  await expect(ghost(page)).toHaveCount(0);
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '1',
  );
  // The previous C is still green and held, but the miss belongs to the next C.
  await page.keyboard.press('d');
  await expect(ghost(page)).toHaveAttribute('data-target-index', '1');
  await expect(score(page).locator('[class*="__hit-held__"]')).toHaveCount(1);
  await aligned(page, 1, true);
  await page.keyboard.up('a');
  await page.clock.runFor(1000);
  await expect(ghost(page)).toBeVisible();
  await page.keyboard.press('a');
  await expect(ghost(page)).toHaveCount(0);
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '2',
  );
  await page.keyboard.press('f');
  await expect(ghost(page)).toHaveAttribute('data-target-index', '2');
  await aligned(page, 2, false);
  expect(await score(page).locator('svg').boundingBox()).toEqual(original);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(ghost(page)).toHaveCount(0);
  await page.keyboard.press('f');
  await expect(ghost(page)).toBeVisible();
  await page.getByRole('button', { name: 'Start again', exact: true }).click();
  await expect(ghost(page)).toHaveCount(0);
});

test('ghost pitches follow re-engraving and page positions, show accidentals, and fit desktop and phones', async ({
  page,
}) => {
  await page.clock.install();
  await openSong(page, 'Räge-Rägetröpfli');
  // D major: a played F natural must not look like the written F sharp.
  await page.keyboard.press('f');
  await expect(ghost(page).locator('text')).toHaveText('♮');
  await aligned(page, 0, false);
  for (const [name, viewport] of [
    ['desktop', { width: 1280, height: 800 }],
    ['phone', { width: 390, height: 844 }],
    ['small-phone', { width: 320, height: 568 }],
    ['landscape', { width: 844, height: 390 }],
  ] as const) {
    await page.setViewportSize(viewport);
    await page.clock.runFor(100);
    await expect(ghost(page)).toBeVisible();
    await aligned(page, 0, false);
    await expect
      .poll(() =>
        ghost(page).evaluate((node) => {
          const bounds = node.getBoundingClientRect();
          const container = node
            .closest('[role="img"]')
            ?.getBoundingClientRect();
          if (!container) return false;
          return (
            bounds.left >= container.left &&
            bounds.right <= container.right &&
            bounds.top >= container.top &&
            bounds.bottom <= container.bottom &&
            document.documentElement.scrollHeight <= innerHeight &&
            document.documentElement.scrollWidth <= innerWidth
          );
        }),
      )
      .toBe(true);
    await page.screenshot({
      path: `test-results/played-ghost-${name}.png`,
      animations: 'disabled',
    });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(ghost(page)).toHaveCSS('animation-name', 'none');
  await page.locator('summary').filter({ hasText: 'Options' }).click();
  await page.getByLabel('Idle hints', { exact: true }).uncheck();
  await page.getByLabel('Multiline', { exact: true }).check();
  await page.locator('summary').filter({ hasText: 'Options' }).click();
  await page.keyboard.press('d');
  await expect(ghost(page)).toHaveAttribute('data-midi', '64');
  await expect(score(page).locator('[id^="cursorImg"]')).toBeHidden();
  await page
    .getByRole('button', { name: 'Next score page', exact: true })
    .click();
  await expect(ghost(page)).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Previous score page', exact: true })
    .click();
  await expect(ghost(page)).toHaveAttribute('data-target-index', '0');
  await page.keyboard.press('h');
  await page.keyboard.press('g');
  await page.keyboard.press('f');
  await expect(ghost(page)).toHaveAttribute('data-target-index', '2');
  await expect(ghost(page).locator('text')).toHaveText('♮');
  const natural = await head(page).boundingBox();
  const sharp = await score(page).locator('.vf-notehead').nth(2).boundingBox();
  expect(
    Math.abs(natural!.y + natural!.height / 2 - (sharp!.y + sharp!.height / 2)),
  ).toBeLessThan(0.5);
  await page.getByRole('button', { name: 'Play F♯4', exact: true }).click();
  await expect(ghost(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.getByRole('button', { name: 'Play a song', exact: true }).click();
  await page
    .getByRole('button', { name: 'Hot Cross Buns', exact: true })
    .click();
  await expect(ghost(page)).toHaveCount(0);
});

test('MIDI mistakes show sharps and labelled extreme pitches; fresh correction and unplug clear the overlay', async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const input = Object.assign(new EventTarget(), {
      id: 'ghost-piano',
      name: 'Ghost piano',
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
      ghostMidi: (data: number[]) =>
        input.dispatchEvent(
          Object.assign(new Event('midimessage'), {
            data: new Uint8Array(data),
          }),
        ),
      unplugGhostMidi: () => {
        access.inputs.clear();
        access.onstatechange?.();
      },
    });
  });
  await openSong(page);
  const send = (data: number[]) =>
    page.evaluate(
      (data) =>
        (window as unknown as { ghostMidi(data: number[]): void }).ghostMidi(
          data,
        ),
      data,
    );
  for (const pitch of [61, 0, 127]) {
    await send([0x90, pitch, 100]);
    await send([0x80, pitch, 0]);
    await expect(ghost(page)).toHaveAttribute('data-midi', String(pitch));
    await expect(ghost(page)).toHaveCount(1);
    if (pitch === 61) await expect(ghost(page).locator('text')).toHaveText('♯');
    else {
      expect(await ghost(page).getAttribute('data-displayed-midi')).not.toBe(
        String(pitch),
      );
      await expect(ghost(page).locator('text')).toContainText(
        pitch === 0 ? 'C-1 ↓' : 'G9 ↑',
      );
    }
    const box = await ghost(page).boundingBox();
    const staff = await score(page).boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(staff!.x);
    expect(box!.y).toBeGreaterThanOrEqual(staff!.y);
    expect(box!.y + box!.height).toBeLessThanOrEqual(staff!.y + staff!.height);
  }
  await send([0x90, 60, 80]);
  await expect(ghost(page)).toHaveCount(0);
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '1',
  );
  await send([0x90, 64, 80]);
  await expect(ghost(page)).toHaveAttribute('data-target-index', '1');
  await page.evaluate(() =>
    (window as unknown as { unplugGhostMidi(): void }).unplugGhostMidi(),
  );
  await expect(ghost(page)).toHaveCount(0);
});
