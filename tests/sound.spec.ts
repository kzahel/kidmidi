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

test('sound settings work without MIDI, show wave shapes, save creations and fit desktop and phone', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'requestMIDIAccess', { value: undefined }),
  );
  await page.goto('/');
  await settings(page);
  await page.getByRole('button', { name: 'Screen', exact: true }).click();
  await page.getByRole('button', { name: 'Robot', exact: true }).click();
  await expect(
    page.getByRole('img', {
      name: 'square wave, showing Screen audio while playing',
    }),
  ).toBeVisible();
  await page.getByText('✎ Make a sound', { exact: true }).click();
  await page.getByRole('button', { name: 'Sine', exact: true }).click();
  await page.getByRole('slider', { name: 'Wobble', exact: true }).fill('0.35');
  await page
    .getByRole('slider', { name: 'Room · reverb', exact: true })
    .fill('0.5');
  await page.getByRole('combobox', { name: 'Sound emoji' }).selectOption('👽');
  await page.getByRole('textbox', { name: 'Sound name' }).fill('Moon friend');
  await page.getByRole('button', { name: 'Save sound', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '👽 Moon friend', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Try C4', exact: true }).focus();
  await page.keyboard.down('Space');
  await expect(
    page.getByRole('button', { name: 'Try C4', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.up('Space');
  await page.getByText('✎ Make a sound', { exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Sound and settings' })
    .evaluate((element) => {
      element.scrollTop = 0;
    });
  await page.screenshot({ path: info.outputPath('sound-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  const dialog = page.getByRole('dialog', { name: 'Sound and settings' });
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await dialog.evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({ path: info.outputPath('sound-phone.png') });
  await page.getByText('✎ Make a sound', { exact: true }).click();
  await page
    .getByRole('slider', { name: 'Wobble', exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('sound-editor-phone.png') });
  await done(page);
  await page.reload();
  await settings(page);
  await expect(
    page.getByRole('button', { name: 'Screen', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('button', { name: '👽 Moon friend', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByText('✎ Make a sound', { exact: true }).click();
  await expect(
    page.getByRole('slider', { name: 'Wobble', exact: true }),
  ).toHaveValue('0.35');
  await page
    .getByRole('button', { name: 'Delete sound Moon friend', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: '👽 Moon friend', exact: true }),
  ).toHaveCount(0);
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
