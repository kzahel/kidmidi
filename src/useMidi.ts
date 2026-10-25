import { useCallback, useEffect, useRef, useState } from 'react';
import {
  chooseMidiInput,
  loadMidiPreference,
  saveMidiPreference,
} from './midi-device';
import { type NoteEvent, parseMidi } from './music';

export function useMidi(
  onNote: (event: NoteEvent) => void,
  onReset: () => void,
) {
  const [inputs, setInputs] = useState<MIDIInput[]>([]);
  const [selected, setSelectedId] = useState('');
  const [status, setStatus] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [initialPreference] = useState(loadMidiPreference);
  const preferred = useRef(initialPreference);
  const selectedId = useRef('');
  const access = useRef<MIDIAccess | null>(null);
  const mounted = useRef(false);
  const connecting = useRef(false);
  const callbacks = useRef({ onNote, onReset });
  callbacks.current = { onNote, onReset };
  const supported = typeof navigator.requestMIDIAccess === 'function';
  const selectedInput = inputs.find((input) => input.id === selected);

  const connect = useCallback(
    async (automatic = false) => {
      if (!supported || connecting.current) return;
      connecting.current = true;
      setRequesting(true);
      try {
        const granted =
          access.current ??
          (await navigator.requestMIDIAccess({ sysex: false }));
        if (!mounted.current) return;
        access.current = granted;
        const refresh = () => {
          if (!mounted.current) return;
          const available = [...granted.inputs.values()].filter(
            (input) => input.state === 'connected',
          );
          const chosen = chooseMidiInput(
            available,
            preferred.current,
            selectedId.current,
          );
          if (chosen && !preferred.current) {
            preferred.current = {
              id: chosen.id,
              name: chosen.name,
              manufacturer: chosen.manufacturer,
            };
            saveMidiPreference(preferred.current);
          }
          selectedId.current = chosen?.id ?? '';
          setSelectedId(selectedId.current);
          setInputs(available);
          setStatus(
            available.length
              ? ''
              : 'No MIDI keyboard found. Check its power and USB TO HOST cable.',
          );
        };
        granted.onstatechange = refresh;
        refresh();
      } catch (error) {
        if (!mounted.current) return;
        setStatus(
          error instanceof DOMException && error.name === 'NotAllowedError'
            ? automatic
              ? 'Click Connect keyboard to allow MIDI access. If blocked, enable MIDI in site settings.'
              : 'MIDI permission was blocked. Allow MIDI in your browser’s site settings, then try again.'
            : `Could not connect: ${error instanceof Error ? error.message : 'Please check your keyboard and try again.'}`,
        );
      } finally {
        connecting.current = false;
        if (mounted.current) setRequesting(false);
      }
    },
    [supported],
  );

  useEffect(() => {
    mounted.current = true;
    // The browser owns permission persistence. Reacquire access on every page load:
    // an existing grant connects silently; a new grant may show a browser prompt.
    void connect(true);
    return () => {
      mounted.current = false;
      if (access.current) access.current.onstatechange = null;
    };
  }, [connect]);

  useEffect(() => {
    callbacks.current.onReset();
    if (!selectedInput) return;
    const receive = (event: MIDIMessageEvent) => {
      const note = event.data && parseMidi(event.data);
      if (note) callbacks.current.onNote({ ...note, atMs: event.timeStamp });
    };
    selectedInput.addEventListener('midimessage', receive);
    return () => {
      selectedInput.removeEventListener('midimessage', receive);
      void selectedInput.close?.().catch(() => {});
    };
  }, [selectedInput]);

  function setSelected(id: string) {
    const input = inputs.find((candidate) => candidate.id === id);
    if (!input) return;
    preferred.current = {
      id: input.id,
      name: input.name,
      manufacturer: input.manufacturer,
    };
    saveMidiPreference(preferred.current);
    selectedId.current = id;
    setSelectedId(id);
  }

  return {
    inputs,
    selected,
    setSelected,
    status,
    supported,
    requesting,
    connect,
  };
}
