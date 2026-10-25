import { useState } from 'react';
import styles from './DeviceSettings.module.css';
import { Dialog } from './Dialog';
import { SettingsTabs } from './SettingsTabs';
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
  const [tab, setTab] = useState<'sounds' | 'make' | 'output' | 'keyboard'>(
    'sounds',
  );
  const tabs = [
    { id: 'sounds', label: 'Sounds' },
    { id: 'make', label: 'Make' },
    { id: 'output', label: 'Output' },
    { id: 'keyboard', label: 'Keyboard' },
  ] as const;
  function changeTab(next: typeof tab) {
    session.releaseAll();
    setTab(next);
  }
  return (
    <Dialog
      title="Sound and settings"
      fitted
      onClose={() => {
        session.releaseAll();
        onClose();
      }}
    >
      <div className={styles['settings']}>
        <SettingsTabs
          id="settings"
          label="Settings"
          tabs={tabs}
          value={tab}
          onChange={changeTab}
        />
        <div
          className={styles['panel']}
          role="tabpanel"
          id="settings-panel"
          aria-labelledby={`settings-${tab}`}
        >
          <SoundLab
            session={session}
            page={tab === 'sounds' || tab === 'make' ? tab : null}
            onMake={() => changeTab('make')}
          />
          {tab === 'output' && (
            <section className={styles['output']} aria-label="Sound output">
              <div className={styles['output-controls']}>
                <h3 className={styles['title']}>
                  Where should sound come out?
                </h3>
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
                      setSoundSettings((s) => ({
                        ...s,
                        volume: Number(e.target.value),
                      }))
                    }
                  />
                </label>
              </div>
              <div className={styles['output-help']}>
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
                      Your piano controls its built-in speakers. Turn its volume
                      down to hear only Screen sound, or to play quietly.
                    </p>
                  )}
                {(settings.route === 'keyboard' || settings.route === 'both') &&
                  !midi.output && (
                    <p className={styles['notice']} role="status">
                      No MIDI output available. Screen keys and playback use
                      Screen sound.
                    </p>
                  )}
                {session.soundError && (
                  <p className={styles['notice']} role="status">
                    {session.soundError}
                  </p>
                )}
              </div>
            </section>
          )}
          {tab === 'keyboard' && (
            <section
              className={styles['keyboard']}
              aria-label="Keyboard connection"
            >
              <div className={styles['connections']}>
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
                      Auto ·{' '}
                      {midi.automaticOutput?.name || 'No matching output'}
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
              </div>
              <div className={styles['connection-help']}>
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
                  Your piano keeps its own instrument and volume. Screen presets
                  change this device’s sound.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </Dialog>
  );
}
