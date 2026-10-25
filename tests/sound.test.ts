import assert from 'node:assert/strict';
import test from 'node:test';
import type { FeedbackClock } from '../src/feedback';
import { midiOutputStorageKey } from '../src/midi-device';
import type { PreviewOutput } from '../src/phrase-preview';
import { SoundOutput } from '../src/sound-output';
import {
  defaultSoundSettings,
  loadSoundSettings,
  parseSoundSettings,
  type SoundRoute,
  soundDestinations,
  soundPresets,
  soundStorageKey,
} from '../src/sound-settings';

function fixture(route: SoundRoute = 'both', open = async () => {}) {
  const messages: number[][] = [];
  const attacks: { id: string; pitch: number; velocity?: number }[] = [];
  const releases: string[] = [];
  const errors: string[] = [];
  let now = 1000;
  let timerId = 0;
  const timers = new Map<number, { at: number; callback(): void }>();
  const clock: FeedbackClock = {
    now: () => now,
    schedule: (callback, delay) => {
      timers.set(++timerId, { at: now + delay, callback });
      return timerId;
    },
    cancel: (id) => {
      timers.delete(id);
    },
  };
  const output = {
    open,
    send: (message: number[]) => messages.push([...message]),
  } as unknown as PreviewOutput;
  const speaker = {
    configure() {},
    unlock() {},
    play(
      id: string,
      pitch: number,
      _when?: number,
      _duration?: number,
      velocity?: number,
    ) {
      attacks.push({ id, pitch, velocity });
    },
    stop(id: string) {
      releases.push(id);
    },
    stopAll() {},
    close() {},
    hear() {},
    readWaveform() {
      return false;
    },
  };
  const sound = new SoundOutput(
    speaker,
    (message) => errors.push(message),
    clock,
  );
  const settings = { ...defaultSoundSettings(), route };
  sound.configure(settings, output);
  const advance = (ms: number) => {
    now += ms;
    for (const [id, timer] of timers)
      if (timer.at <= now) {
        timers.delete(id);
        timer.callback();
      }
  };
  return {
    sound,
    settings,
    output,
    messages,
    attacks,
    releases,
    errors,
    timers,
    advance,
  };
}
const flush = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

test('global routes cover physical keys, screen keys and playback without forwarding MIDI input', () => {
  for (const route of [
    'auto',
    'screen',
    'keyboard',
    'both',
    'quiet',
  ] as const) {
    assert.deepEqual(soundDestinations(route, 'midi', true), {
      screen: route === 'screen' || route === 'both',
      keyboard: false,
    });
  }
  assert.deepEqual(soundDestinations('auto', 'touch', true), {
    screen: true,
    keyboard: false,
  });
  assert.deepEqual(soundDestinations('auto', 'playback', true), {
    screen: false,
    keyboard: true,
  });
  assert.deepEqual(soundDestinations('keyboard', 'touch', false), {
    screen: true,
    keyboard: false,
  });
  assert.deepEqual(soundDestinations('quiet', 'playback', true), {
    screen: false,
    keyboard: false,
  });
});

test('Both plays velocity through speakers and MIDI once, and shares overlapping MIDI pitches until the final release', async () => {
  const f = fixture();
  f.sound.play('touch', 60, undefined, undefined, 55, 'touch');
  f.sound.play('computer', 60, undefined, undefined, 95, 'computer');
  await flush();
  assert.deepEqual(f.messages, [[0x90, 60, 55]]);
  assert.deepEqual(
    f.attacks.map((n) => n.velocity),
    [55, 95],
  );
  f.sound.stop('touch');
  assert.equal(f.messages.length, 1);
  f.sound.stop('computer');
  assert.deepEqual(f.messages[1], [0x80, 60, 0]);
  f.sound.play('physical', 64, undefined, undefined, 80, 'midi');
  await flush();
  assert.equal(f.messages.length, 2);
  assert.equal(f.attacks.at(-1)?.pitch, 64);
});

test('releases, output changes and Quiet cancel pending port opens without late attacks', async () => {
  let opened!: () => void;
  const f = fixture(
    'keyboard',
    () =>
      new Promise<void>((resolve) => {
        opened = resolve;
      }),
  );
  f.sound.play('pending', 60);
  await Promise.resolve();
  f.sound.stop('pending');
  opened();
  await flush();
  assert.deepEqual(f.messages, []);
  assert.deepEqual(f.attacks, []);
  f.sound.play('changed', 64);
  await Promise.resolve();
  f.sound.configure({ ...f.settings, route: 'quiet' }, f.output);
  opened();
  await flush();
  f.sound.play('silent', 67, undefined, 0.5);
  assert.deepEqual(f.messages, []);
  assert.deepEqual(f.attacks, []);
  f.advance(500);
  assert.equal(f.timers.size, 0);
});

test('recorded durations release MIDI, cleanup cancels timers, and echoes expire without suppressing other pitches or channels', async () => {
  const f = fixture('keyboard');
  f.sound.play('recorded', 60, undefined, 0.5, 100);
  await flush();
  assert.equal(
    f.sound.isEcho({ type: 'on', note: 60, channel: 0, velocity: 100 }),
    true,
  );
  assert.equal(
    f.sound.isEcho({ type: 'on', note: 60, channel: 0, velocity: 100 }),
    false,
  );
  assert.equal(
    f.sound.isEcho({ type: 'on', note: 64, channel: 0, velocity: 100 }),
    false,
  );
  assert.equal(
    f.sound.isEcho({ type: 'on', note: 60, channel: 1, velocity: 100 }),
    false,
  );
  f.advance(81);
  assert.equal(
    f.sound.isEcho({ type: 'on', note: 60, channel: 0, velocity: 100 }),
    false,
  );
  f.advance(419);
  assert.deepEqual(f.messages, [
    [0x90, 60, 100],
    [0x80, 60, 0],
  ]);
  f.sound.play('held', 64, undefined, 5);
  await flush();
  f.sound.close();
  assert.deepEqual(f.messages.at(-1), [0x80, 64, 0]);
  assert.equal(f.timers.size, 0);
});

test('failed MIDI opens and sends fall back audibly to Screen and report the actual destination', async () => {
  for (const failOpen of [true, false]) {
    const f = fixture('keyboard', async () => {
      if (failOpen) throw new Error('unplugged');
    });
    if (!failOpen)
      f.output.send = () => {
        throw new Error('cannot send');
      };
    f.sound.play('note', 60);
    await flush();
    assert.equal(f.attacks.length, 1);
    assert.match(f.errors.at(-1)!, /using Screen/);
    assert.deepEqual(f.sound.playbackDestinations, {
      screen: true,
      keyboard: false,
    });
    f.sound.play('next', 62);
    assert.equal(f.attacks.length, 2);
    f.sound.stopAll();
  }
});

test('saved sound settings tolerate corrupt data, bound synth parameters and preserve custom voices', () => {
  assert.deepEqual(parseSoundSettings('{broken'), defaultSoundSettings());
  const voice = {
    ...soundPresets[2].voice,
    attack: -10,
    release: 100,
    wobble: 5,
    brightness: null,
  };
  const custom = { id: 'custom', name: 'Alien', emoji: '👽', voice };
  const settings = parseSoundSettings(
    JSON.stringify({
      route: 'both',
      volume: 4,
      sound: custom,
      saved: [null, custom],
    }),
  );
  assert.equal(settings.route, 'both');
  assert.equal(settings.volume, 1);
  assert.equal(settings.sound.voice.wave, 'square');
  assert.equal(settings.sound.voice.attack, 0.005);
  assert.equal(settings.sound.voice.release, 2);
  assert.equal(settings.sound.voice.wobble, 1);
  assert.equal(settings.saved.length, 1);
  assert.equal(settings.saved[0].name, 'Alien');
  const store = new Map([[midiOutputStorageKey, 'speakers']]);
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'localStorage',
  );
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (key: string) => store.get(key) ?? null },
  });
  try {
    assert.equal(loadSoundSettings().route, 'screen');
    store.set(soundStorageKey, JSON.stringify({ route: 'both' }));
    assert.equal(loadSoundSettings().route, 'both');
  } finally {
    if (descriptor)
      Object.defineProperty(globalThis, 'localStorage', descriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
