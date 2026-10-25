import { useEffect, useRef, useState } from 'react';
import styles from './SoundLab.module.css';
import {
  type SoundVoice,
  soundPresets,
  type WaveShape,
  waveValue,
} from './sound-settings';
import type { PianoSession } from './usePianoSession';

function Slider({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange(value: number): void;
}) {
  return (
    <label className={styles['slider']}>
      <span>{label}</span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function SoundLab({ session }: { session: PianoSession }) {
  const { soundSettings: settings, setSoundSettings, sound } = session;
  const { voice } = settings.sound;
  const canvas = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState('My sound');
  const [savedMessage, setSavedMessage] = useState('');
  useEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    let frame = 0;
    const data = new Float32Array(1024);
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const draw = () => {
      const sampled = !reducedMotion && sound.speaker.readWaveform(data);
      let peak = 0.0005;
      if (sampled)
        for (const value of data) peak = Math.max(peak, Math.abs(value));
      const live = sampled && peak > 0.0005;
      context.clearRect(0, 0, 560, 100);
      context.lineWidth = 1;
      context.strokeStyle = '#cadbc9';
      context.beginPath();
      context.moveTo(0, 50);
      context.lineTo(560, 50);
      context.stroke();
      context.lineWidth = 3;
      context.strokeStyle = '#477659';
      context.beginPath();
      for (let i = 0; i <= 560; i++) {
        const y = live
          ? data[Math.min(1023, Math.floor((i * 1024) / 561))] / peak
          : waveValue(voice.wave, i / 140);
        if (i === 0) context.moveTo(i, 50 - y * 32);
        else context.lineTo(i, 50 - y * 32);
      }
      context.stroke();
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [sound, voice.wave]);
  function edit(patch: Partial<SoundVoice>) {
    setSavedMessage('');
    setSoundSettings((s) => ({
      ...s,
      sound: {
        ...s.sound,
        id: 'custom',
        name: 'My sound',
        voice: { ...s.sound.voice, ...patch },
      },
    }));
  }
  function note(midi: number, on: boolean) {
    session.play(
      { type: on ? 'on' : 'off', note: midi, velocity: 90, channel: 0 },
      'audition',
    );
  }
  return (
    <section className={styles['lab']} aria-label="Sound playground">
      <div className={styles['section-heading']}>
        <h3>Pick a sound</h3>
        <span>For Screen sound</span>
      </div>
      <div className={styles['presets']}>
        {soundPresets.map((preset) => (
          <button
            type="button"
            key={preset.id}
            aria-pressed={settings.sound.id === preset.id}
            onClick={() => {
              setSavedMessage('');
              setSoundSettings((s) => ({ ...s, sound: preset }));
            }}
          >
            <span aria-hidden="true">{preset.emoji}</span>
            {preset.name}
          </button>
        ))}
      </div>
      {settings.saved.length > 0 && (
        <div className={styles['saved']} aria-label="My sounds">
          {settings.saved.map((preset) => (
            <div key={preset.id}>
              <button
                type="button"
                aria-pressed={settings.sound.id === preset.id}
                onClick={() =>
                  setSoundSettings((s) => ({ ...s, sound: preset }))
                }
              >
                {preset.emoji} {preset.name}
              </button>
              <button
                type="button"
                aria-label={`Delete sound ${preset.name}`}
                onClick={() =>
                  setSoundSettings((s) => ({
                    ...s,
                    saved: s.saved.filter((p) => p.id !== preset.id),
                  }))
                }
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className={styles['scope']}>
        <div>
          <strong>
            {settings.sound.emoji} {settings.sound.name}
          </strong>
          <span>Wave shape · {voice.wave}</span>
        </div>
        <canvas
          ref={canvas}
          width="560"
          height="100"
          role="img"
          aria-label={`${voice.wave} wave, showing Screen audio while playing`}
        />
      </div>
      <div className={styles['try-keys']} aria-label="Try your sound">
        {[60, 62, 64, 65, 67, 69, 71, 72].map((midi, i) => (
          <button
            type="button"
            key={midi}
            aria-label={`Try ${['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'][i]}`}
            aria-pressed={session.pressed.has(midi)}
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              note(midi, true);
            }}
            onPointerUp={() => note(midi, false)}
            onPointerCancel={() => note(midi, false)}
            onLostPointerCapture={() => note(midi, false)}
            onKeyDown={(e) => {
              if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
                e.preventDefault();
                note(midi, true);
              }
            }}
            onKeyUp={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                note(midi, false);
              }
            }}
            onBlur={() => note(midi, false)}
          >
            {['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'][i]}
          </button>
        ))}
      </div>
      <p className={styles['hint']}>
        Try these keys or your connected piano. This won’t record or count as
        practice. Choose Screen or Both to hear your creations.
      </p>
      <details className={styles['editor']}>
        <summary>✎ Make a sound</summary>
        <div className={styles['shapes']} role="group" aria-label="Wave shape">
          {(['sine', 'triangle', 'square', 'sawtooth'] as WaveShape[]).map(
            (wave) => (
              <button
                type="button"
                key={wave}
                aria-pressed={voice.wave === wave}
                onClick={() => edit({ wave })}
              >
                <svg viewBox="0 0 80 32" aria-hidden="true">
                  <path
                    d={Array.from(
                      { length: 81 },
                      (_, i) =>
                        `${i ? 'L' : 'M'}${i},${16 - waveValue(wave, i / 40) * 11}`,
                    ).join(' ')}
                  />
                </svg>
                {wave === 'sawtooth'
                  ? 'Saw'
                  : wave[0].toUpperCase() + wave.slice(1)}
              </button>
            ),
          )}
        </div>
        <Slider
          label="Soft → bright"
          value={voice.brightness}
          onChange={(brightness) => edit({ brightness })}
        />
        <Slider
          label="Pluck → hold"
          value={voice.sustain}
          onChange={(sustain) => edit({ sustain })}
        />
        <Slider
          label="Wobble"
          value={voice.wobble}
          onChange={(wobble) => edit({ wobble })}
        />
        <Slider
          label="Room · reverb"
          value={voice.reverb}
          onChange={(reverb) => edit({ reverb })}
        />
        <details className={styles['more']}>
          <summary>More sound shapes</summary>
          <div className={styles['envelope']}>
            <svg
              viewBox="0 0 300 65"
              role="img"
              aria-label="Sound envelope: rise, body, and release"
            >
              <path
                d={`M5,60 L${10 + voice.attack * 65},5 L110,${58 - voice.sustain * 45} L200,${58 - voice.sustain * 45} Q${210 + voice.release * 30},60 295,60`}
              />
            </svg>
            <span>Rise → body → tail</span>
          </div>
          <Slider
            label="Rise · attack"
            value={voice.attack}
            min={0.005}
            max={1}
            step={0.005}
            onChange={(attack) => edit({ attack })}
          />
          <Slider
            label="Tail · release"
            value={voice.release}
            min={0.03}
            max={2}
            onChange={(release) => edit({ release })}
          />
          <Slider
            label="Pitch swoop"
            value={voice.swoop}
            min={-400}
            max={400}
            step={10}
            onChange={(swoop) => edit({ swoop })}
          />
        </details>
        <div className={styles['actions']}>
          <button
            type="button"
            onClick={() =>
              edit({
                wave: (['sine', 'triangle', 'square', 'sawtooth'] as const)[
                  Math.floor(Math.random() * 4)
                ],
                brightness: 0.2 + Math.random() * 0.8,
                sustain: Math.random(),
                attack: 0.005 + Math.random() * 0.25,
                release: 0.05 + Math.random(),
                wobble: Math.random(),
                swoop: Math.round((Math.random() - 0.5) * 600),
                reverb: Math.random() * 0.6,
              })
            }
          >
            🎲 Surprise me
          </button>
          <button
            type="button"
            onClick={() => {
              session.releaseAll();
              setSoundSettings((s) => ({ ...s, sound: soundPresets[0] }));
            }}
          >
            Reset sound
          </button>
        </div>
        <div className={styles['save-form']}>
          <label>
            Emoji
            <select
              aria-label="Sound emoji"
              value={settings.sound.emoji}
              onChange={(e) =>
                setSoundSettings((s) => ({
                  ...s,
                  sound: { ...s.sound, id: 'custom', emoji: e.target.value },
                }))
              }
            >
              {[
                '🎹',
                '🫧',
                '🤖',
                '👻',
                '🚀',
                '🔔',
                '🎮',
                '🐱',
                '👽',
                '🌈',
                '🐸',
              ].map((emoji) => (
                <option key={emoji}>{emoji}</option>
              ))}
            </select>
          </label>
          <label>
            Name
            <input
              aria-label="Sound name"
              maxLength={32}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={settings.saved.length >= 12}
            onClick={() => {
              const saved = {
                ...settings.sound,
                id: crypto.randomUUID(),
                name: name.trim() || 'My sound',
              };
              setSoundSettings((s) => ({
                ...s,
                sound: saved,
                saved: [...s.saved, saved],
              }));
              setSavedMessage('Sound saved on this device.');
            }}
          >
            Save sound
          </button>
        </div>
        <p className={styles['hint']} role="status">
          {settings.saved.length >= 12
            ? 'Your shelf is full. Delete a saved sound to make room.'
            : savedMessage || 'Your sound and settings stay in this browser.'}
        </p>
      </details>
    </section>
  );
}
