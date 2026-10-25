import { expect, test } from '@playwright/test';

test('real score renders, waits for correct fresh presses, and can restart', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.score svg').first()).toBeVisible();
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
  await page.getByRole('button', { name: /Just explore/ }).click();
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
  await page.goto('/');
  await expect(page.getByText('Test Casio')).toBeVisible();
  await expect(page.locator('.score svg')).toBeVisible();
  const cursor = page.locator('.score [id^="cursorImg"]');
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
  await expect(page.locator('.hint-notehead')).toHaveCount(1);
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
  await expect(page.locator('.hit-badge')).toHaveText('C4 ✓');
  await expect(page.locator('.score .hit-notehead')).toHaveCount(1);
  await expect(page.locator('.score .hit-held')).toHaveCount(1);
  expect((await cursor.boundingBox())?.x).toBe(originalX);
  await page.clock.fastForward(1500);
  await expect(page.locator('.hit-badge')).toHaveText('C4 ✓');
  expect((await cursor.boundingBox())?.x).toBe(originalX);
  await send([0x90, 60, 100]);
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '1',
  );
  await send([0x90, 60, 0]);
  await page.clock.fastForward(100);
  await expect(page.locator('.hit-badge')).toHaveCount(0);
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
  await expect(page.getByText(/No MIDI keyboard found/)).toBeVisible();
  await expect(page.locator('.hit-badge')).toHaveCount(0);
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
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Connect keyboard' }),
  ).toBeDisabled();
  await expect(page.locator('.score svg').first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: /Hot Cross Buns/ }).click();
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
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Räge-Rägetröpfli', exact: true })
    .click();
  await expect(page.getByText('Find A · octave 4')).toBeVisible();
  await expect(page.locator('.score svg').first()).toBeVisible();
  await expect(
    page.getByRole('img', { name: /Rain falling over two houses/ }),
  ).toBeVisible();
  await expect(page.locator('.score')).toContainText('tröpf');
  await expect(page.locator('.score')).toContainText('D');
  await page.getByLabel('Multiline', { exact: true }).check();
  await expect(page.locator('.score')).toContainText('Steind');
  await expect(page.locator('.score')).toContainText('Gass.');
  await expect(page.locator('.score svg')).toHaveCount(1);
  await expect(page.locator('.score')).toContainText('G');
  await expect(page.locator('.score')).not.toContainText('I. Spühler-Suter');
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
  await page
    .getByRole('combobox', { name: 'Score size' })
    .selectOption('compact');
  await page.getByLabel('Multiline', { exact: true }).uncheck();
  await expect(page.locator('.score')).not.toContainText('Gass.');
  await expect(page.locator('.score')).toContainText('tröpf');
  await expect(page.locator('.score svg')).toHaveCount(1);
  await expect
    .poll(
      async () =>
        (await page.locator('.score').boundingBox())?.height ?? Infinity,
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

test('notation sizes and multiline persist, and multiline follows a played note', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('combobox', { name: 'Score size' })).toHaveValue(
    'kid',
  );
  await page.keyboard.down('a');
  await expect(page.locator('.score .hit-notehead')).toHaveCount(1);
  const kidHeight =
    (await page.locator('.hit-notehead').boundingBox())?.height ?? 0;
  expect(kidHeight).toBeGreaterThan(0);
  await page
    .getByRole('combobox', { name: 'Score size' })
    .selectOption('compact');
  await expect
    .poll(
      async () =>
        (await page.locator('.hit-notehead').boundingBox())?.height ?? Infinity,
    )
    .toBeLessThan(kidHeight * 0.85);
  await page.keyboard.up('a');
  await page.getByLabel('Multiline', { exact: true }).check();
  await expect(page.locator('.score')).toContainText('How');
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Score size' })).toHaveValue(
    'compact',
  );
  await expect(page.getByLabel('Multiline', { exact: true })).toBeChecked();
  await page.getByRole('combobox', { name: 'Score size' }).selectOption('kid');
  await page.setViewportSize({ width: 1280, height: 600 });
  await expect(page.locator('.score svg')).toHaveCount(1);
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
  await expect
    .poll(() => page.locator('.score').evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
  const scoreBox = await page.locator('.score').boundingBox();
  const headBox = await page.locator('.hit-notehead').boundingBox();
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
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText(
    'Click Connect keyboard',
  );
  expect(
    await page.evaluate(() =>
      (window as unknown as { midiRequests(): number }).midiRequests(),
    ),
  ).toBe(1);
  await page
    .getByRole('button', { name: 'Connect keyboard', exact: true })
    .click();
  await expect(page.getByRole('combobox', { name: 'MIDI input' })).toHaveValue(
    'other',
  );
  await page
    .getByRole('combobox', { name: 'MIDI input' })
    .selectOption('casio');
  await expect(
    page.getByRole('button', { name: 'Saved Casio', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'MIDI input' })).toHaveValue(
    'casio',
  );
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
  await expect(
    page.getByRole('button', { name: 'Other MIDI', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Play C4', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(() =>
    (window as unknown as { replugCasio(): void }).replugCasio(),
  );
  await expect(page.getByRole('combobox', { name: 'MIDI input' })).toHaveValue(
    'casio',
  );
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
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Explore piano', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Just explore', exact: true }).click();
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
  await expect(page.locator('.score .hit-notehead')).toHaveCount(3);
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
  await expect(page.locator('.score svg')).toHaveCount(1);
  const href = await page
    .getByRole('link', { name: 'MusicXML ↓' })
    .getAttribute('href');
  const xml = decodeURIComponent(href?.split(',')[1] ?? '');
  const content = await page.evaluate((xml) => {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    return {
      errors: doc.querySelectorAll('parsererror').length,
      attacks: [...doc.querySelectorAll('note')].filter(
        (note) => !note.querySelector('rest, tie[type="stop"]'),
      ).length,
      staves: doc.querySelector('staves')?.textContent,
      beats: doc.querySelector('time > beats')?.textContent,
    };
  }, xml);
  expect(content).toEqual({ errors: 0, attacks: 6, staves: '2', beats: '4' });
  await page
    .getByRole('combobox', { name: 'Score size' })
    .selectOption('compact');
  await page.getByLabel('Multiline', { exact: true }).check();
  await expect(page.locator('.score .hit-notehead')).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Clear recording', exact: true })
    .click();
  await expect(page.getByText('0 notes · 4/4')).toBeVisible();
  await expect(page.getByRole('link', { name: 'MusicXML ↓' })).toHaveCount(0);
  await expect(page.locator('.score svg')).toHaveCount(1);
});
