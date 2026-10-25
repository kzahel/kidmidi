import { PianoAudio } from './audio';
import type { FeedbackClock } from './feedback';
import type { NoteEvent } from './music';
import type { PreviewOutput } from './phrase-preview';
import {
  defaultSoundSettings,
  type SoundSettings,
  soundDestinations,
} from './sound-settings';

export type NoteSound = Pick<PianoAudio, 'play' | 'stop' | 'stopAll' | 'close'>;
type Speaker = Pick<
  PianoAudio,
  | 'configure'
  | 'unlock'
  | 'play'
  | 'stop'
  | 'stopAll'
  | 'close'
  | 'hear'
  | 'readWaveform'
>;
type RoutedNote = {
  midi: number;
  velocity: number;
  screen: boolean;
  sent: boolean;
  output?: PreviewOutput;
  timer?: number;
};
const clock: FeedbackClock = {
  now: () => performance.now(),
  schedule: (callback, delay) => window.setTimeout(callback, delay),
  cancel: (id) => window.clearTimeout(id),
};

// Live and recording output, independent of capture and practice progression.
// Incoming physical keys already sound locally; never echo them back to MIDI.
export class SoundOutput {
  private settings = defaultSoundSettings();
  private output?: PreviewOutput;
  private failed = false;
  private notes = new Map<string, RoutedNote>();
  private echoes = new Map<string, number>();
  constructor(
    readonly speaker: Speaker = new PianoAudio(),
    private report: (message: string) => void = () => {},
    private time: FeedbackClock = clock,
  ) {}
  configure(settings: SoundSettings, output?: PreviewOutput) {
    if (this.settings.route !== settings.route || this.output !== output)
      this.stopAll();
    this.settings = settings;
    this.output = output;
    this.failed = false;
    this.speaker.configure(settings.sound.voice, settings.volume);
    this.report('');
  }
  get playbackDestinations() {
    return soundDestinations(
      this.settings.route,
      'playback',
      Boolean(this.output) && !this.failed,
    );
  }
  get midiOutput() {
    return this.failed ? undefined : this.output;
  }
  private send(
    output: PreviewOutput,
    type: 'on' | 'off',
    note: number,
    velocity = 0,
  ) {
    // Mark before send: a virtual MIDI loop can return synchronously.
    this.echoes.set(`${type}:${note}`, this.time.now() + 80);
    output.send([type === 'on' ? 0x90 : 0x80, note, velocity]);
  }
  isEcho(event: NoteEvent) {
    if (event.channel !== 0) return false;
    const key = `${event.type}:${event.note}`;
    const expected = (this.echoes.get(key) ?? -Infinity) >= this.time.now();
    this.echoes.delete(key);
    return expected;
  }
  play(
    id: string,
    midi: number,
    _when?: number,
    duration?: number,
    velocity = 90,
    source = 'playback',
  ) {
    this.stop(id);
    const destination = soundDestinations(
      this.settings.route,
      source,
      Boolean(this.output) && !this.failed,
    );
    const note: RoutedNote = {
      midi,
      velocity,
      screen: destination.screen,
      sent: false,
    };
    this.notes.set(id, note);
    if (note.screen) this.playScreen(id, note, duration);
    if (destination.keyboard && this.output) {
      const output = this.output;
      note.output = output;
      // A release or settings change while the port opens must cancel this attack.
      void Promise.resolve()
        .then(() => output.open())
        .then(() => {
          if (this.notes.get(id) !== note || this.output !== output) return;
          const alreadyPlaying = [...this.notes.values()].some(
            (other) =>
              other !== note &&
              other.sent &&
              other.output === output &&
              other.midi === midi,
          );
          note.sent = true;
          if (!alreadyPlaying) this.send(output, 'on', midi, velocity);
        })
        .catch(() => {
          if (this.notes.get(id) !== note) return;
          note.sent = false;
          this.failed = true;
          this.report(
            'Keyboard sound failed · using Screen. Check the connection or choose another output.',
          );
          if (!note.screen) {
            note.screen = true;
            this.playScreen(id, note);
          }
        });
    }
    if (duration !== undefined)
      note.timer = this.time.schedule(() => this.stop(id), duration * 1000);
  }
  private playScreen(id: string, note: RoutedNote, duration?: number) {
    try {
      this.speaker.play(id, note.midi, undefined, duration, note.velocity);
    } catch {
      this.report('Screen sound could not start. Tap a key or try reloading.');
    }
  }
  stop(id: string) {
    const note = this.notes.get(id);
    if (!note) return;
    this.notes.delete(id);
    if (note.timer !== undefined) this.time.cancel(note.timer);
    if (note.screen) this.speaker.stop(id);
    if (
      note.sent &&
      note.output &&
      ![...this.notes.values()].some(
        (other) =>
          other.sent &&
          other.output === note.output &&
          other.midi === note.midi,
      )
    ) {
      try {
        this.send(note.output, 'off', note.midi);
      } catch {
        /* A disconnected port may reject its final note-off. */
      }
    }
  }
  stopAll() {
    for (const id of this.notes.keys()) this.stop(id);
    this.speaker.stopAll();
  }
  close() {
    this.stopAll();
    this.speaker.close();
  }
}
