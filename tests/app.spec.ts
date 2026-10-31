import { readFile } from 'node:fs/promises';
import { expect, type Page, test } from '@playwright/test';

test('real score renders, waits for correct fresh presses, and can restart', async ({
  page,
}) => {
  await openPractice(page);
  await expect(page.locator('[class*="__score__"] svg').first()).toBeVisible();
  await expect(page.getByText('Find C · middle C')).toBeVisible();
  await page.keyboard.press('d');
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
  await page.keyboard.down('a');
  await page.keyboard.down('a');
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '1',
  );
  await page.keyboard.up('a');
  await page.keyboard.press('a');
  await expect(page.getByText('Find G · octave 4')).toBeVisible();
  for (const key of ['g', 'g', 'h', 'h', 'g']) await page.keyboard.press(key);
  await expect(page.getByText('Phrase 2 of 6')).toBeVisible();
  await expect(page.getByText('Find F · octave 4')).toBeVisible();
  await page.getByRole('button', { name: 'Start again' }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
  await openActivity(page, 'explore');
  await page.getByRole('button', { name: 'Play D4', exact: true }).click();
  await expect(page.getByText('You played D4')).toBeVisible();
});

test('MIDI permission, device selection, messages and unplugging use the adapter', async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const input = Object.assign(new EventTarget(), {
      id: 'casio',
      name: 'Test Casio',
      manufacturer: 'Casio',
      state: 'connected',
    });
    const access = {
      inputs: new Map([['casio', input]]),
      onstatechange: null as (() => void) | null,
    };
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      configurable: true,
      value: async () => access,
    });
    Object.assign(window, {
      sendNote: (data: number[]) =>
        input.dispatchEvent(
          Object.assign(new Event('midimessage'), {
            data: new Uint8Array(data),
          }),
        ),
      unplug: () => {
        access.inputs.clear();
        access.onstatechange?.();
      },
    });
  });
  await openPractice(page);
  await expectInput(page, 'Test Casio');
  await expect(page.locator('[class*="__score__"] svg')).toBeVisible();
  const cursor = page.locator('[class*="__score__"] [id^="cursorImg"]');
  await openSettings(page);
  await page.clock.fastForward(10000);
  await expect(cursor).toBeHidden();
  await closeSettings(page);
  await expect(cursor).toBeHidden();
  await page.clock.fastForward(1800);
  await expect(cursor).toBeVisible();
  const hintOpacity = await cursor.evaluate((el) => {
    const animation = el.getAnimations()[0];
    if (!animation)
      throw new Error('The idle hint has no prominence animation.');
    animation.pause();
    animation.currentTime = 0;
    const subtle = Number(getComputedStyle(el).opacity);
    animation.currentTime = 6000;
    return { subtle, prominent: Number(getComputedStyle(el).opacity) };
  });
  expect(hintOpacity.subtle).toBeLessThan(0.5);
  expect(hintOpacity.prominent).toBeGreaterThan(0.9);
  await expect(page.locator('[class*="__hint-notehead__"]')).toHaveCount(1);
  const originalX = (await cursor.boundingBox())?.x;
  expect(originalX).toBeDefined();
  const send = (data: number[]) =>
    page.evaluate(
      (bytes) =>
        (window as unknown as { sendNote: (bytes: number[]) => void }).sendNote(
          bytes,
        ),
      data,
    );
  await send([0x90, 60, 100]);
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '1',
  );
  await expect(page.locator('[class*="__hit-badge__"]')).toHaveText('C4 ✓');
  await expect(
    page.locator('[class*="__score__"] [class*="__hit-notehead__"]'),
  ).toHaveCount(1);
  await expect(
    page.locator('[class*="__score__"] [class*="__hit-held__"]'),
  ).toHaveCount(1);
  expect((await cursor.boundingBox())?.x).toBe(originalX);
  await page.clock.fastForward(1500);
  await expect(page.locator('[class*="__hit-badge__"]')).toHaveText('C4 ✓');
  expect((await cursor.boundingBox())?.x).toBe(originalX);
  await send([0x90, 60, 100]);
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '1',
  );
  await send([0x90, 60, 0]);
  await page.clock.fastForward(100);
  await expect(page.locator('[class*="__hit-badge__"]')).toHaveCount(0);
  await expect(cursor).toBeHidden();
  await page.clock.fastForward(1000);
  await expect(cursor).toBeHidden();
  await page.clock.fastForward(1000);
  await expect(cursor).toBeVisible();
  expect((await cursor.boundingBox())?.x).toBeGreaterThan(originalX ?? 0);
  await send([0x90, 60, 100]);
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '2',
  );
  await expect(
    page.getByRole('button', { name: 'Play C4', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() =>
    (window as unknown as { unplug: () => void }).unplug(),
  );
  await openSettings(page);
  await page.getByRole('tab', { name: 'Keyboard', exact: true }).click();
  await expect(page.getByText(/No MIDI keyboard found/)).toBeVisible();
  await closeSettings(page);
  await expect(page.locator('[class*="__hit-badge__"]')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Play C4', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false');
});

test('phone layout, touch input, unsupported MIDI and completing a song', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'requestMIDIAccess', { value: undefined }),
  );
  await openPractice(page);
  await openSettings(page);
  await expect(
    page.getByRole('button', { name: 'Connect keyboard', exact: true }),
  ).toBeDisabled();
  await closeSettings(page);
  await expect(page.locator('[class*="__score__"] svg').first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await openSong(page, 'Hot Cross Buns');
  for (const note of [
    64, 62, 60, 64, 62, 60, 60, 60, 60, 60, 62, 62, 62, 62, 64, 62, 60,
  ]) {
    const names: Record<number, string> = { 60: 'C4', 62: 'D4', 64: 'E4' };
    await page
      .getByRole('button', { name: `Play ${names[note]}`, exact: true })
      .click();
  }
  await expect(page.getByText('You played the whole song!')).toBeVisible();
  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
});

test('songbook score includes illustration, symbols, whole-song cursor and download', async ({
  page,
}) => {
  await openPractice(page);
  await openSong(page, 'Räge-Rägetröpfli');
  await expect(page.getByText('Find A · octave 4')).toBeVisible();
  await expect(page.locator('[class*="__score__"] svg').first()).toBeVisible();
  await expect(
    page.getByRole('img', { name: /Rain falling over two houses/ }),
  ).toBeVisible();
  await expect(page.locator('[class*="__score__"]')).toContainText('tröpf');
  await expect(page.locator('[class*="__score__"]')).toContainText('D');
  await openOptions(page);
  await page.getByLabel('Multiline', { exact: true }).check();
  await closeOptions(page);
  await page
    .getByRole('button', { name: 'Next score page', exact: true })
    .click();
  await expect(page.locator('[class*="__score__"]')).toContainText('Steind');
  await expect(page.locator('[class*="__score__"]')).toContainText('Gass.');
  await expect(page.locator('[class*="__score__"] svg')).toHaveCount(1);
  await expect(page.locator('[class*="__score__"]')).toContainText('G');
  await expect(page.locator('[class*="__score__"]')).not.toContainText(
    'I. Spühler-Suter',
  );
  const xmlResponse = await page.request.get(
    '/scores/raege-raegetroepfli.musicxml',
  );
  expect(xmlResponse.ok()).toBe(true);
  const xml = await xmlResponse.text();
  const parsed = await page.evaluate((text) => {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    return {
      errors: doc.querySelectorAll('parsererror').length,
      notes: doc.querySelectorAll('note').length,
      measures: doc.querySelectorAll('measure').length,
    };
  }, xml);
  expect(parsed).toEqual({ errors: 0, notes: 45, measures: 12 });
  await page.getByRole('button', { name: 'Play A4', exact: true }).click();
  await expect(page.getByText('Find G · octave 4')).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '1',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await openOptions(page);
  await page
    .getByRole('combobox', { name: 'Score size' })
    .selectOption('compact');
  await closeOptions(page);
  await openOptions(page);
  await page.getByLabel('Multiline', { exact: true }).uncheck();
  await closeOptions(page);
  await expect(page.locator('[class*="__score__"]')).not.toContainText('Gass.');
  await expect(page.locator('[class*="__score__"]')).toContainText('tröpf');
  await expect(page.locator('[class*="__score__"] svg')).toHaveCount(1);
  await expect
    .poll(
      async () =>
        (await page.locator('[class*="__score__"]').boundingBox())?.height ??
        Infinity,
    )
    .toBeLessThan(600);
  await expect(
    page.getByRole('img', { name: /Rain falling over two houses/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('notation sizes and multiline persist, and fitted pages follow a played note', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPractice(page);
  await openOptions(page);
  await expect(page.getByRole('combobox', { name: 'Score size' })).toHaveValue(
    'kid',
  );
  await closeOptions(page);
  await page.keyboard.down('a');
  await expect(
    page.locator('[class*="__score__"] [class*="__hit-notehead__"]'),
  ).toHaveCount(1);
  const kidHeight =
    (await page.locator('[class*="__hit-notehead__"]').boundingBox())?.height ??
    0;
  expect(kidHeight).toBeGreaterThan(0);
  await openOptions(page);
  await page
    .getByRole('combobox', { name: 'Score size' })
    .selectOption('compact');
  await closeOptions(page);
  await expect
    .poll(
      async () =>
        (await page.locator('[class*="__hit-notehead__"]').boundingBox())
          ?.height ?? Infinity,
    )
    .toBeLessThan(kidHeight * 0.85);
  await page.keyboard.up('a');
  await openOptions(page);
  await page.getByLabel('Multiline', { exact: true }).check();
  await closeOptions(page);
  await expect(page.locator('[class*="__score__"]')).toContainText('How');
  await page.reload();
  await enterSong(page);
  await openOptions(page);
  await expect(page.getByRole('combobox', { name: 'Score size' })).toHaveValue(
    'compact',
  );
  await closeOptions(page);
  await openOptions(page);
  await expect(page.getByLabel('Multiline', { exact: true })).toBeChecked();
  await closeOptions(page);
  await openOptions(page);
  await page.getByRole('combobox', { name: 'Score size' }).selectOption('kid');
  await closeOptions(page);
  await page.setViewportSize({ width: 1280, height: 600 });
  await expect(page.locator('[class*="__score__"] svg')).toHaveCount(1);
  const tune = [
    'C4',
    'C4',
    'G4',
    'G4',
    'A4',
    'A4',
    'G4',
    'F4',
    'F4',
    'E4',
    'E4',
    'D4',
    'D4',
    'C4',
    'G4',
  ];
  for (const note of tune)
    await page
      .getByRole('button', { name: `Play ${note}`, exact: true })
      .click();
  await expect(page.getByText('Page 3 of 6', { exact: true })).toBeVisible();
  expect(
    await page.locator('[class*="__score__"]').evaluate((el) => el.scrollTop),
  ).toBe(0);
  const scoreBox = await page.locator('[class*="__score__"]').boundingBox();
  const headBox = await page
    .locator('[class*="__hit-notehead__"]')
    .boundingBox();
  expect(headBox?.y).toBeGreaterThanOrEqual(scoreBox?.y ?? Infinity);
  expect((headBox?.y ?? Infinity) + (headBox?.height ?? 0)).toBeLessThan(
    (scoreBox?.y ?? 0) + (scoreBox?.height ?? 0),
  );
});

test('MIDI requests access on load, retries permission, remembers selection and reconnects', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const other = Object.assign(new EventTarget(), {
      id: 'other',
      name: 'Other MIDI',
      manufacturer: 'Other',
      state: 'connected',
      close: async () => other,
    });
    const casio = Object.assign(new EventTarget(), {
      id: 'casio',
      name: 'Saved Casio',
      manufacturer: 'Casio',
      state: 'connected',
      close: async () => casio,
    });
    const access = {
      inputs: new Map([
        ['other', other],
        ['casio', casio],
      ]),
      onstatechange: null as (() => void) | null,
    };
    let requests = 0;
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      configurable: true,
      value: async () => {
        requests++;
        if (!localStorage.getItem('mock-midi-allowed') && requests === 1)
          throw new DOMException('A click is required', 'NotAllowedError');
        localStorage.setItem('mock-midi-allowed', 'yes');
        return access;
      },
    });
    Object.assign(window, {
      midiRequests: () => requests,
      unplugCasio: () => {
        access.inputs.delete('casio');
        access.onstatechange?.();
      },
      replugCasio: () => {
        access.inputs.set('casio', casio);
        access.onstatechange?.();
      },
      sendCasio: () =>
        casio.dispatchEvent(
          Object.assign(new Event('midimessage'), {
            data: new Uint8Array([0x90, 60, 100]),
          }),
        ),
      refreshPorts: () => access.onstatechange?.(),
    });
  });
  await openPractice(page);
  await openSettings(page);
  await page.getByRole('tab', { name: 'Keyboard', exact: true }).click();
  await expect(page.getByRole('status')).toContainText(
    'Click Connect keyboard',
  );
  await closeSettings(page);
  expect(
    await page.evaluate(() =>
      (window as unknown as { midiRequests(): number }).midiRequests(),
    ),
  ).toBe(1);
  await openSettings(page);
  await page
    .getByRole('button', { name: 'Connect keyboard', exact: true })
    .click();
  await expect(page.getByRole('combobox', { name: 'MIDI input' })).toHaveValue(
    'other',
  );
  await closeSettings(page);
  await openSettings(page);
  await page
    .getByRole('combobox', { name: 'MIDI input' })
    .selectOption('casio');
  await closeSettings(page);
  await openSettings(page);
  await expect(
    page.getByRole('combobox', { name: 'MIDI input', exact: true }),
  ).toHaveValue('casio');
  await closeSettings(page);
  await page.reload();
  await enterSong(page);
  await openSettings(page);
  await expect(page.getByRole('combobox', { name: 'MIDI input' })).toHaveValue(
    'casio',
  );
  await closeSettings(page);
  expect(
    await page.evaluate(() =>
      (window as unknown as { midiRequests(): number }).midiRequests(),
    ),
  ).toBe(1);
  await page.evaluate(() =>
    (window as unknown as { sendCasio(): void }).sendCasio(),
  );
  await expect(
    page.getByRole('button', { name: 'Play C4', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() =>
    (window as unknown as { refreshPorts(): void }).refreshPorts(),
  );
  await expect(
    page.getByRole('button', { name: 'Play C4', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() =>
    (window as unknown as { unplugCasio(): void }).unplugCasio(),
  );
  await openSettings(page);
  await expect(
    page.getByRole('combobox', { name: 'MIDI input', exact: true }),
  ).toHaveValue('other');
  await closeSettings(page);
  await expect(
    page.getByRole('button', { name: 'Play C4', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(() =>
    (window as unknown as { replugCasio(): void }).replugCasio(),
  );
  await openSettings(page);
  await expect(page.getByRole('combobox', { name: 'MIDI input' })).toHaveValue(
    'casio',
  );
  await closeSettings(page);
  expect(
    await page.evaluate(() =>
      (window as unknown as { midiRequests(): number }).midiRequests(),
    ),
  ).toBe(1);
});

test('Just explore writes MIDI chords and bass notes to a live score with download and clear', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const input = Object.assign(new EventTarget(), {
      id: 'live',
      name: 'Explore piano',
      manufacturer: 'Casio',
      state: 'connected',
    });
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: async () => ({
        inputs: new Map([['live', input]]),
        onstatechange: null,
      }),
    });
    Object.assign(window, {
      playMidi: (data: number[], atMs: number) => {
        const event = Object.assign(new Event('midimessage'), {
          data: new Uint8Array(data),
        });
        Object.defineProperty(event, 'timeStamp', { value: atMs });
        input.dispatchEvent(event);
      },
    });
  });
  await openPractice(page);
  await expectInput(page, 'Explore piano');
  await openActivity(page, 'explore');
  await expect(
    page
      .getByRole('img', {
        name: 'Live sheet music of what you played.',
        exact: true,
      })
      .locator('svg'),
  ).toBeVisible();
  const send = (data: number[], atMs: number) =>
    page.evaluate(
      ({ data, atMs }) =>
        (
          window as unknown as { playMidi(data: number[], atMs: number): void }
        ).playMidi(data, atMs),
      { data, atMs },
    );
  for (const [pitch, at] of [
    [60, 0],
    [64, 20],
    [67, 40],
  ])
    await send([0x90, pitch, 100], at);
  await expect(page.getByText('3 notes · 4/4')).toBeVisible();
  await expect(
    page.locator('[class*="__score__"] [class*="__live-hit__"]'),
  ).toHaveCount(3);
  await expect(
    page.locator('[class*="__explore-score__"] .vf-notehead'),
  ).toHaveCount(3);
  await expect(
    page.locator('[class*="__explore-score__"] [data-slot]'),
  ).toHaveCount(1);

  for (const [pitch, at] of [
    [60, 400],
    [64, 420],
    [67, 440],
  ])
    await send([0x80, pitch, 0], at);
  await send([0x90, 60, 100], 500);
  await send([0x80, 60, 0], 1500);
  await send([0x90, 48, 100], 1700);
  await send([0x80, 48, 0], 1950);
  await send([0x90, 62, 100], 7000);
  await send([0x80, 62, 0], 7250);
  await expect(page.getByText('6 notes · 4/4')).toBeVisible();
  await expect(
    page.locator('[class*="__explore-score__"] .vf-notehead'),
  ).toHaveCount(6);
  await expect(page.locator('[class*="__score__"] svg')).toHaveCount(1);
  const downloadPromise = page.waitForEvent('download');
  await openOptions(page);
  await page.getByRole('button', { name: 'MusicXML ↓', exact: true }).click();
  await closeOptions(page);
  const download = await downloadPromise;
  const xml = await readFile((await download.path())!, 'utf8');
  const content = await page.evaluate((xml) => {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    return {
      errors: doc.querySelectorAll('parsererror').length,
      attacks: [...doc.querySelectorAll('note')].filter(
        (note) => !note.querySelector('rest, tie[type="stop"]'),
      ).length,
      visibleRests: [...doc.querySelectorAll('note')].filter(
        (note) =>
          note.querySelector('rest') &&
          note.getAttribute('print-object') !== 'no',
      ).length,
      staves: doc.querySelector('staves')?.textContent,
      beats: doc.querySelector('time > beats')?.textContent,
    };
  }, xml);
  expect(content).toEqual({
    errors: 0,
    attacks: 6,
    visibleRests: 0,
    staves: '2',
    beats: '4',
  });
  await openOptions(page);
  await page
    .getByRole('combobox', { name: 'Score size' })
    .selectOption('compact');
  await closeOptions(page);
  await openOptions(page);
  await page.getByLabel('Multiline', { exact: true }).check();
  await closeOptions(page);
  await expect(
    page.locator('[class*="__score__"] [class*="__live-hit__"]'),
  ).toHaveCount(1);
  await page
    .getByRole('button', { name: 'New recording', exact: true })
    .click();
  await expect(page.getByText('0 notes · 4/4')).toBeVisible();
  await openOptions(page);
  await expect(page.getByRole('button', { name: 'MusicXML ↓' })).toBeDisabled();
  await closeOptions(page);
  await expect(page.locator('[class*="__score__"] svg')).toHaveCount(1);
});

test('raindrop Kid pages fit desktop, phone and landscape without scrolling or clipping', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await openPractice(page);
  await openSong(page, 'Räge-Rägetröpfli');
  await openOptions(page);
  await page.getByLabel('Multiline', { exact: true }).check();
  await closeOptions(page);
  const fits = () =>
    page.evaluate(() => {
      const score = document.querySelector<HTMLElement>('[class*="__score__"]');
      const svg = score?.querySelector('svg');
      const piano = document.querySelector<HTMLElement>(
        '[class*="__keyboard__"]',
      );
      if (!score || !svg || !piano) return false;
      const box = score.getBoundingClientRect();
      const music = svg.getBoundingClientRect();
      const keys = piano.getBoundingClientRect();
      return (
        document.documentElement.scrollWidth <= innerWidth &&
        document.documentElement.scrollHeight <= innerHeight &&
        music.width > 0 &&
        music.height > 0 &&
        music.left >= box.left - 1 &&
        music.top >= box.top - 1 &&
        music.right <= box.right + 1 &&
        music.bottom <= box.bottom + 1 &&
        keys.left >= 0 &&
        keys.right <= innerWidth + 1 &&
        keys.bottom <= innerHeight + 1 &&
        !['auto', 'scroll'].includes(getComputedStyle(score).overflowY) &&
        !['auto', 'scroll'].includes(getComputedStyle(score).overflowX) &&
        score.scrollTop === 0 &&
        score.scrollLeft === 0
      );
    });
  await expect.poll(fits).toBe(true);
  await page
    .getByRole('button', { name: 'Next score page', exact: true })
    .click();
  await expect(page.locator('[class*="__score__"]')).toContainText('Chöpf');
  await expect.poll(fits).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(fits).toBe(true);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(fits).toBe(true);
  await openOptions(page);
  await page.getByLabel('Multiline', { exact: true }).uncheck();
  await closeOptions(page);
  await expect(page.locator('[class*="__score__"]')).toContainText('tröpf');
  await expect.poll(fits).toBe(true);
});

test('Note hunt compares MIDI notes, rewards fresh guesses and lingers through held success without scrolling', async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const input = Object.assign(new EventTarget(), {
      id: 'hunt',
      name: 'Hunt piano',
      state: 'connected',
    });
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: async () => ({
        inputs: new Map([['hunt', input]]),
        onstatechange: null,
      }),
    });
    Object.assign(window, {
      huntMidi: (data: number[]) =>
        input.dispatchEvent(
          Object.assign(new Event('midimessage'), {
            data: new Uint8Array(data),
          }),
        ),
    });
  });
  await openPractice(page);
  await expectInput(page, 'Hunt piano');
  await openActivity(page, 'hunt');
  await page
    .getByRole('combobox', { name: 'Note range', exact: true })
    .selectOption('first');
  const target = page.getByRole('region', { name: 'Find this', exact: true });
  const played = page.getByRole('region', { name: 'You played', exact: true });
  await expect(target).toContainText('C4 · middle C');
  await expect(target.locator('svg')).toBeVisible();
  await expect(played).toContainText('Your turn…');
  const send = (data: number[]) =>
    page.evaluate(
      (bytes) =>
        (window as unknown as { huntMidi(data: number[]): void }).huntMidi(
          bytes,
        ),
      data,
    );
  await send([0x90, 60, 100]);
  await send([0x90, 60, 100]); // Duplicate held message cannot earn extra points.
  await expect(page.getByLabel('3 points', { exact: true })).toBeVisible();
  await expect(
    page.getByLabel('3 hearts earned', { exact: true }),
  ).toBeVisible();
  await expect(played).toContainText('C4 · middle C');
  await expect(page.locator('[class*="__hunt-confetti__"] i')).toHaveCount(32);
  await page.clock.fastForward(5000);
  await expect(target).toContainText('C4 · middle C');
  await send([0x80, 60, 0]);
  await page.clock.fastForward(1500);
  await expect(target).toContainText('C4 · middle C');
  await page.clock.fastForward(101);
  await expect(target).toContainText('E4');
  await expect(played).toContainText('Your turn…');
  await send([0x90, 76, 100]); // E in the wrong octave.
  await expect(played).toContainText('E5');
  await expect(page.getByText('A little lower ↓')).toBeVisible();
  await send([0x90, 76, 100]);
  await send([0x80, 76, 0]);
  await send([0x90, 64, 100]);
  await expect(
    page.getByLabel('2 hearts earned', { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('5 points', { exact: true })).toBeVisible();
  await send([0x80, 64, 0]);
  await page.clock.fastForward(1601);
  await expect(target).toContainText('C4 · middle C');
  for (let i = 0; i < 3; i++) {
    await send([0x90, 62, 100]);
    await send([0x80, 62, 0]);
  }
  await send([0x90, 60, 100]);
  await send([0x80, 60, 0]);
  await expect(
    page.getByLabel('0 hearts earned', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Found it! ✨', { exact: true })).toBeVisible();
  await expect(page.getByLabel('5 points', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(played.locator('svg')).toBeVisible();
  expect(
    await page.evaluate(() => {
      const bounds = [
        ...document.querySelectorAll(
          '[class*="__hunt-card__"], [class*="__keyboard__"]',
        ),
      ].map((e) => e.getBoundingClientRect());
      return (
        document.documentElement.scrollWidth <= innerWidth &&
        document.documentElement.scrollHeight <= innerHeight &&
        bounds.every(
          (b) =>
            b.left >= 0 &&
            b.right <= innerWidth &&
            b.top >= 0 &&
            b.bottom <= innerHeight,
        )
      );
    }),
  ).toBe(true);
  await page
    .getByRole('combobox', { name: 'Note range', exact: true })
    .selectOption('octave');
  await expect(page.getByLabel('0 points', { exact: true })).toBeVisible();
  await expect(target).toContainText('C4 · middle C');
  await page.clock.fastForward(3000); // Old success timer must not advance a reset game.
  await expect(target).toContainText('C4 · middle C');
  await page.keyboard.press('a');
  await expect(
    page.getByLabel('3 hearts earned', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Restart note hunt', exact: true })
    .click();
  await expect(page.getByLabel('0 points', { exact: true })).toBeVisible();
  await openSong(page, 'Twinkle, Twinkle');
  await page.clock.fastForward(3000);
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
});

test('piano zoom fits full MIDI ranges and remembers calibrated endpoints per keyboard', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const inputs = ['casio', 'other'].map((id) =>
      Object.assign(new EventTarget(), {
        id,
        name: `${id} keys`,
        manufacturer: id,
        state: 'connected',
      }),
    );
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: async () => ({
        inputs: new Map(inputs.map((input) => [input.id, input])),
        onstatechange: null,
      }),
    });
    Object.assign(window, {
      keyMidi: (data: number[]) =>
        inputs[0].dispatchEvent(
          Object.assign(new Event('midimessage'), {
            data: new Uint8Array(data),
          }),
        ),
    });
  });
  await openPractice(page);
  await expectInput(page, 'casio keys');
  const keys = page.locator('[class*="__piano-key__"]');
  await expect(keys).toHaveCount(25);
  const send = (data: number[]) =>
    page.evaluate(
      (bytes) =>
        (window as unknown as { keyMidi(data: number[]): void }).keyMidi(bytes),
      data,
    );
  await page.getByRole('button', { name: 'All 61 keys', exact: true }).click();
  await expect(keys).toHaveCount(61);
  await expect(
    page.getByRole('button', { name: 'Play C2', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Play C7', exact: true }),
  ).toBeVisible();
  await send([0x90, 36, 100]);
  await expect(
    page.getByRole('button', { name: 'Play C2', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page
    .getByRole('button', { name: 'Close · middle C', exact: true })
    .click();
  await expect(keys).toHaveCount(25);
  await page.getByRole('button', { name: 'All 61 keys', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Play C2', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await send([0x80, 36, 0]);
  await page
    .getByRole('button', { name: 'Set keyboard range', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Play end keys to set range', exact: true })
    .click();
  await expect(
    page.getByText('Play the lowest key', { exact: true }),
  ).toBeVisible();
  await send([0x90, 60, 100]);
  await send([0x80, 60, 0]);
  await expect(
    page.getByText('Now play the highest key', { exact: true }),
  ).toBeVisible();
  await send([0x90, 59, 100]);
  await send([0x80, 59, 0]);
  await expect(
    page.getByText('Play the highest key, above the first one.', {
      exact: true,
    }),
  ).toBeVisible();
  await send([0x90, 84, 100]);
  await send([0x80, 84, 0]);
  await expect(keys).toHaveCount(25);
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
  await send([0x90, 36, 100]);
  await send([0x80, 36, 0]);
  await expect(
    page.getByRole('button', { name: 'All 49 keys', exact: true }),
  ).toBeVisible();
  await expect(keys).toHaveCount(49);
  await openSettings(page);
  await page
    .getByRole('combobox', { name: 'MIDI input', exact: true })
    .selectOption('other');
  await closeSettings(page);
  await expect(keys).toHaveCount(61);
  await page
    .getByRole('button', { name: 'Set keyboard range', exact: true })
    .click();
  await page
    .getByRole('combobox', { name: 'Keyboard range', exact: true })
    .selectOption('21:108');
  await expect(keys).toHaveCount(88);
  await openSettings(page);
  await page
    .getByRole('combobox', { name: 'MIDI input', exact: true })
    .selectOption('casio');
  await closeSettings(page);
  await expect(keys).toHaveCount(49);
  await page.reload();
  await enterSong(page);
  await expect(keys).toHaveCount(49);
  await expect(
    page.getByRole('button', { name: 'All 49 keys', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('[class*="__score__"] svg')).toBeVisible();
  expect(
    await page.evaluate(() => {
      const piano = document
        .querySelector('[class*="__keyboard__"]')!
        .getBoundingClientRect();
      const keys = [
        ...document.querySelectorAll('[class*="__piano-key__"]'),
      ].map((key) => key.getBoundingClientRect());
      return (
        document.documentElement.scrollHeight <= innerHeight &&
        document.documentElement.scrollWidth <= innerWidth &&
        piano.bottom <= innerHeight &&
        keys.every(
          (key) => key.left >= piano.left && key.right <= piano.right + 1,
        )
      );
    }),
  ).toBe(true);
});

test('Explore keeps a fixed grid, saves every page, restores sessions and plays without recording itself', async ({
  page,
}) => {
  await page.clock.install();
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => {
    const input = Object.assign(new EventTarget(), {
      id: 'session-midi',
      name: 'Session piano',
      manufacturer: 'Test',
      state: 'connected',
    });
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: async () => ({
        inputs: new Map([[input.id, input]]),
        onstatechange: null,
      }),
    });
    Object.assign(window, {
      sessionMidi: (data: number[], at: number) => {
        const event = Object.assign(new Event('midimessage'), {
          data: new Uint8Array(data),
        });
        Object.defineProperty(event, 'timeStamp', { value: at });
        input.dispatchEvent(event);
      },
    });
  });
  await openPractice(page);
  await expectInput(page, 'Session piano');
  await openActivity(page, 'explore');
  const score = page.locator('[class*="__explore-score__"]');
  await expect(score.locator('svg')).toBeVisible();
  await expect(score).toHaveAttribute('data-measures', '2');
  await expect(score.locator('svg')).toHaveAttribute('viewBox', '0 0 640 240');
  const bounds = await score.locator('svg').boundingBox();
  await score
    .locator('svg')
    .evaluate((svg) => svg.setAttribute('data-stable-grid', 'yes'));
  const send = (data: number[], at: number) =>
    page.evaluate(
      ({ data, at }) =>
        (
          window as unknown as { sessionMidi(data: number[], at: number): void }
        ).sessionMidi(data, at),
      { data, at },
    );
  const attack = async (note: number, at: number) => {
    await send([0x90, note, 100], at);
    await send([0x80, note, 0], at + 200);
  };
  await attack(60, 0);
  await expect(score.locator('[data-slot="0"] .vf-notehead')).toBeVisible();
  const first = await score
    .locator('[data-slot="0"] .vf-notehead')
    .boundingBox();
  for (const [index, note] of [64, 67, 48, 50, 62, 65, 69].entries())
    await attack(note, (index + 1) * 500);
  await expect(score.locator('[data-slot]')).toHaveCount(8);
  const later = await score
    .locator('[data-slot="0"] .vf-notehead')
    .boundingBox();
  expect(first).not.toBeNull();
  expect(later).not.toBeNull();
  // Highlight ink can change its extent; the note's center must stay fixed.
  expect(later!.x + later!.width / 2).toBeCloseTo(
    first!.x + first!.width / 2,
    2,
  );
  expect(later!.y + later!.height / 2).toBeCloseTo(
    first!.y + first!.height / 2,
    2,
  );
  expect(await score.locator('svg').boundingBox()).toEqual(bounds);
  await expect(score.locator('svg')).toHaveAttribute('data-stable-grid', 'yes');
  await expect(score.locator('[data-slot]')).toHaveCount(8);
  await attack(72, 4000);
  await expect(score).toHaveAttribute('data-page-start', '8');
  await expect(score.locator('[data-slot]')).toHaveCount(1);
  await expect(page.getByText('9 notes · 4/4', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear page', exact: true }).click();
  await expect(score.locator('[data-slot]')).toHaveCount(0);
  await expect(page.getByText('9 notes · 4/4', { exact: true })).toBeVisible();
  await attack(74, 4500);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await page.reload();
  await enterSong(page);
  await openActivity(page, 'explore');
  await expect(page.getByText('10 notes · 4/4', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Recordings', exact: true }).click();
  const menu = page.getByRole('dialog', { name: 'Recordings', exact: true });
  await expect(
    menu.getByRole('combobox', { name: 'Saved recordings' }).locator('option'),
  ).toHaveCount(1);
  const exported = page.waitForEvent('download');
  await menu
    .getByRole('button', { name: 'Download recording', exact: true })
    .click();
  const downloaded = await exported;
  const path = (await downloaded.path())!;
  const file = JSON.parse(await readFile(path, 'utf8'));
  expect(file.notes).toHaveLength(10);
  expect(file.notes[0].onsetMs).toBe(0);
  expect(file.notes.at(-1).offsetMs).toBe(4700);
  await menu
    .getByRole('button', { name: 'Close recordings', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'New recording', exact: true })
    .click();
  await expect(page.getByText('0 notes · 4/4', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Recordings', exact: true }).click();
  await menu.getByRole('button', { name: 'Load', exact: true }).click();
  await expect(page.getByText('10 notes · 4/4', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Recordings', exact: true }).click();
  await menu.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Stop playback', exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(500);
  await expect(
    page.getByRole('button', { name: 'Play E4', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('10 notes · 4/4', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Stop playback', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Play E4', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Recordings', exact: true }).click();
  await menu
    .getByLabel('Open recording file', { exact: true })
    .setInputFiles(path);
  await expect(menu).toHaveCount(0);
  await expect(page.getByText('10 notes · 4/4', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Recordings', exact: true }).click();
  await expect(
    menu.getByRole('combobox', { name: 'Saved recordings' }).locator('option'),
  ).toHaveCount(2);
  await menu.getByRole('button', { name: 'Delete', exact: true }).click();
  await menu
    .getByRole('button', { name: 'Delete recording', exact: true })
    .click();
  await expect(
    menu.getByRole('combobox', { name: 'Saved recordings' }).locator('option'),
  ).toHaveCount(1);
  await menu
    .getByRole('button', { name: 'Close recordings', exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(score).toHaveAttribute('data-measures', '1');
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollHeight <= innerHeight &&
        document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('MIDI auto selection upgrades a legacy Through default on hotplug and respects an explicit virtual port', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const through = Object.assign(new EventTarget(), {
      id: 'through',
      name: 'Midi Through Port-0',
      manufacturer: 'ALSA',
      state: 'connected',
    });
    const casio = Object.assign(new EventTarget(), {
      id: 'casio',
      name: 'CASIO USB-MIDI',
      manufacturer: 'Casio',
      state: 'connected',
    });
    if (!localStorage.getItem('midi-selection-fixture')) {
      localStorage.setItem('midi-selection-fixture', 'yes');
      localStorage.setItem(
        'kidmidi.midi-input.v1',
        JSON.stringify({
          id: through.id,
          name: through.name,
          manufacturer: through.manufacturer,
        }),
      );
    }
    const access = {
      inputs: new Map([['through', through]]),
      onstatechange: null as (() => void) | null,
    };
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: async () => access,
    });
    Object.assign(window, {
      plugRealKeyboard: () => {
        access.inputs.set('casio', casio);
        access.onstatechange?.();
      },
      sendRealKey: () =>
        casio.dispatchEvent(
          Object.assign(new Event('midimessage'), {
            data: new Uint8Array([0x90, 60, 100]),
          }),
        ),
    });
  });
  const plug = () =>
    page.evaluate(() =>
      (window as unknown as { plugRealKeyboard(): void }).plugRealKeyboard(),
    );
  await openPractice(page);
  await openSettings(page);
  await expect(
    page.getByRole('combobox', { name: 'MIDI input', exact: true }),
  ).toHaveValue('through');
  await closeSettings(page);
  await plug();
  await openSettings(page);
  await expect(
    page.getByRole('combobox', { name: 'MIDI input', exact: true }),
  ).toHaveValue('casio');
  await closeSettings(page);
  await page.evaluate(() =>
    (window as unknown as { sendRealKey(): void }).sendRealKey(),
  );
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '1',
  );
  const preference = () =>
    page.evaluate(() =>
      JSON.parse(localStorage.getItem('kidmidi.midi-input.v1')!),
    );
  expect(await preference()).toMatchObject({
    id: 'casio',
    selection: 'automatic',
  });
  await openSettings(page);
  await page
    .getByRole('combobox', { name: 'MIDI input', exact: true })
    .selectOption('through');
  await closeSettings(page);
  expect(await preference()).toMatchObject({
    id: 'through',
    selection: 'manual',
  });
  await page.reload();
  await enterSong(page);
  await plug();
  await openSettings(page);
  await expect(
    page.getByRole('combobox', { name: 'MIDI input', exact: true }),
  ).toHaveValue('through');
  await closeSettings(page);
});

test('phrase previews use matching MIDI output, stop safely and retain a speaker override', async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const log: { port: string; type: string; data?: number[]; at?: number }[] =
      [];
    let speakers = 0;
    const NativeContext = window.AudioContext;
    class ProbeContext extends NativeContext {
      createOscillator() {
        speakers++;
        return super.createOscillator();
      }
    }
    Object.defineProperty(window, 'AudioContext', { value: ProbeContext });
    const input = Object.assign(new EventTarget(), {
      id: 'casio-in',
      name: 'CASIO USB-MIDI Input',
      manufacturer: 'Casio',
      state: 'connected',
    });
    const makeOutput = (id: string, name: string, manufacturer: string) => ({
      id,
      name,
      manufacturer,
      state: 'connected',
      open: async function () {
        access.onstatechange?.();
        return this;
      },
      send: function (data: number[], at?: number) {
        if (this.state !== 'connected') throw new Error('disconnected');
        log.push({ port: id, type: 'send', data: [...data], at });
      },
      clear: () => log.push({ port: id, type: 'clear' }),
    });
    const keyboard = makeOutput('casio-out', 'CASIO USB-MIDI Output', 'Casio');
    const through = makeOutput('through', 'Midi Through Port-0', 'ALSA');
    const other = makeOutput('other', 'Other synth', 'Other');
    const access = {
      inputs: new Map([[input.id, input]]),
      outputs: new Map([
        ['through', through],
        ['other', other],
        ['casio-out', keyboard],
      ]),
      onstatechange: null as (() => void) | null,
    };
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: async () => access,
    });
    Object.assign(window, {
      previewLog: () => log,
      previewSpeakers: () => speakers,
      echoPreview: () =>
        input.dispatchEvent(
          Object.assign(new Event('midimessage'), {
            data: new Uint8Array([0x90, 60, 100]),
          }),
        ),
      unplugOutput: () => {
        keyboard.state = 'disconnected';
        access.outputs.delete('casio-out');
        access.onstatechange?.();
      },
    });
  });
  const messages = () =>
    page.evaluate(() =>
      (
        window as unknown as {
          previewLog(): {
            port: string;
            type: string;
            data?: number[];
            at?: number;
          }[];
        }
      ).previewLog(),
    );
  const speakers = () =>
    page.evaluate(() =>
      (window as unknown as { previewSpeakers(): number }).previewSpeakers(),
    );
  await openPractice(page);
  await openSettings(page, 'Output');
  await expect(
    page.getByRole('button', { name: 'Auto', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await closeSettings(page);
  await page
    .getByRole('button', { name: 'Hear this phrase', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Stop preview', exact: true }),
  ).toBeVisible();
  await expect
    .poll(
      async () =>
        (await messages()).filter((event) => event.type === 'send').length,
    )
    .toBe(14);
  expect((await messages()).every((event) => event.port === 'casio-out')).toBe(
    true,
  );
  expect(await speakers()).toBe(0);
  await page.evaluate(() =>
    (window as unknown as { echoPreview(): void }).echoPreview(),
  );
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
  await page.getByRole('button', { name: 'Stop preview', exact: true }).click();
  expect((await messages()).some((event) => event.type === 'clear')).toBe(true);
  expect(
    (await messages())
      .filter((event) => event.type === 'send' && event.at === undefined)
      .every((event) => event.data?.[0] === 0x80),
  ).toBe(true);
  const sent = (await messages()).length;
  await openSettings(page, 'Output');
  await page.getByRole('button', { name: 'Screen', exact: true }).click();
  await closeSettings(page);
  await page
    .getByRole('button', { name: 'Hear this phrase', exact: true })
    .click();
  expect(await speakers()).toBe(14);
  expect((await messages()).length).toBe(sent);
  await page.getByRole('button', { name: 'Stop preview', exact: true }).click();
  await page.reload();
  await enterSong(page);
  await openSettings(page, 'Output');
  await expect(
    page.getByRole('button', { name: 'Screen', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await closeSettings(page);
  await openSettings(page, 'Output');
  await page.getByRole('button', { name: 'Auto', exact: true }).click();
  await closeSettings(page);
  await page
    .getByRole('button', { name: 'Hear this phrase', exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await messages()).filter((event) => event.type === 'send').length,
    )
    .toBe(14);
  await page.evaluate(() =>
    (window as unknown as { unplugOutput(): void }).unplugOutput(),
  );
  await expect(
    page.getByRole('button', { name: 'Hear this phrase', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Hear this phrase', exact: true })
    .click();
  expect(await speakers()).toBe(14);
  expect(
    (await messages()).some(
      (event) => event.port === 'other' || event.port === 'through',
    ),
  ).toBe(false);
  await page.getByRole('button', { name: 'Stop preview', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('[class*="__score__"] svg')).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollHeight <= innerHeight &&
        document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

async function enterSong(page: Page, title = 'Twinkle, Twinkle') {
  await page.getByRole('button', { name: 'Play a song', exact: true }).click();
  await page.getByRole('button', { name: title, exact: true }).click();
}
async function openPractice(page: Page) {
  await page.goto('/');
  await enterSong(page);
}
async function openSong(page: Page, title: string) {
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await enterSong(page, title);
}
async function openActivity(page: Page, activity: 'explore' | 'hunt') {
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page
    .getByRole('button', {
      name: activity === 'hunt' ? 'Note hunt' : 'Just explore',
      exact: true,
    })
    .click();
  if (activity === 'hunt')
    await page
      .getByRole('button', { name: 'Practice note hunt', exact: true })
      .click();
}
async function openOptions(page: Page) {
  const details = page.locator('[class*="__options__"]');
  if (!(await details.getAttribute('open').then((v) => v !== null)))
    await details.locator('summary').click();
}
async function closeOptions(page: Page) {
  const details = page.locator('[class*="__options__"]');
  if (await details.getAttribute('open').then((v) => v !== null))
    await details.locator('summary').click();
}
async function openSettings(
  page: Page,
  tab: 'Keyboard' | 'Output' = 'Keyboard',
) {
  await page
    .getByRole('button', { name: 'Sound and settings', exact: true })
    .click();
  await page.getByRole('tab', { name: tab, exact: true }).click();
}
async function closeSettings(page: Page) {
  await page
    .getByRole('button', { name: 'Close sound and settings', exact: true })
    .click();
}

async function expectInput(page: Page, name: string) {
  await openSettings(page);
  await expect(
    page
      .getByRole('combobox', { name: 'MIDI input', exact: true })
      .locator('option:checked'),
  ).toHaveText(name);
  await closeSettings(page);
}
