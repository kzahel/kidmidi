import styles from './Companion.module.css';
import type { Learner } from './learners';
import { Pet } from './Pet';

export function Companion({
  learner,
  playing = false,
  celebration,
  compact = false,
}: {
  learner: Pick<Learner, 'pet' | 'charm'>;
  playing?: boolean;
  celebration?: string;
  compact?: boolean;
}) {
  const mood = celebration ? 'cheering' : playing ? 'playing' : 'waiting';
  return (
    <aside
      className={`${styles['companion']} ${compact ? styles['compact'] : ''}`}
      aria-label="Your piano companion"
      data-mood={mood}
    >
      <div
        key={celebration ?? 'listening'}
        className={`${styles['friend']} ${celebration ? styles['cheering'] : playing ? styles['playing'] : ''}`}
      >
        <Pet learner={learner} />
      </div>
      <span className={styles['reaction']} aria-hidden="true">
        {celebration ? '✦ ♥ ✦' : playing ? '♪ ♫' : '♪'}
      </span>
      <span className={styles['caption']}>With you</span>
    </aside>
  );
}
