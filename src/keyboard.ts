import type { MidiIdentity } from './midi-device';

export type KeyRange = { low: number; high: number };
export type KeyboardProfile = KeyRange & MidiIdentity;
export type KeyboardSettings = {
  zoom: 'close' | 'all';
  profiles: KeyboardProfile[];
};
export const keyboardStorageKey = 'kidmidi.keyboard.v1';
export const defaultKeyRange: KeyRange = { low: 36, high: 96 };
export const closeKeyRange: KeyRange = { low: 48, high: 72 };
export function displayKeyRange(
  range: KeyRange,
  zoom: 'close' | 'all',
  width: number,
  height: number,
): KeyRange {
  if (zoom === 'all') return range;
  // A single octave gives touch players much wider white keys on small screens.
  // This changes the view only, never the device's calibrated physical range.
  return width <= 640 || (width <= 900 && height <= 500)
    ? { low: 60, high: 72 }
    : closeKeyRange;
}
export const screenKeyboard: MidiIdentity = {
  id: 'on-screen',
  name: null,
  manufacturer: null,
};
export const isBlackKey = (note: number) =>
  [1, 3, 6, 8, 10].includes(note % 12);

export function parseKeyboardSettings(raw: string | null): KeyboardSettings {
  const fallback: KeyboardSettings = { zoom: 'close', profiles: [] };
  try {
    const value = JSON.parse(raw ?? 'null');
    if (!value || typeof value !== 'object') return fallback;
    return {
      zoom: value.zoom === 'all' ? 'all' : 'close',
      profiles: Array.isArray(value.profiles)
        ? value.profiles
            .filter(
              (item: KeyboardProfile) =>
                item &&
                typeof item.id === 'string' &&
                item.id &&
                (item.name === null || typeof item.name === 'string') &&
                (item.manufacturer === null ||
                  typeof item.manufacturer === 'string') &&
                Number.isInteger(item.low) &&
                Number.isInteger(item.high) &&
                item.low >= 0 &&
                item.high <= 127 &&
                item.high > item.low,
            )
            .slice(-32)
        : [],
    };
  } catch {
    return fallback;
  }
}

export function keyboardProfile(
  profiles: KeyboardProfile[],
  device: MidiIdentity,
) {
  const exact = profiles.find((profile) => profile.id === device.id);
  if (exact) return exact;
  const matching = device.name
    ? profiles.filter(
        (profile) =>
          profile.name === device.name &&
          profile.manufacturer === device.manufacturer,
      )
    : [];
  return matching.length === 1 ? matching[0] : undefined;
}

export function saveKeyboardProfile(
  settings: KeyboardSettings,
  device: MidiIdentity,
  range: KeyRange,
): KeyboardSettings {
  const previous = keyboardProfile(settings.profiles, device);
  return {
    ...settings,
    profiles: [
      ...settings.profiles.filter((profile) => profile !== previous),
      { ...device, ...range },
    ].slice(-32),
  };
}

export function keyboardLayout(range: KeyRange) {
  const notes = Array.from(
    { length: range.high - range.low + 1 },
    (_, i) => range.low + i,
  );
  const whiteNotes = notes.filter((note) => !isBlackKey(note));
  // Half-key gutters keep black-key endpoints fully visible without inventing
  // extra playable white keys outside the learned range.
  const leading = isBlackKey(range.low) ? 0.5 : 0;
  const trailing = isBlackKey(range.high) ? 0.5 : 0;
  const units = whiteNotes.length + leading + trailing;
  let whites = 0;
  const keys = notes.map((note) => {
    const black = isBlackKey(note);
    const width = black ? 0.6 : 1;
    const left = leading + whites - (black ? 0.3 : 0);
    if (!black) whites++;
    return {
      note,
      black,
      left: (left / units) * 100,
      width: (width / units) * 100,
    };
  });
  return { keys, units, whiteCount: whiteNotes.length };
}
