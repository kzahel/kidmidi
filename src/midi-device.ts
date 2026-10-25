export type MidiIdentity = {
  id: string;
  name: string | null;
  manufacturer: string | null;
};
export const midiDeviceStorageKey = 'kidmidi.midi-input.v1';

export function parseMidiPreference(raw: string | null): MidiIdentity | null {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (!value || typeof value !== 'object') return null;
    const identity = value as Partial<MidiIdentity>;
    if (
      typeof identity.id !== 'string' ||
      !identity.id ||
      !(identity.name === null || typeof identity.name === 'string') ||
      !(
        identity.manufacturer === null ||
        typeof identity.manufacturer === 'string'
      )
    )
      return null;
    return {
      id: identity.id,
      name: identity.name,
      manufacturer: identity.manufacturer,
    };
  } catch {
    return null;
  }
}

export function loadMidiPreference(): MidiIdentity | null {
  try {
    return parseMidiPreference(localStorage.getItem(midiDeviceStorageKey));
  } catch {
    return null;
  }
}

export function saveMidiPreference(input: MidiIdentity) {
  try {
    localStorage.setItem(
      midiDeviceStorageKey,
      JSON.stringify({
        id: input.id,
        name: input.name,
        manufacturer: input.manufacturer,
      }),
    );
  } catch {
    /* MIDI still works when local browser storage is unavailable. */
  }
}

export function chooseMidiInput<T extends MidiIdentity>(
  inputs: readonly T[],
  preferred: MidiIdentity | null,
  currentId: string,
): T | undefined {
  if (preferred) {
    const exact = inputs.find((input) => input.id === preferred.id);
    if (exact) return exact;
    // Port IDs can change. Only use a name fallback when it identifies one input.
    const matching = preferred.name
      ? inputs.filter(
          (input) =>
            input.name === preferred.name &&
            input.manufacturer === preferred.manufacturer,
        )
      : [];
    if (matching.length === 1) return matching[0];
  }
  return inputs.find((input) => input.id === currentId) ?? inputs[0];
}
