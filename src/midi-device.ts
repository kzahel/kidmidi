export type MidiIdentity = {
  id: string;
  name: string | null;
  manufacturer: string | null;
};
export type MidiPreference = MidiIdentity & {
  selection?: 'manual' | 'automatic';
};

export const midiDeviceStorageKey = 'kidmidi.midi-input.v1';

export function parseMidiPreference(raw: string | null): MidiPreference | null {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (!value || typeof value !== 'object') return null;
    const identity = value as Partial<MidiPreference>;
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
      ...(identity.selection === 'manual' || identity.selection === 'automatic'
        ? { selection: identity.selection }
        : {}),
    };
  } catch {
    return null;
  }
}

export function loadMidiPreference(): MidiPreference | null {
  try {
    return parseMidiPreference(localStorage.getItem(midiDeviceStorageKey));
  } catch {
    return null;
  }
}

export function saveMidiPreference(input: MidiPreference) {
  try {
    localStorage.setItem(
      midiDeviceStorageKey,
      JSON.stringify({
        id: input.id,
        name: input.name,
        manufacturer: input.manufacturer,
        selection: input.selection,
      }),
    );
  } catch {
    /* MIDI still works when local browser storage is unavailable. */
  }
}

// Web MIDI identifies ports, not keyboard capabilities. Avoid known virtual
// routing ports as defaults; keep them available for an explicit selection.
export function midiInputPriority(input: MidiIdentity): number {
  const name = input.name?.trim() ?? '';
  if (
    /\bmidi[\s_-]*(?:through|thru)\b|\bthrough[\s_-]*port\b|\biac[\s_-]*driver\b|\bloopmidi\b|\bloopbe\b|\bvirtual[\s_-]*midi\b/i.test(
      name,
    )
  )
    return 0;
  return name ? 2 : 1;
}

export function chooseMidiInput<T extends MidiIdentity>(
  inputs: readonly T[],
  preferred: MidiPreference | null,
  currentId: string,
): T | undefined {
  let remembered: T | undefined;
  if (preferred) {
    remembered = inputs.find((input) => input.id === preferred.id);
    // Port IDs can change. Only use a name fallback when it identifies one input.
    if (!remembered && preferred.name) {
      const matching = inputs.filter(
        (input) =>
          input.name === preferred.name &&
          input.manufacturer === preferred.manufacturer,
      );
      if (matching.length === 1) remembered = matching[0];
    }
    if (remembered && preferred.selection === 'manual') return remembered;
  }
  const best = inputs.reduce(
    (rank, input) => Math.max(rank, midiInputPriority(input)),
    -1,
  );
  // Legacy preferences did not record whether selection was automatic. A saved
  // Through port must not keep winning just because an older version saved it.
  if (remembered && midiInputPriority(remembered) === best) return remembered;
  const current = inputs.find((input) => input.id === currentId);
  if (current && midiInputPriority(current) === best) return current;
  return inputs.find((input) => midiInputPriority(input) === best);
}
