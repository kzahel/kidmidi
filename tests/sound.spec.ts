import { expect, type Page, test } from '@playwright/test';

type Probe = {
  messages: number[][];
  voices: { wave: string; frequency: number }[];
};
async function probe(page: Page): Promise<Probe> {
  return page.evaluate(() =>
    (window as unknown as { soundProbe(): Probe }).soundProbe(),
  );
}
async function midi(page: Page, data: number[]) {
  await page.evaluate(
    (message) =>
      (window as unknown as { soundMidi(data: number[]): void }).soundMidi(
        message,
      ),
    data,
  );
}
async function settings(page: Page) {
  await page
    .getByRole('button', { name: 'Sound and settings', exact: true })
    .click();
}
async function done(page: Page) {
  await page
    .getByRole('button', { name: 'Close sound and settings', exact: true })
    .click();
}
async function route(page: Page, name: string) {
  await settings(page);
  await page.getByRole('tab', { name: 'Output', exact: true }).click();
  await page.getByRole('button', { name, exact: true }).click();
  await done(page);
}
async function installProbe(page: Page) {
  await page.addInitScript(() => {
    const oscillators: OscillatorNode[] = [];
    const NativeContext = window.AudioContext;
    class ProbeContext extends NativeContext {
      createOscillator() {
        const oscillator = super.createOscillator();
        oscillators.push(oscillator);
        return oscillator;
      }
    }
    Object.defineProperty(window, 'AudioContext', { value: ProbeContext });
    const input = Object.assign(new EventTarget(), {
      id: 'piano-in',
      name: 'Playful Piano Input',
      manufacturer: 'Kidmidi',
      state: 'connected',
    });
    const receive = (data: number[]) =>
      input.dispatchEvent(
        Object.assign(new Event('midimessage'), { data: new Uint8Array(data) }),
      );
    const messages: number[][] = [];
    const output = {
      id: 'piano-out',
      name: 'Playful Piano Output',
      manufacturer: 'Kidmidi',
      state: 'connected',
      open: async () => output,
      send: (data: number[], when?: number) => {
        messages.push([...data]);
        if (when === undefined) receive(data);
      },
      clear() {},
    };
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: async () => ({
        inputs: new Map([[input.id, input]]),
        outputs: new Map([[output.id, output]]),
        onstatechange: null,
      }),
    });
    Object.assign(window, {
      soundMidi: receive,
      soundProbe: () => ({
        messages,
        voices: oscillators
          .filter((o) => o.frequency.value > 20)
          .map((o) => ({ wave: o.type, frequency: o.frequency.value })),
      }),
    });
  });
}

test('sound tabs work without MIDI and preserve custom sounds and drafts across panels', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'requestMIDIAccess', { value: undefined }),
  );
  await page.goto('/');
  await route(page, 'Screen');
  await settings(page);
  await page.getByRole('button', { name: 'Robot', exact: true }).click();
  await page.getByRole('tab', { name: 'Make', exact: true }).click();
  await page.getByRole('button', { name: 'Sine', exact: true }).click();
  await page.getByRole('tab', { name: 'Motion', exact: true }).click();
  await page.getByRole('slider', { name: 'Wobble', exact: true }).fill('0.35');
  await page
    .getByRole('slider', { name: 'Room · reverb', exact: true })
    .fill('0.5');
  await page.getByRole('tab', { name: 'Save', exact: true }).click();
  await page.getByRole('combobox', { name: 'Sound emoji' }).selectOption('👽');
  await page.getByRole('textbox', { name: 'Sound name' }).fill('Moon friend');
  await page.getByRole('tab', { name: 'Output', exact: true }).click();
  await page.getByRole('tab', { name: 'Make', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Sound name' })).toHaveValue(
    'Moon friend',
  );
  await page.getByRole('button', { name: 'Save sound', exact: true }).click();
  await page.getByRole('tab', { name: 'Sounds', exact: true }).click();
  await page.getByRole('tab', { name: 'My sounds', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '👽 Moon friend', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Try C4', exact: true }).focus();
  await page.keyboard.down('Space');
  await expect(
    page.getByRole('button', { name: 'Try C4', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  // Changing the main tab releases a held audition key.
  await page.getByRole('tab', { name: 'Output', exact: true }).click();
  await page.keyboard.up('Space');
  await page.getByRole('tab', { name: 'Sounds', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Try C4', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false');
  await done(page);
  await page.reload();
  await settings(page);
  await page.getByRole('tab', { name: 'My sounds', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '👽 Moon friend', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('tab', { name: 'Make', exact: true }).click();
  await page.getByRole('tab', { name: 'Motion', exact: true }).click();
  await expect(
    page.getByRole('slider', { name: 'Wobble', exact: true }),
  ).toHaveValue('0.35');
  await page.getByRole('tab', { name: 'Sounds', exact: true }).click();
  await page
    .getByRole('button', { name: 'Delete sound Moon friend', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: '👽 Moon friend', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('tab', { name: 'Sounds', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(
    page.getByRole('tab', { name: 'Make', exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole('tab', { name: 'Make', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(
    page.getByRole('tab', { name: 'Keyboard', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Sound and settings', exact: true }),
  ).toBeFocused();
  expect(errors).toEqual([]);
});

test('global sound reaches physical, touch and computer keys; settings auditions never advance practice', async ({
  page,
}) => {
  await installProbe(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Play a song', exact: true }).click();
  await page
    .getByRole('button', { name: 'Twinkle, Twinkle', exact: true })
    .click();
  await route(page, 'Screen');
  await midi(page, [0x90, 60, 44]);
  await midi(page, [0x80, 60, 0]);
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '1',
  );
  expect((await probe(page)).voices).toHaveLength(1);
  expect((await probe(page)).messages).toEqual([]);
  await settings(page);
  await page.getByRole('button', { name: 'Robot', exact: true }).click();
  await midi(page, [0x90, 60, 90]);
  await midi(page, [0x80, 60, 0]);
  await page.getByRole('button', { name: 'Try C4', exact: true }).click();
  await done(page);
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '1',
  );
  expect((await probe(page)).voices.at(-1)?.wave).toBe('square');
  await route(page, 'Both');
  const before = (await probe(page)).voices.length;
  await page.keyboard.down('a');
  await expect
    .poll(
      async () =>
        (await probe(page)).messages.filter((m) => m[0] === 0x90).length,
    )
    .toBe(1);
  await expect(page.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '2',
  );
  await page.keyboard.up('a');
  expect((await probe(page)).voices).toHaveLength(before + 1);
  expect((await probe(page)).messages.at(-1)).toEqual([0x80, 60, 0]);
  await route(page, 'Keyboard');
  const keyboardVoices = (await probe(page)).voices.length;
  await midi(page, [0x90, 67, 90]);
  await midi(page, [0x80, 67, 0]);
  expect((await probe(page)).voices).toHaveLength(keyboardVoices);
  await page.keyboard.down('g');
  await expect
    .poll(
      async () =>
        (await probe(page)).messages.filter((m) => m[0] === 0x90).length,
    )
    .toBe(2);
  await page.keyboard.up('g');
  expect((await probe(page)).voices).toHaveLength(keyboardVoices);
  await route(page, 'Quiet');
  const quiet = await probe(page);
  await page.getByRole('button', { name: 'Play A4', exact: true }).click();
  await midi(page, [0x90, 69, 90]);
  await midi(page, [0x80, 69, 0]);
  expect(await probe(page)).toEqual(quiet);
  expect(errors).toEqual([]);
});

test('Explore playback follows the global route and its MIDI echoes never enter the recording', async ({
  page,
}) => {
  await page.clock.install();
  await installProbe(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Just explore', exact: true }).click();
  await route(page, 'Both');
  await page.keyboard.down('a');
  await expect
    .poll(
      async () =>
        (await probe(page)).messages.filter((m) => m[0] === 0x90).length,
    )
    .toBe(1);
  await page.clock.runFor(800);
  await page.keyboard.up('a');
  await expect(page.getByText('1 notes · 4/4', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Recordings', exact: true }).click();
  const menu = page.getByRole('dialog', { name: 'Recordings', exact: true });
  await expect(
    menu.getByRole('button', { name: 'Play', exact: true }),
  ).toBeEnabled();
  await menu.getByRole('button', { name: 'Play', exact: true }).click();
  await expect
    .poll(
      async () =>
        (await probe(page)).messages.filter((m) => m[0] === 0x90).length,
    )
    .toBe(2);
  await expect(
    page.getByRole('button', { name: 'Stop playback', exact: true }),
  ).toBeVisible();
  await page.clock.runFor(1000);
  await expect(
    page.getByRole('button', { name: 'Stop playback', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText('1 notes · 4/4', { exact: true })).toBeVisible();
  expect((await probe(page)).voices).toHaveLength(2);
  expect(
    (await probe(page)).messages.filter((m) => m[0] === 0x80),
  ).toHaveLength(2);
  await route(page, 'Screen');
  const sent = (await probe(page)).messages.length;
  await page.getByRole('button', { name: 'Recordings', exact: true }).click();
  await menu.getByRole('button', { name: 'Play', exact: true }).click();
  await page.clock.runFor(1000);
  expect((await probe(page)).messages).toHaveLength(sent);
  expect((await probe(page)).voices).toHaveLength(3);
  await expect(page.getByText('1 notes · 4/4', { exact: true })).toBeVisible();
});

test('browser synth renders distinct presets, true zero volume, and complete previews longer than the live polyphony limit', async ({
  page,
}) => {
  await page.goto('/');
  const results = await page.evaluate(async () => {
    const audioModule = '/src/audio.ts';
    const settingsModule = '/src/sound-settings.ts';
    const { PianoAudio } = await import(audioModule);
    const { soundPresets } = await import(settingsModule);
    const NativeContext = window.AudioContext;
    let offline: OfflineAudioContext;
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: class {
        constructor() {
          offline = new OfflineAudioContext(1, 44100 * 6, 44100);
          // Only this harness drives offline rendering, rather than play().
          offline.resume = async () => {};
          return offline;
        }
      },
    });
    const energies: number[] = [];
    try {
      for (const preset of soundPresets) {
        const synth = new PianoAudio();
        synth.configure(preset.voice, 0.65);
        synth.play('test', 60, undefined, 0.3, 90);
        const buffer = await offline!.startRendering();
        const samples = buffer.getChannelData(0);
        energies.push(
          samples.reduce((sum, sample) => sum + sample * sample, 0),
        );
      }
      const silent = new PianoAudio();
      silent.configure(soundPresets[0].voice, 0);
      silent.play('zero-volume', 60, undefined, 0.3);
      const silentBuffer = await offline!.startRendering();
      const silentEnergy = silentBuffer
        .getChannelData(0)
        .reduce((sum, sample) => sum + sample * sample, 0);
      const preview = new PianoAudio();
      preview.hear(
        Array.from({ length: 40 }, () => ({ midi: 60, beats: 0.25 })),
      );
      const previewBuffer = await offline!.startRendering();
      const firstNote = previewBuffer.getChannelData(0).slice(4000, 7000);
      const firstNoteEnergy = firstNote.reduce(
        (sum, sample) => sum + sample * sample,
        0,
      );
      const repeated = new PianoAudio();
      repeated.play('same-key', 60);
      const paused = offline!.suspend(0.1);
      const rendering = offline!.startRendering();
      await paused;
      repeated.stop('same-key');
      repeated.play('same-key', 60);
      repeated.stopAll();
      await OfflineAudioContext.prototype.resume.call(offline!);
      const stoppedBuffer = await rendering;
      const stoppedTail = stoppedBuffer.getChannelData(0).slice(44100 * 0.3);
      const stoppedEnergy = stoppedTail.reduce(
        (sum, sample) => sum + sample * sample,
        0,
      );
      return { energies, silentEnergy, firstNoteEnergy, stoppedEnergy };
    } finally {
      Object.defineProperty(window, 'AudioContext', {
        configurable: true,
        value: NativeContext,
      });
    }
  });
  expect(
    results.energies.every(
      (energy) => energy > 0.01 && Number.isFinite(energy),
    ),
  ).toBe(true);
  expect(
    new Set(results.energies.map((energy) => energy.toFixed(4))).size,
  ).toBe(7);
  expect(results.silentEnergy).toBe(0);
  expect(results.firstNoteEnergy).toBeGreaterThan(0.01);
  expect(results.stoppedEnergy).toBeLessThan(0.000001);
});

test('every settings panel and a full saved shelf fit without scrolling or overlapping on desktop and phones', async ({
  page,
}, info) => {
  await installProbe(page);
  await page.goto('/');
  await page.evaluate(async () => {
    const module = '/src/sound-settings.ts';
    const { defaultSoundSettings, soundStorageKey } = await import(module);
    const settings = defaultSoundSettings();
    settings.route = 'both';
    settings.saved = Array.from({ length: 12 }, (_, i) => ({
      ...settings.sound,
      id: `saved-${i}`,
      name: `My very long sound number ${i + 1}`,
      emoji: '👽',
    }));
    localStorage.setItem(soundStorageKey, JSON.stringify(settings));
  });
  await page.reload();
  await settings(page);
  const dialog = page.getByRole('dialog', { name: 'Sound and settings' });
  async function fits(label: string) {
    const problems = await dialog.evaluate((element) => {
      const failures: string[] = [];
      const box = element.getBoundingClientRect();
      if (
        box.left < 0 ||
        box.top < 0 ||
        box.right > innerWidth ||
        box.bottom > innerHeight
      )
        failures.push('dialog outside viewport');
      for (const panel of [
        element,
        ...element.querySelectorAll<HTMLElement>('[role="tabpanel"], section'),
      ]) {
        if (
          panel.scrollHeight > panel.clientHeight + 1 ||
          panel.scrollWidth > panel.clientWidth + 1
        )
          failures.push(
            `overflow: ${panel.id || panel.getAttribute('aria-label') || panel.tagName} (${panel.scrollWidth}/${panel.clientWidth} wide, ${panel.scrollHeight}/${panel.clientHeight} tall)`,
          );
      }
      for (const control of element.querySelectorAll<HTMLElement>(
        'button, input, select, canvas, [role="tabpanel"]',
      )) {
        const rect = control.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (
          rect.left < box.left ||
          rect.top < box.top ||
          rect.right > box.right ||
          rect.bottom > box.bottom
        )
          failures.push(
            `clipped: ${control.getAttribute('aria-label') || control.textContent?.trim()}`,
          );
      }
      const work = element
        .querySelector('[id="sound-tools-panel"], [id="sound-bank-panel"]')
        ?.getBoundingClientRect();
      const keys = element
        .querySelector('[aria-label="Try your sound"]')
        ?.getBoundingClientRect();
      if (
        work &&
        keys &&
        work.left < keys.right &&
        work.right > keys.left &&
        work.bottom > keys.top
      )
        failures.push('controls overlap try keys');
      return failures;
    });
    if (problems.length)
      await page.screenshot({ path: info.outputPath('layout-failure.png') });
    expect(problems, label).toEqual([]);
  }
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    const size = `${viewport.width}x${viewport.height}`;
    await page.getByRole('tab', { name: 'Sounds', exact: true }).click();
    await page.getByRole('tab', { name: 'Presets', exact: true }).click();
    await fits(`${size} presets`);
    await page.getByRole('tab', { name: 'My sounds', exact: true }).click();
    for (let i = 0; i < 3; i++) {
      await expect(
        page.getByRole('button', {
          name: `👽 My very long sound number ${i * 4 + 1}`,
          exact: true,
        }),
      ).toBeVisible();
      await fits(`${size} saved page ${i + 1}`);
      if (i < 2)
        await page
          .getByRole('button', { name: 'Next sounds', exact: true })
          .click();
    }
    // Return to the first page for the next viewport.
    await page
      .getByRole('button', { name: 'Previous sounds', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Previous sounds', exact: true })
      .click();
    await page.getByRole('tab', { name: 'Make', exact: true }).click();
    for (const tab of ['Tone', 'Motion', 'Envelope', 'Save']) {
      await page.getByRole('tab', { name: tab, exact: true }).click();
      await fits(`${size} ${tab}`);
      if (tab === 'Save')
        await expect(
          page.getByRole('button', { name: 'Save sound', exact: true }),
        ).toBeDisabled();
      if (tab === 'Tone' && viewport.width !== 320)
        await page.screenshot({ path: info.outputPath(`make-${size}.png`) });
    }
    await page.getByRole('tab', { name: 'Output', exact: true }).click();
    await fits(`${size} Output`);
    await page.getByRole('tab', { name: 'Keyboard', exact: true }).click();
    await fits(`${size} Keyboard`);
    if (viewport.width === 390)
      await page.screenshot({ path: info.outputPath('keyboard-phone.png') });
  }
  await page.getByRole('tab', { name: 'Sounds', exact: true }).click();
  await page.getByRole('button', { name: 'Next sounds', exact: true }).click();
  await page.getByRole('button', { name: 'Next sounds', exact: true }).click();
  for (let i = 0; i < 4; i++)
    await page
      .getByRole('button', { name: /^Delete sound / })
      .first()
      .click();
  await expect(page.getByText('Page 2 of 2', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Next sounds', exact: true }),
  ).toBeDisabled();
  await fits('shelf after deleting its last page');
});
