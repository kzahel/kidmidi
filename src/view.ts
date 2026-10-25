export type ScoreSize = 'compact' | 'kid';
export type ViewSettings = { size: ScoreSize; multiline: boolean };
export const defaultView: ViewSettings = { size: 'kid', multiline: false };
export const scoreZoom: Record<ScoreSize, number> = { compact: 1.6, kid: 2.2 };
export const viewStorageKey = 'kidmidi.view.v1';

export function parseViewSettings(raw: string | null): ViewSettings {
  try {
    const saved: unknown = JSON.parse(raw ?? 'null');
    if (typeof saved !== 'object' || saved === null) return { ...defaultView };
    const candidate = saved as Partial<ViewSettings>;
    return {
      size:
        candidate.size === 'compact' || candidate.size === 'kid'
          ? candidate.size
          : defaultView.size,
      multiline:
        typeof candidate.multiline === 'boolean'
          ? candidate.multiline
          : defaultView.multiline,
    };
  } catch {
    return { ...defaultView };
  }
}

export function loadViewSettings(): ViewSettings {
  try {
    return parseViewSettings(localStorage.getItem(viewStorageKey));
  } catch {
    return { ...defaultView };
  }
}

export function saveViewSettings(settings: ViewSettings) {
  try {
    localStorage.setItem(viewStorageKey, JSON.stringify(settings));
  } catch {
    /* The controls still work when browser storage is unavailable. */
  }
}

export function fitScore(
  contentWidth: number,
  contentHeight: number,
  availableWidth: number,
  availableHeight: number,
) {
  const scale = Math.max(
    0,
    Math.min(
      1,
      availableWidth / Math.max(1, contentWidth),
      availableHeight / Math.max(1, contentHeight),
    ),
  );
  return { scale, width: contentWidth * scale, height: contentHeight * scale };
}

export function practicePage(
  phraseCount: number,
  currentPhrase: number,
  multiline: boolean,
  size: ScoreSize,
  width: number,
  height: number,
  requestedPage: number | null = null,
) {
  const roomy =
    size === 'kid'
      ? width >= 1000 && height >= 780
      : width >= 720 && height >= 600;
  const capacity = multiline && roomy ? 2 : 1;
  const count = Math.max(1, Math.ceil(phraseCount / capacity));
  const index = Math.max(
    0,
    Math.min(count - 1, requestedPage ?? Math.floor(currentPhrase / capacity)),
  );
  return {
    index,
    count,
    start: index * capacity,
    end: Math.min(phraseCount, (index + 1) * capacity),
  };
}
