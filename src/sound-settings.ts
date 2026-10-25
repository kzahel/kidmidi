import { loadMidiOutputPreference } from './midi-device';

export type SoundRoute = 'auto' | 'screen' | 'keyboard' | 'both' | 'quiet';
export type WaveShape = 'sine' | 'triangle' | 'square' | 'sawtooth';
export type SoundVoice = {
  wave: WaveShape;
  brightness: number;
  attack: number;
  sustain: number;
  release: number;
  wobble: number;
  swoop: number;
  reverb: number;
};
export type NamedSound = {
  id: string;
  name: string;
  emoji: string;
  voice: SoundVoice;
};
const soft: SoundVoice = {
  wave: 'triangle',
  brightness: 0.65,
  attack: 0.008,
  sustain: 0.28,
  release: 0.18,
  wobble: 0,
  swoop: 0,
  reverb: 0.08,
};
export const soundPresets: readonly NamedSound[] = [
  { id: 'soft', name: 'Soft keys', emoji: '🎹', voice: soft },
  {
    id: 'bubble',
    name: 'Bubble',
    emoji: '🫧',
    voice: { ...soft, wave: 'sine', sustain: 0.12, swoop: 180, release: 0.12 },
  },
  {
    id: 'robot',
    name: 'Robot',
    emoji: '🤖',
    voice: {
      ...soft,
      wave: 'square',
      brightness: 0.42,
      sustain: 0.7,
      wobble: 0.12,
      reverb: 0,
    },
  },
  {
    id: 'ghost',
    name: 'Ghost',
    emoji: '👻',
    voice: {
      ...soft,
      wave: 'sine',
      attack: 0.18,
      sustain: 0.8,
      release: 0.8,
      wobble: 0.75,
      reverb: 0.5,
    },
  },
  {
    id: 'space',
    name: 'Space',
    emoji: '🚀',
    voice: {
      ...soft,
      wave: 'sawtooth',
      brightness: 0.5,
      swoop: 300,
      wobble: 0.25,
      release: 0.4,
      reverb: 0.4,
    },
  },
  {
    id: 'bell',
    name: 'Bell',
    emoji: '🔔',
    voice: { ...soft, wave: 'sine', sustain: 0.04, release: 1.1, reverb: 0.35 },
  },
  {
    id: 'arcade',
    name: 'Arcade',
    emoji: '🎮',
    voice: {
      ...soft,
      wave: 'square',
      brightness: 0.85,
      sustain: 0.18,
      release: 0.07,
      reverb: 0,
    },
  },
];
export type SoundSettings = {
  route: SoundRoute;
  volume: number;
  sound: NamedSound;
  saved: NamedSound[];
};
export const soundStorageKey = 'kidmidi.sound.v1';
const waves: WaveShape[] = ['sine', 'triangle', 'square', 'sawtooth'];
export const soundRoutes: { id: SoundRoute; label: string; icon: string }[] = [
  { id: 'auto', label: 'Auto', icon: '✨' },
  { id: 'screen', label: 'Screen', icon: '🔊' },
  { id: 'keyboard', label: 'Keyboard', icon: '🎹' },
  { id: 'both', label: 'Both', icon: '🎹🔊' },
  { id: 'quiet', label: 'Quiet', icon: '🔇' },
];
function bounded(value: unknown, fallback: number, min = 0, max = 1) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;
}
export function parseVoice(value: unknown): SoundVoice {
  const v =
    value && typeof value === 'object' ? (value as Partial<SoundVoice>) : {};
  return {
    wave: waves.includes(v.wave as WaveShape) ? v.wave! : soft.wave,
    brightness: bounded(v.brightness, soft.brightness),
    attack: bounded(v.attack, soft.attack, 0.005, 1),
    sustain: bounded(v.sustain, soft.sustain),
    release: bounded(v.release, soft.release, 0.03, 2),
    wobble: bounded(v.wobble, soft.wobble),
    swoop: bounded(v.swoop, soft.swoop, -400, 400),
    reverb: bounded(v.reverb, soft.reverb),
  };
}
function parseSound(value: unknown): NamedSound | null {
  if (!value || typeof value !== 'object') return null;
  const s = value as Partial<NamedSound>;
  if (
    typeof s.id !== 'string' ||
    typeof s.name !== 'string' ||
    typeof s.emoji !== 'string'
  )
    return null;
  return {
    id: s.id.slice(0, 80),
    name: s.name.trim().slice(0, 32) || 'My sound',
    emoji: s.emoji.slice(0, 16),
    voice: parseVoice(s.voice),
  };
}
export function defaultSoundSettings(): SoundSettings {
  return {
    route: 'auto',
    volume: 0.65,
    sound: { ...soundPresets[0], voice: { ...soft } },
    saved: [],
  };
}
export function parseSoundSettings(raw: string | null): SoundSettings {
  const fallback = defaultSoundSettings();
  try {
    const s = JSON.parse(raw ?? 'null') as Partial<SoundSettings> | null;
    if (!s || typeof s !== 'object') return fallback;
    return {
      route: soundRoutes.some((r) => r.id === s.route)
        ? s.route!
        : fallback.route,
      volume: bounded(s.volume, fallback.volume),
      sound: parseSound(s.sound) ?? fallback.sound,
      saved: Array.isArray(s.saved)
        ? s.saved
            .slice(0, 12)
            .map(parseSound)
            .filter((s): s is NamedSound => Boolean(s))
        : [],
    };
  } catch {
    return fallback;
  }
}
export function loadSoundSettings(): SoundSettings {
  try {
    const raw = localStorage.getItem(soundStorageKey);
    const settings = parseSoundSettings(raw);
    // Carry the former phrase-only speaker override into the global setting.
    if (!raw && loadMidiOutputPreference() === 'speakers')
      settings.route = 'screen';
    return settings;
  } catch {
    return defaultSoundSettings();
  }
}
export function saveSoundSettings(settings: SoundSettings) {
  try {
    localStorage.setItem(soundStorageKey, JSON.stringify(settings));
  } catch {
    /* Playing remains available without browser storage. */
  }
}
export function soundDestinations(
  route: SoundRoute,
  source: string,
  hasOutput: boolean,
) {
  if (route === 'quiet') return { screen: false, keyboard: false };
  if (source === 'midi')
    return { screen: route === 'screen' || route === 'both', keyboard: false };
  const keyboard =
    hasOutput &&
    (route === 'keyboard' ||
      route === 'both' ||
      (route === 'auto' && source === 'playback'));
  return {
    keyboard,
    screen: route === 'screen' || route === 'both' || !keyboard,
  };
}
export function waveValue(shape: WaveShape, phase: number) {
  const cycle = ((phase % 1) + 1) % 1;
  if (shape === 'square') return cycle < 0.5 ? 1 : -1;
  if (shape === 'sawtooth') return 2 * cycle - 1;
  if (shape === 'triangle') return 1 - 4 * Math.abs(cycle - 0.5);
  return Math.sin(phase * Math.PI * 2);
}
