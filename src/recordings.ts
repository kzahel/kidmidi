import type { ExploreRecorder, PlayedNote } from './explore';

export type Recording = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  noteCount: number;
  lastMs: number;
};
export type LibraryState = {
  current: Recording | null;
  sessions: Recording[];
  status: 'loading' | 'saving' | 'saved' | 'error' | 'idle';
  error: string;
};
export const emptyLibrary: LibraryState = {
  current: null,
  sessions: [],
  status: 'loading',
  error: '',
};
type StoredNote = PlayedNote & { recordingId: string };

function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('kidmidi-recordings', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('recordings', { keyPath: 'id' });
      const notes = db.createObjectStore('notes', {
        keyPath: ['recordingId', 'id'],
      });
      notes.createIndex('recordingId', 'recordingId');
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error('Close older Kidmidi tabs to open recordings.'));
  });
}
function result<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function complete(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('Recording save was interrupted.'));
    transaction.onerror = () => reject(transaction.error);
  });
}

export function recordingFile(recording: Recording, notes: PlayedNote[]) {
  return JSON.stringify(
    {
      format: 'kidmidi-recording',
      version: 1,
      title: recording.title,
      createdAt: recording.createdAt,
      notes,
    },
    null,
    2,
  );
}
export function parseRecordingFile(text: string): {
  title: string;
  notes: PlayedNote[];
} {
  const value = JSON.parse(text);
  if (
    value?.format !== 'kidmidi-recording' ||
    value.version !== 1 ||
    !Array.isArray(value.notes) ||
    value.notes.length > 500_000
  )
    throw new Error('Choose a Kidmidi recording JSON file.');
  const notes = value.notes.map((note: PlayedNote, index: number) => {
    if (
      !note ||
      !Number.isInteger(note.midi) ||
      note.midi < 0 ||
      note.midi > 127 ||
      !Number.isInteger(note.velocity) ||
      note.velocity < 1 ||
      note.velocity > 127 ||
      !Number.isFinite(note.onsetMs) ||
      note.onsetMs < 0 ||
      (note.offsetMs !== undefined &&
        (!Number.isFinite(note.offsetMs) || note.offsetMs < note.onsetMs))
    )
      throw new Error('This recording contains invalid note data.');
    return {
      id: index + 1,
      inputId:
        typeof note.inputId === 'string'
          ? note.inputId.slice(0, 200)
          : 'import',
      midi: note.midi,
      velocity: note.velocity,
      onsetMs: note.onsetMs,
      offsetMs: note.offsetMs ?? note.onsetMs + 300,
    };
  });
  return {
    title:
      typeof value.title === 'string'
        ? value.title.slice(0, 120)
        : 'Imported recording',
    notes: notes
      .sort((a: PlayedNote, b: PlayedNote) => a.onsetMs - b.onsetMs)
      .map((note: PlayedNote, index: number) => ({ ...note, id: index + 1 })),
  };
}

// Only changed attacks/releases are written, so a long session is not serialized
// again for every key. The recorder keeps the complete in-memory fallback.
export class RecordingLibrary {
  state: LibraryState = { ...emptyLibrary };
  private db?: Promise<IDBDatabase>;
  private pending = new Map<string, StoredNote>();
  private metas = new Map<string, Recording>();
  private timer?: ReturnType<typeof setTimeout>;
  private running?: Promise<void>;
  private revision = 0;
  private disposed = false;
  constructor(private emit: (state: LibraryState) => void) {}
  private open() {
    return (this.db ??= database().catch((error) => {
      this.db = undefined;
      throw error;
    }));
  }
  private publish() {
    if (!this.disposed) this.emit({ ...this.state });
  }
  private mergeSessions(records: Recording[]) {
    const all = new Map(records.map((record) => [record.id, record]));
    for (const record of this.state.sessions) {
      if (
        !all.has(record.id) ||
        record.updatedAt > (all.get(record.id)?.updatedAt ?? 0)
      )
        all.set(record.id, record);
    }
    this.state.sessions = [...all.values()].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
  }
  async init(recorder: ExploreRecorder) {
    const revision = this.revision;
    try {
      const db = await this.open();
      const sessions = (await result(
        db.transaction('recordings').objectStore('recordings').getAll(),
      )) as Recording[];
      this.mergeSessions(sessions);
      const latest = this.state.sessions[0];
      if (latest && revision === this.revision && recorder.count === 0) {
        const notes = await this.read(latest.id);
        if (
          revision === this.revision &&
          recorder.count === 0 &&
          !this.disposed
        ) {
          this.state.current = latest;
          recorder.load(notes);
        }
      }
      if (this.state.status === 'loading')
        this.state.status = this.state.current ? 'saved' : 'idle';
      this.publish();
    } catch (error) {
      this.failed(error);
    }
  }
  capture(notes: PlayedNote[]) {
    this.revision++;
    const now = Date.now();
    const current = this.state.current ?? {
      id: crypto.randomUUID(),
      title: `Explore · ${new Date(now).toLocaleString()}`,
      createdAt: now,
      updatedAt: now,
      noteCount: 0,
      lastMs: 0,
    };
    const next = { ...current, updatedAt: now };
    for (const note of notes) {
      if (note.offsetMs === undefined) next.noteCount++;
      next.lastMs = Math.max(next.lastMs, note.offsetMs ?? note.onsetMs);
      this.pending.set(`${next.id}:${note.id}`, {
        ...note,
        recordingId: next.id,
      });
    }
    this.state.current = next;
    this.metas.set(next.id, next);
    this.mergeSessions([next]);
    this.state.status = 'saving';
    this.publish();
    if (!this.timer)
      this.timer = setTimeout(() => {
        this.timer = undefined;
        void this.flush();
      }, 200);
  }
  async flush() {
    clearTimeout(this.timer);
    this.timer = undefined;
    if (this.running) return this.running;
    this.running = this.write().finally(() => {
      this.running = undefined;
    });
    return this.running;
  }
  private async write() {
    while (this.pending.size || this.metas.size) {
      const notes = [...this.pending.values()],
        metas = [...this.metas.values()];
      this.pending.clear();
      this.metas.clear();
      try {
        const db = await this.open();
        const tx = db.transaction(['recordings', 'notes'], 'readwrite');
        const done = complete(tx);
        for (const note of notes) tx.objectStore('notes').put(note);
        for (const meta of metas) tx.objectStore('recordings').put(meta);
        await done;
      } catch (error) {
        for (const note of notes) {
          const key = `${note.recordingId}:${note.id}`;
          if (!this.pending.has(key)) this.pending.set(key, note);
        }
        for (const meta of metas)
          if (!this.metas.has(meta.id)) this.metas.set(meta.id, meta);
        this.failed(error);
        return;
      }
    }
    this.state.status = this.state.current ? 'saved' : 'idle';
    this.state.error = '';
    this.publish();
  }
  private failed(error: unknown) {
    this.state.status = 'error';
    this.state.error = `Could not save recordings in this browser. Download a recording to keep it. ${error instanceof Error ? error.message : ''}`;
    this.publish();
  }
  async read(id: string): Promise<PlayedNote[]> {
    const pending = [...this.pending.values()].filter(
      (note) => note.recordingId === id,
    );
    let stored: StoredNote[] = [];
    try {
      const db = await this.open();
      stored = await result(
        db
          .transaction('notes')
          .objectStore('notes')
          .index('recordingId')
          .getAll(id),
      );
    } catch (error) {
      const expected = this.state.sessions.find(
        (session) => session.id === id,
      )?.noteCount;
      if (pending.length !== expected) throw error;
    }
    const combined = new Map(stored.map((note) => [note.id, note]));
    for (const note of pending) combined.set(note.id, note);
    return [...combined.values()]
      .map(({ recordingId: _, ...note }) => note)
      .sort((a, b) => a.id - b.id);
  }

  async load(id: string) {
    this.revision++;
    const revision = this.revision;
    await this.flush();
    const session = this.state.sessions.find((item) => item.id === id);
    if (!session) throw new Error('Recording not found.');
    const notes = await this.read(id);
    if (revision !== this.revision)
      throw new Error(
        'Playing continued while loading. Pause briefly and load again.',
      );
    this.state.current = session;
    this.state.status = this.state.error ? 'error' : 'saved';
    this.publish();
    return notes;
  }
  newSession() {
    this.revision++;
    this.state.current = null;
    this.state.status = this.pending.size ? 'saving' : 'idle';
    this.publish();
  }
  async import(title: string, recorder: ExploreRecorder, notes: PlayedNote[]) {
    this.newSession();
    recorder.load(notes);
    if (!notes.length) return;
    // Create the new metadata, then upsert all finished imported notes once.
    const now = Date.now();
    this.state.current = {
      id: crypto.randomUUID(),
      title,
      createdAt: now,
      updatedAt: now,
      noteCount: notes.length,
      lastMs: notes.reduce(
        (max, note) => Math.max(max, note.offsetMs ?? note.onsetMs),
        0,
      ),
    };
    this.metas.set(this.state.current.id, this.state.current);
    this.capture(recorder.getNotes());
    await this.flush();
  }
  async remove(id: string) {
    await this.flush();
    if (this.state.current?.id === id) this.newSession();
    const db = await this.open();
    const tx = db.transaction(['recordings', 'notes'], 'readwrite');
    const done = complete(tx);
    tx.objectStore('recordings').delete(id);
    const request = tx
      .objectStore('notes')
      .index('recordingId')
      .openCursor(IDBKeyRange.only(id));
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    await done;
    this.state.sessions = this.state.sessions.filter((item) => item.id !== id);
    this.publish();
  }
  dispose() {
    this.disposed = true;
    clearTimeout(this.timer);
    void this.flush();
  }
}
