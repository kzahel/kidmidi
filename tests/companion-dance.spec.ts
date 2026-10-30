import { expect, type Page, test } from '@playwright/test';
import { noteName, octave } from '../src/music';

const companion = (page: Page) =>
  page.getByRole('complementary', {
    name: 'Your piano companion',
    exact: true,
  });

async function open(page: Page) {
  await page.clock.install();
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Learners and rewards' }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Just explore', exact: true }).click();
  await expect(page.locator('[class*="__explore-score__"] svg')).toBeVisible();
}
async function play(page: Page, keys: string[], touch = false) {
  for (const key of keys) {
    await page.clock.runFor(180);
    if (touch) {
      const notes: Record<string, string> = {
        a: 'C4',
        s: 'D4',
        d: 'E4',
        f: 'F4',
        g: 'G4',
        h: 'A4',
        j: 'B4',
        k: 'C5',
      };
      await page
        .getByRole('button', { name: `Play ${notes[key]}`, exact: true })
        .click();
    } else await page.keyboard.press(key);
  }
}

test('live Free play discovers dances without changing capture, wallets, or playback and resets on interruptions', async ({
  page,
}) => {
  await open(page);
  const buddy = companion(page);
  const wallet = await page
    .getByRole('button', { name: 'Learners and rewards' })
    .innerText();
  await page.keyboard.down('a');
  await expect(buddy).toHaveAttribute('data-dance', 'hop');
  const first = await buddy.getAttribute('data-step');
  await page.keyboard.down('a');
  await expect(buddy).toHaveAttribute('data-step', first!);
  await page.keyboard.up('a');
  await play(page, ['s', 'd']);
  await expect(buddy).toHaveAttribute('data-lift', '2');
  await play(page, ['f', 'g', 'h', 'j', 'k']);
  await expect(buddy).toHaveAttribute('data-dance', 'flip');
  await expect(buddy.getByRole('status')).toHaveText('Scale flip!');
  await play(page, ['d']);
  await expect(buddy).toHaveAttribute('data-dance', 'flip');
  await expect(page.getByText('9 notes · 4/4', { exact: true })).toBeVisible();
  await page.clock.runFor(1400);
  await expect(buddy).toHaveAttribute('data-dance', 'none');
  await play(page, ['a', 'a', 'a', 'a']);
  await expect(buddy).toHaveAttribute('data-dance', 'echo');
  await page.getByRole('button', { name: 'Clear page', exact: true }).click();
  await expect(buddy).toHaveAttribute('data-dance', 'none');
  await expect(page.getByText('13 notes · 4/4', { exact: true })).toBeVisible();
  await play(page, ['a', 'd', 'g', 'k']);
  await expect(buddy).toHaveAttribute('data-dance', 'spin');
  expect(
    await page
      .getByRole('button', { name: 'Learners and rewards' })
      .innerText(),
  ).toBe(wallet);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Recordings', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Recordings', exact: true })
    .getByRole('button', { name: 'Play', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Stop playback', exact: true }),
  ).toBeVisible();
  await expect(buddy).toHaveAttribute('data-dance', 'none');
  for (let i = 0; i < 5; i++) {
    await page.clock.runFor(600);
    await expect(buddy).toHaveAttribute('data-dance', 'none');
  }
  await expect(page.getByText('17 notes · 4/4', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Stop playback', exact: true })
    .click();
  await play(page, ['a', 's', 'd', 'f']);
  await page
    .getByRole('button', { name: 'Sound and settings', exact: true })
    .click();
  await expect(buddy).toHaveAttribute('data-dance', 'none');
  await page.keyboard.press('Escape');
  await play(page, ['g', 'h', 'j', 'k']);
  await expect(buddy).toHaveAttribute('data-dance', 'hop');
  await play(page, ['a', 'k']);
  await expect(buddy).toHaveAttribute('data-dance', 'leap');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(buddy).toHaveAttribute('data-dance', 'none');
  await page
    .getByRole('button', { name: 'New recording', exact: true })
    .click();
  await play(page, ['a', 'd', 'a', 'd', 'a']);
  await expect(buddy).toHaveAttribute('data-dance', 'twirl');
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.getByRole('button', { name: 'Just explore', exact: true }).click();
  await expect(buddy).toHaveAttribute('data-dance', 'none');
});

test('scale flips animate within the companion dock on desktop and phones, with a still reduced-motion discovery', async ({
  page,
}) => {
  await open(page);
  const buddy = companion(page);
  for (const [name, viewport] of [
    ['desktop', { width: 1280, height: 800 }],
    ['phone', { width: 390, height: 844 }],
    ['small-phone', { width: 320, height: 568 }],
    ['landscape', { width: 844, height: 390 }],
  ] as const) {
    await page.setViewportSize(viewport);
    await page
      .getByRole('button', { name: 'New recording', exact: true })
      .click();
    await play(
      page,
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'],
      name !== 'desktop',
    );
    await expect(buddy).toHaveAttribute('data-dance', 'flip');
    const friend = buddy.locator('[class*="__friend__"]');
    const score = page.locator('[class*="__explore-score__"] svg');
    const scoreBox = await score.boundingBox();
    for (const time of [0, 210, 490, 700, 1050, 1399]) {
      const contained = await motionContained(page, time);
      expect(contained, `${name} at ${time}ms`).toBe(true);
      expect(await score.boundingBox()).toEqual(scoreBox);
    }
    await friend.evaluate((element) => {
      element.getAnimations()[0].currentTime = 700;
    });
    await page.screenshot({ path: `test-results/pet-flip-${name}.png` });
    await page
      .getByRole('button', { name: 'New recording', exact: true })
      .click();
    await play(
      page,
      ['k', 'j', 'h', 'g', 'f', 'd', 's', 'a'],
      name !== 'desktop',
    );
    await expect(buddy).toHaveAttribute('data-dance', 'backflip');
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page
    .getByRole('button', { name: 'New recording', exact: true })
    .click();
  await play(page, ['a', 'd', 'g', 'k']);
  await expect(buddy).toHaveAttribute('data-dance', 'spin');
  await expect(buddy.getByRole('status')).toHaveText('Star spin!');
  expect(
    await buddy
      .locator('[class*="__friend__"]')
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none');
  await page.screenshot({ path: 'test-results/pet-dance-reduced-motion.png' });
});

test('MIDI discoveries honor attack timestamps, ignore held duplicates and cancel on unplug', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const input = Object.assign(new EventTarget(), {
      id: 'dance-piano',
      name: 'Dance piano',
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
      danceMidi: (data: number[], at: number) => {
        const event = Object.assign(new Event('midimessage'), {
          data: new Uint8Array(data),
        });
        Object.defineProperty(event, 'timeStamp', { value: at });
        input.dispatchEvent(event);
      },
      unplugDanceMidi: () => {
        access.inputs.clear();
        access.onstatechange?.();
      },
    });
  });
  await open(page);
  const buddy = companion(page);
  await expect(page.getByText(/No MIDI keyboard found/)).toHaveCount(0);
  const send = (data: number[], at: number) =>
    page.evaluate(
      ({ data, at }) =>
        (
          window as unknown as { danceMidi(data: number[], at: number): void }
        ).danceMidi(data, at),
      { data, at },
    );
  await send([0x90, 60, 100], 0);
  const step = await buddy.getAttribute('data-step');
  await send([0x90, 60, 100], 100);
  await expect(buddy).toHaveAttribute('data-step', step!);
  await send([0x80, 60, 0], 120);
  for (const [index, pitch] of [62, 64, 65, 67, 69, 71, 72].entries()) {
    await send([0x90, pitch, 80], (index + 1) * 250);
    await send([0x80, pitch, 0], (index + 1) * 250 + 120);
  }
  await expect(buddy).toHaveAttribute('data-dance', 'flip');
  await expect(page.getByText('8 notes · 4/4', { exact: true })).toBeVisible();
  await page.evaluate(() =>
    (window as unknown as { unplugDanceMidi(): void }).unplugDanceMidi(),
  );
  await expect(buddy).toHaveAttribute('data-dance', 'none');
});

async function motionContained(page: Page, time: number) {
  return companion(page)
    .locator('[class*="__friend__"]')
    .evaluate((element, time) => {
      const animation = element
        .getAnimations()
        .find((item) =>
          (item as CSSAnimation).animationName.includes('dance-'),
        );
      if (!animation) throw new Error('Missing dance animation');
      animation.pause();
      animation.currentTime = time;
      const rect = element.getBoundingClientRect();
      const floor = element.parentElement!.getBoundingClientRect();
      const dock = element.closest('aside')!.getBoundingClientRect();
      return (
        rect.left >= floor.left - 1 &&
        rect.right <= floor.right + 1 &&
        rect.top >= floor.top - 1 &&
        rect.bottom <= floor.bottom + 1 &&
        dock.left >= 0 &&
        dock.top >= 0 &&
        dock.right <= innerWidth &&
        dock.bottom <= innerHeight &&
        document.documentElement.scrollHeight <= innerHeight &&
        document.documentElement.scrollWidth <= innerWidth
      );
    }, time);
}

test('hops, jumps, spins and other discoveries stay inside the dock throughout their movement', async ({
  page,
}) => {
  await open(page);
  for (const [name, viewport] of [
    ['desktop', { width: 1280, height: 800 }],
    ['small-phone', { width: 320, height: 568 }],
  ] as const) {
    await page.setViewportSize(viewport);
    for (const [move, pitches] of [
      ['hop', [60, 62, 64, 65, 67]],
      ['leap', [60, 72]],
      ['echo', [60, 60, 60, 60]],
      ['twirl', [60, 64, 60, 64, 60]],
      ['spin', [60, 64, 67, 72]],
      ['tiptoe', [60, 61, 62, 63, 64, 65]],
    ] as const) {
      await page
        .getByRole('button', { name: 'New recording', exact: true })
        .click();
      for (const pitch of pitches) {
        await page.clock.runFor(180);
        await page
          .getByRole('button', {
            name: `Play ${noteName(pitch)}${octave(pitch)}`,
            exact: true,
          })
          .click();
      }
      await expect(companion(page)).toHaveAttribute('data-dance', move);
      const duration = move === 'hop' ? 550 : 1400;
      for (const fraction of [0, 0.15, 0.2, 0.3, 0.45, 0.5, 0.65, 0.8, 0.99])
        expect(
          await motionContained(page, duration * fraction),
          `${name} ${move} at ${fraction}`,
        ).toBe(true);
      if (name === 'desktop' && move === 'spin') {
        await motionContained(page, 490);
        await page.screenshot({
          path: 'test-results/pet-star-spin-desktop.png',
        });
      }
    }
  }
});
