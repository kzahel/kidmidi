import { PianoAudio } from './audio';
import type { FeedbackClock } from './feedback';
import type { Note } from './music';

export type PreviewOutput = Pick<MIDIOutput, 'open' | 'send'> & {
  clear?: () => void;
};
export type PreviewState = { playing: boolean; error: string };
type Speaker = Pick<PianoAudio, 'hear' | 'stopAll' | 'close'>;
const clock: FeedbackClock = {
  now: () => performance.now(),
  schedule: (callback, delay) => window.setTimeout(callback, delay),
  cancel: (timer) => window.clearTimeout(timer),
};

// Only phrase demonstrations go through this output route. Neither output
// playback nor a keyboard's MIDI echo should be counted as a child's performance.
export class PhrasePreview {
  private serial = 0;
  private output: PreviewOutput | null = null;
  private pitches = new Set<number>();
  private timer?: number;
  playing = false;
  get midiPlaying() {
    return this.playing && this.output !== null;
  }
  constructor(
    private emit: (state: PreviewState) => void,
    private speaker: Speaker = new PianoAudio(),
    private time: FeedbackClock = clock,
  ) {}

  async hear(notes: Note[], output?: PreviewOutput) {
    this.stop();
    if (!notes.length) return;
    const serial = this.serial;
    this.playing = true;
    this.emit({ playing: true, error: '' });
    const duration =
      80 + notes.reduce((sum, note) => sum + note.beats * 480, 0);
    let error = '';
    if (output) {
      this.output = output;
      try {
        await output.open();
        if (serial !== this.serial) return;
        if (typeof output.clear !== 'function')
          throw new Error('This MIDI output cannot cancel queued notes.');
        let when = this.time.now() + 80;
        this.pitches = new Set(notes.map((note) => note.midi));
        for (const note of notes) {
          output.send([0x90, note.midi, 90], when);
          output.send([0x80, note.midi, 0], when + note.beats * 480 - 40);
          when += note.beats * 480;
        }
      } catch {
        if (serial !== this.serial) return;
        this.releaseMidi();
        error = 'Keyboard playback failed · using speakers';
      }
    }
    if (!this.output) {
      try {
        this.speaker.hear(notes);
      } catch {
        this.playing = false;
        this.emit({ playing: false, error: 'Could not play this phrase.' });
        return;
      }
    }
    this.emit({ playing: true, error });
    this.timer = this.time.schedule(() => {
      this.timer = undefined;
      if (serial !== this.serial) return;
      this.output = null;
      this.pitches.clear();
      this.playing = false;
      this.emit({ playing: false, error });
    }, duration);
  }
  private releaseMidi() {
    const output = this.output;
    this.output = null;
    if (output) {
      try {
        output.clear?.();
      } catch {
        /* Unplugged outputs may reject cleanup. */
      }
      for (const pitch of this.pitches) {
        try {
          output.send([0x80, pitch, 0]);
        } catch {
          /* Best effort after unplug. */
        }
      }
    }
    this.pitches.clear();
  }
  stop() {
    this.serial++;
    if (this.timer !== undefined) this.time.cancel(this.timer);
    this.timer = undefined;
    this.releaseMidi();
    this.speaker.stopAll();
    this.playing = false;
    this.emit({ playing: false, error: '' });
  }
  dispose() {
    this.stop();
    this.speaker.close();
  }
}
