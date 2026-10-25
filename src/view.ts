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
