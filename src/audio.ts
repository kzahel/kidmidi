import type { Note } from './music';
import { type SoundVoice, soundPresets } from './sound-settings';

type Voice = {
  id: string;
  oscillator: OscillatorNode;
  gain: GainNode;
  filter: BiquadFilterNode;
  wobble: OscillatorNode;
  depth: GainNode;
};

// Browser synthesis only. Input, MIDI output and practice recognition live elsewhere.
export class PianoAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private wet?: GainNode;
  private dry?: GainNode;
  private convolver?: ConvolverNode;
  private analyser?: AnalyserNode;
  private voices = new Map<string, Voice>();
  private sounding = new Set<Voice>();
  private settings: SoundVoice = soundPresets[0].voice;
  private volume = 0.65;

  configure(voice: SoundVoice, volume: number) {
    this.settings = { ...voice };
    this.volume = volume;
    if (this.context) {
      const now = this.context.currentTime;
      this.master!.gain.setTargetAtTime(volume * 0.7, now, 0.02);
      this.wet!.gain.setTargetAtTime(voice.reverb * 0.65, now, 0.02);
      this.dry!.gain.setTargetAtTime(1 - voice.reverb * 0.25, now, 0.02);
      for (const active of this.sounding) {
        active.oscillator.type = voice.wave;
        active.filter.frequency.setTargetAtTime(
          350 + voice.brightness ** 2 * 13000,
          now,
          0.02,
        );
        active.depth.gain.setTargetAtTime(voice.wobble * 40, now, 0.02);
      }
    }
  }

  private init() {
    if (this.context) return this.context;
    const context = new AudioContext();
    this.context = context;
    const master = context.createGain();
    const dry = context.createGain();
    const wet = context.createGain();
    master.gain.value = this.volume * 0.7;
    dry.gain.value = 1 - this.settings.reverb * 0.25;
    wet.gain.value = this.settings.reverb * 0.65;
    const convolver = context.createConvolver();
    const compressor = context.createDynamicsCompressor();
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    // A small, local impulse response. No samples or network requests.
    const impulse = context.createBuffer(
      2,
      Math.floor(context.sampleRate * 1.5),
      context.sampleRate,
    );
    let seed = 12345;
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        seed = (seed * 16807) % 2147483647;
        data[i] = (seed / 1073741823.5 - 1) * (1 - i / data.length) ** 3;
      }
    }
    convolver.buffer = impulse;
    dry.connect(master);
    convolver.connect(wet).connect(master);
    master.connect(compressor).connect(analyser).connect(context.destination);
    this.master = master;
    this.dry = dry;
    this.wet = wet;
    this.convolver = convolver;
    this.analyser = analyser;
    this.configure(this.settings, this.volume);
    return context;
  }

  unlock() {
    const context = this.init();
    void context.resume().catch(() => {});
  }

  play(
    id: string,
    midi: number,
    when?: number,
    duration?: number,
    velocity = 90,
  ) {
    const context = this.init();
    void context.resume().catch(() => {});
    this.stop(id);
    // Bound polyphony, including long releases, when children sweep the keys.
    if (when === undefined && this.sounding.size >= 32)
      this.finish(this.sounding.values().next().value!);
    const start = when ?? context.currentTime;
    const shape = this.settings;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const wobble = context.createOscillator();
    const depth = context.createGain();
    oscillator.type = shape.wave;
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    oscillator.detune.setValueAtTime(shape.swoop, start);
    oscillator.detune.setTargetAtTime(0, start, 0.045);
    wobble.frequency.value = 5.5;
    depth.gain.value = shape.wobble * 40;
    wobble.connect(depth).connect(oscillator.detune);
    filter.type = 'lowpass';
    filter.frequency.value = 350 + shape.brightness ** 2 * 13000;
    filter.Q.value = 0.65;
    const peak = (0.18 * Math.min(127, Math.max(1, velocity))) / 127;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + shape.attack);
    gain.gain.setTargetAtTime(
      Math.max(0.0001, peak * shape.sustain),
      start + shape.attack,
      0.14,
    );
    oscillator.connect(filter).connect(gain);
    gain.connect(this.dry!);
    gain.connect(this.convolver!);
    const voice = { id, oscillator, gain, filter, wobble, depth };
    this.voices.set(id, voice);
    this.sounding.add(voice);
    oscillator.onended = () => this.disconnect(voice);
    oscillator.start(start);
    wobble.start(start);
    if (duration !== undefined) this.release(voice, start + duration);
  }

  private release(voice: Voice, at: number) {
    const tail = this.settings.release / 3;
    voice.gain.gain.cancelAndHoldAtTime(at);
    voice.gain.gain.setTargetAtTime(0, at, tail);
    voice.oscillator.stop(at + tail * 6);
    voice.wobble.stop(at + tail * 6);
  }
  private disconnect(voice: Voice) {
    voice.oscillator.disconnect();
    voice.gain.disconnect();
    voice.filter.disconnect();
    voice.wobble.disconnect();
    voice.depth.disconnect();
    this.sounding.delete(voice);
    if (this.voices.get(voice.id) === voice) this.voices.delete(voice.id);
  }
  private finish(voice: Voice) {
    voice.oscillator.stop();
    voice.wobble.stop();
    this.disconnect(voice);
  }
  stop(id: string) {
    const voice = this.voices.get(id);
    if (voice && this.context) {
      this.voices.delete(id);
      this.release(voice, this.context.currentTime);
    }
  }
  stopAll() {
    for (const voice of this.sounding) this.finish(voice);
    // Replacing the impulse discards an old room tail on blur, stop or navigation.
    if (this.convolver) {
      const buffer = this.convolver.buffer;
      this.convolver.buffer = null;
      this.convolver.buffer = buffer;
    }
  }
  hear(notes: Note[]) {
    this.stopAll();
    const context = this.init();
    let time = context.currentTime + 0.08;
    notes.forEach((note, index) => {
      this.play(`preview-${index}`, note.midi, time, note.beats * 0.48 - 0.04);
      time += note.beats * 0.48;
    });
  }
  readWaveform(data: Float32Array<ArrayBuffer>) {
    if (!this.analyser || !this.sounding.size) return false;
    this.analyser.getFloatTimeDomainData(data);
    return true;
  }
  close() {
    this.stopAll();
    void this.context?.close().catch(() => {});
    this.context = undefined;
  }
}
