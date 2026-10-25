import { groupPlayedNotes, type PlayedNote } from './explore';

export function liveGrid(
  width: number,
  height: number,
  multiline: boolean,
  size: 'kid' | 'compact',
) {
  const columns = Math.max(
    1,
    Math.min(4, Math.floor(width / (size === 'kid' ? 420 : 320))),
  );
  const rows = multiline && height >= 500 ? 2 : 1;
  return {
    columns,
    rows,
    capacity: columns * rows * 4,
    width: columns * 320,
    height: rows * 240,
  };
}
export function livePage(
  notes: readonly PlayedNote[],
  capacity: number,
  afterGroup = 0,
) {
  const groups = groupPlayedNotes(notes)
    .map((group, index) => ({
      ...group,
      index: group.notes[0].groupIndex ?? index,
    }))
    .filter((group) => group.index >= afterGroup);
  const latest = groups.at(-1);
  const start =
    afterGroup +
    Math.floor(
      Math.max(0, (latest?.index ?? afterGroup) - afterGroup) / capacity,
    ) *
      capacity;
  return {
    start,
    groups: groups
      .filter((group) => group.index >= start)
      .map((group) => ({ ...group, slot: group.index - start })),
  };
}
