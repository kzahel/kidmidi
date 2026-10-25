export const huntLevels = {
  first: { label: 'C · E · G', notes: [60, 64, 67] },
  five: { label: 'C to G', notes: [60, 62, 64, 65, 67] },
  octave: { label: 'C to C', notes: [60, 62, 64, 65, 67, 69, 71, 72] },
} as const;
export type HuntLevel = keyof typeof huntLevels;
export type HuntState = {
  level: HuntLevel;
  target: number;
  played: number | null;
  attempts: number;
  found: boolean;
  reward: number;
  points: number;
  solved: number;
};

export function startHunt(level: HuntLevel = 'first'): HuntState {
  return {
    level,
    target: 60,
    played: null,
    attempts: 0,
    found: false,
    reward: 0,
    points: 0,
    solved: 0,
  };
}

// Transport owns fresh attacks; held/repeated note-on messages never reach here.
export function guessHunt(state: HuntState, midi: number): HuntState {
  if (state.found) return state;
  const attempts = state.attempts + 1;
  const found = midi === state.target;
  const reward = found ? Math.max(0, 4 - attempts) : 0;
  return {
    ...state,
    played: midi,
    attempts,
    found,
    reward,
    points: state.points + reward,
    solved: state.solved + (found ? 1 : 0),
  };
}

export function nextHunt(state: HuntState, random = Math.random): HuntState {
  if (!state.found) return state;
  const notes: readonly number[] = huntLevels[state.level].notes;
  const choices = notes.filter((note) => note !== state.target);
  // Introduce middle C, E, then G before mixing the selected white notes.
  const introduction = [60, 64, 60, 67];
  const target =
    introduction[state.solved] ??
    choices[
      Math.min(
        choices.length - 1,
        Math.max(0, Math.floor(random() * choices.length)),
      )
    ];
  return {
    ...state,
    target,
    played: null,
    attempts: 0,
    found: false,
    reward: 0,
  };
}
