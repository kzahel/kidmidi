import { Backdrop } from './Backdrop';
import styles from './Companion.module.css';
import type { Dance, DanceMove } from './companion-dance';
import type { Outfit } from './learners';
import { Pet } from './Pet';

const danceStyles: Record<DanceMove, string> = {
  hop: styles['hop'],
  leap: styles['leap'],
  echo: styles['echo'],
  twirl: styles['twirl'],
  spin: styles['spin'],
  flip: styles['flip'],
  backflip: styles['backflip'],
  tiptoe: styles['tiptoe'],
};

export function Companion({
  learner,
  playing = false,
  celebration,
  compact = false,
  freePlay = false,
  dance,
}: {
  learner: Outfit;
  playing?: boolean;
  celebration?: string;
  compact?: boolean;
  freePlay?: boolean;
  dance?: Dance | null;
}) {
  const mood = celebration ? 'cheering' : playing ? 'playing' : 'waiting';
  return (
    <aside
      className={`${styles['companion']} ${compact ? styles['compact'] : ''}`}
      aria-label="Your piano companion"
      data-mood={mood}
      data-dance={dance?.move ?? 'none'}
      data-step={dance?.id}
      data-lift={dance?.lift}
    >
      <Backdrop id={learner.backdrop} />
      <div className={freePlay ? styles['dance-floor'] : undefined}>
        <div
          key={dance?.id ?? celebration ?? 'listening'}
          className={`${styles['friend']} ${dance ? danceStyles[dance.move] : celebration ? styles['cheering'] : playing ? styles['playing'] : ''}`}
          style={
            dance
              ? ({
                  '--dance-lean': `${dance.direction * 7}deg`,
                  '--dance-rise': `${-dance.lift}%`,
                } as React.CSSProperties)
              : undefined
          }
        >
          <Pet learner={learner} />
        </div>
      </div>
      <span className={styles['reaction']} aria-hidden="true">
        {dance && dance.move !== 'hop'
          ? '✧ ♫ ✧'
          : celebration
            ? '✦ ♥ ✦'
            : playing || dance
              ? '♪ ♫'
              : '♪'}
      </span>
      <span
        className={styles['caption']}
        role={dance && dance.move !== 'hop' ? 'status' : undefined}
      >
        {dance?.label ?? 'With you'}
      </span>
    </aside>
  );
}
