import styles from './DeviceSettings.module.css';
import { Dialog } from './Dialog';
import { SoundLab } from './SoundLab';
import { soundRoutes } from './sound-settings';
import type { PianoSession } from './usePianoSession';

export function DeviceSettings({
  session,
  onClose,
}: {
  session: PianoSession;
  onClose(): void;
}) {
  const { midi, soundSettings: settings, setSoundSettings } = session;
  return (
    <Dialog
      title="Sound and settings"
      onClose={() => {
        session.releaseAll();
        onClose();
      }}
    >
      <h3 className={styles['title']}>Where should sound come out?</h3>
      <div
        className={styles['routes']}
        role="group"
        aria-label="Sound destination"
      >
        {soundRoutes.map((route) => (
          <button
            type="button"
            key={route.id}
            aria-pressed={settings.route === route.id}
            onClick={() => {
              session.releaseAll();
              setSoundSettings((s) => ({ ...s, route: route.id }));
            }}
          >
            <span aria-hidden="true">{route.icon}</span>
            {route.label}
          </button>
        ))}
      </div>
      <p className={styles['quiet']}>
        {settings.route === 'auto'
          ? 'Auto: piano keys use their own sound; screen keys use this device. Phrases and recordings use the selected MIDI output when available.'
          : settings.route === 'screen'
            ? 'All notes, phrases and recordings play through this device’s speakers or headphones.'
            : settings.route === 'keyboard'
              ? 'Piano keys use their own sound. Screen keys, phrases and recordings play through the selected MIDI output, with Screen as a fallback.'
              : settings.route === 'both'
                ? 'Add Screen sound alongside your piano. Screen keys, phrases and recordings also play through the selected MIDI output.'
                : 'Kidmidi sends no sound. Your physical piano can still make its own sound.'}
      </p>
      {session.connected &&
        (settings.route === 'screen' ||
          settings.route === 'both' ||
          settings.route === 'quiet') && (
          <p className={styles['notice']}>
            Your piano controls its built-in speakers. Turn its volume down to
            hear only Screen sound, or to play quietly.
          </p>
        )}
      {(settings.route === 'keyboard' || settings.route === 'both') &&
        !midi.output && (
          <p className={styles['notice']} role="status">
            No MIDI output available. Screen keys and playback use Screen sound.
          </p>
        )}
      {session.soundError && (
        <p className={styles['notice']} role="status">
          {session.soundError}
        </p>
      )}
      <label className={styles['volume']}>
        Screen volume
        <input
          aria-label="Screen volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={settings.volume}
          onChange={(e) =>
            setSoundSettings((s) => ({ ...s, volume: Number(e.target.value) }))
          }
        />
      </label>
      <SoundLab session={session} />
      <details className={styles['keyboard']}>
        <summary>⌨ Keyboard connection</summary>
        <p>Plug in your piano, or play with the on-screen keys.</p>
        {midi.inputs.length > 0 && (
          <label className={styles['field']}>
            Keyboard input
            <select
              aria-label="MIDI input"
              value={midi.selected}
              onChange={(e) => {
                session.releaseAll();
                midi.setSelected(e.target.value);
              }}
            >
              {midi.inputs.map((input) => (
                <option key={input.id} value={input.id}>
                  {input.name || input.id}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className={styles['field']}>
          Keyboard output
          <select
            aria-label="MIDI output"
            value={midi.outputChoice}
            onChange={(e) => {
              session.releaseAll();
              midi.setOutput(e.target.value);
            }}
          >
            <option value="auto">
              Auto · {midi.automaticOutput?.name || 'No matching output'}
            </option>
            {midi.outputs.map((output) => (
              <option key={output.id} value={output.id}>
                {output.name || output.id}
              </option>
            ))}
            {midi.outputChoice !== 'auto' &&
              !midi.outputs.some(
                (output) => output.id === midi.outputChoice,
              ) && (
                <option value={midi.outputChoice}>
                  Saved output unavailable ·{' '}
                  {midi.output?.name || 'Screen fallback'}
                </option>
              )}
          </select>
        </label>
        <button
          type="button"
          disabled={!midi.supported || midi.requesting}
          onClick={() => void midi.connect()}
        >
          {midi.requesting ? 'Connecting…' : 'Connect keyboard'}
        </button>
        <p role="status">
          {midi.supported
            ? midi.status
            : 'MIDI needs Chrome and HTTPS or localhost.'}
        </p>
        <p className={styles['quiet']}>
          Screen presets change this device’s sound. Your piano keeps its own
          instrument and volume. MIDI input is never sent back to the piano.
        </p>
        <p className={styles['quiet']}>
          Keyboard ranges are saved for this device. Learners keep their own
          hearts and learning progress.
        </p>
      </details>
    </Dialog>
  );
}
