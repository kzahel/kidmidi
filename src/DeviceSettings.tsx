import styles from './DeviceSettings.module.css';
import { Dialog } from './Dialog';
import type { PianoSession } from './usePianoSession';

export function DeviceSettings({
  session,
  onClose,
}: {
  session: PianoSession;
  onClose(): void;
}) {
  const { midi } = session;
  return (
    <Dialog title="Keyboard settings" onClose={onClose}>
      <p>Plug in your piano, or play with the on-screen keys.</p>
      {midi.inputs.length > 0 && (
        <label className={styles['field']}>
          Keyboard input
          <select
            aria-label="MIDI input"
            value={midi.selected}
            onChange={(event) => midi.setSelected(event.target.value)}
          >
            {midi.inputs.map((input) => (
              <option key={input.id} value={input.id}>
                {input.name || input.id}
              </option>
            ))}
          </select>
        </label>
      )}
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
        Keyboard ranges are saved for this device. Learners keep their own
        hearts and learning progress.
      </p>
    </Dialog>
  );
}
