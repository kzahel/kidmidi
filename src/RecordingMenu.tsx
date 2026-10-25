import { useEffect, useRef, useState } from 'react';
import { exploreNotation, type PlayedNote } from './explore';
import {
  type LibraryState,
  parseRecordingFile,
  type Recording,
  recordingFile,
} from './recordings';

export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadMusicXml(notes: PlayedNote[]) {
  downloadFile(
    'just-explore.musicxml',
    exploreNotation(notes, false).downloadXml,
    'application/vnd.recordare.musicxml+xml',
  );
}
export function RecordingMenu({
  state,
  onClose,
  onLoad,
  onPlay,
  onDelete,
  onImport,
  read,
}: {
  state: LibraryState;
  onClose: () => void;
  onLoad: (id: string) => Promise<void>;
  onPlay: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImport: (title: string, notes: PlayedNote[]) => Promise<void>;
  read: (id: string) => Promise<PlayedNote[]>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState(
    state.current?.id ?? state.sessions[0]?.id ?? '',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  useEffect(() => {
    if (!state.sessions.some((item) => item.id === selected))
      setSelected(state.sessions[0]?.id ?? '');
  }, [state.sessions, selected]);
  const recording = state.sessions.find((item) => item.id === selected);
  async function act(task: () => Promise<void>, close = false) {
    setBusy(true);
    setError('');
    try {
      await task();
      if (close) onClose();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'The recording could not be opened.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function exportRecording(item: Recording) {
    const notes = await read(item.id);
    downloadFile(
      'kidmidi-recording.json',
      recordingFile(item, notes),
      'application/json',
    );
  }
  return (
    <dialog
      className="recordings-menu"
      ref={dialog}
      aria-label="Recordings"
      onCancel={onClose}
    >
      <div className="recordings-header">
        <strong>Recordings</strong>
        <button type="button" onClick={onClose} aria-label="Close recordings">
          ✕
        </button>
      </div>
      <select
        aria-label="Saved recordings"
        value={selected}
        disabled={busy || !state.sessions.length}
        onChange={(event) => {
          setSelected(event.target.value);
          setDeleting(false);
        }}
      >
        {!state.sessions.length && <option value="">No recordings yet</option>}
        {state.sessions.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title} · {item.noteCount} notes
          </option>
        ))}
      </select>
      <div className="recording-actions">
        <button
          type="button"
          disabled={busy || !recording}
          onClick={() => void act(() => onLoad(selected), true)}
        >
          Load
        </button>
        <button
          type="button"
          disabled={busy || !recording?.noteCount}
          onClick={() => void act(() => onPlay(selected), true)}
        >
          Play
        </button>
        <button
          type="button"
          disabled={busy || !recording}
          onClick={() => void act(() => exportRecording(recording!))}
        >
          Download recording
        </button>
        <button
          type="button"
          disabled={busy || !recording?.noteCount}
          onClick={() =>
            void act(async () => downloadMusicXml(await read(selected)))
          }
        >
          MusicXML ↓
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => file.current?.click()}
        >
          Open recording file
        </button>
        <input
          ref={file}
          type="file"
          accept=".json,application/json"
          aria-label="Open recording file"
          hidden
          onChange={(event) => {
            const chosen = event.target.files?.[0];
            if (!chosen) return;
            void act(async () => {
              if (chosen.size > 100_000_000)
                throw new Error('This recording file is too large.');
              const imported = parseRecordingFile(await chosen.text());
              await onImport(imported.title, imported.notes);
            }, true);
          }}
        />
        <button
          type="button"
          disabled={busy || !recording}
          onClick={() => setDeleting(true)}
        >
          Delete
        </button>
      </div>
      {deleting && (
        <div className="recording-delete">
          <span>Delete this saved recording?</span>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void act(async () => {
                await onDelete(selected);
                setDeleting(false);
              })
            }
          >
            Delete recording
          </button>
          <button type="button" onClick={() => setDeleting(false)}>
            Keep it
          </button>
        </div>
      )}
      <p className="recordings-local">
        Saved automatically in this browser. Download to keep a separate copy.
      </p>
      {(error || state.error) && <p role="alert">{error || state.error}</p>}
    </dialog>
  );
}
