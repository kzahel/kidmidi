import { useEffect, useRef, useState } from 'react';
import {
  closeKeyRange,
  defaultKeyRange,
  type KeyboardSettings,
  type KeyRange,
  keyboardProfile,
  keyboardStorageKey,
  parseKeyboardSettings,
  saveKeyboardProfile,
} from './keyboard';
import type { MidiIdentity } from './midi-device';

export function useKeyboard(device: MidiIdentity) {
  const [settings, setSettings] = useState(() => {
    try {
      return parseKeyboardSettings(localStorage.getItem(keyboardStorageKey));
    } catch {
      return parseKeyboardSettings(null);
    }
  });
  const [learning, setLearning] = useState<{
    deviceId: string;
    low: number | null;
  } | null>(null);
  const learningRef = useRef(learning);
  function updateLearning(next: typeof learning) {
    learningRef.current = next;
    setLearning(next);
  }
  const [rangeError, setRangeError] = useState('');
  const profile = keyboardProfile(settings.profiles, device);
  const range = profile ?? defaultKeyRange;
  const calibrating = learning?.deviceId === device.id;
  useEffect(() => {
    try {
      localStorage.setItem(keyboardStorageKey, JSON.stringify(settings));
    } catch {
      /* Piano still works without storage. */
    }
  }, [settings]);
  useEffect(() => {
    updateLearning(null);
    setRangeError('');
  }, [device.id]);

  function setRange(next: KeyRange) {
    setSettings((previous) => saveKeyboardProfile(previous, device, next));
    updateLearning(null);
    setRangeError('');
  }
  function observe(note: number) {
    const capture = learningRef.current;
    if (capture?.deviceId === device.id) {
      if (capture.low === null) {
        updateLearning({ ...capture, low: note });
      } else if (note <= capture.low) {
        setRangeError('Play the highest key, above the first one.');
      } else {
        setRange({ low: capture.low, high: note });
      }
      return true;
    }
    // A real MIDI note is evidence that the displayed range must include it.
    // This only grows the assumed range; normal playing cannot establish endpoints.
    if (note < range.low || note > range.high) {
      setSettings((previous) => {
        const current =
          keyboardProfile(previous.profiles, device) ?? defaultKeyRange;
        return saveKeyboardProfile(previous, device, {
          low: Math.min(current.low, note),
          high: Math.max(current.high, note),
        });
      });
    }
    return false;
  }
  return {
    zoom: settings.zoom,
    setZoom: (zoom: KeyboardSettings['zoom']) =>
      setSettings((previous) => ({ ...previous, zoom })),
    range,
    displayRange: settings.zoom === 'all' ? range : closeKeyRange,
    calibrating,
    learningLow: calibrating ? learning.low : null,
    rangeError,
    startLearning: () => {
      setRangeError('');
      updateLearning({ deviceId: device.id, low: null });
    },
    cancelLearning: () => {
      setRangeError('');
      updateLearning(null);
    },
    setRange,
    observe,
  };
}
