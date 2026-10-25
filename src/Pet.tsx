import type { Learner } from './learners';
import { rewards } from './learners';
import styles from './Pet.module.css';

export function Pet({
  learner,
  small = false,
}: {
  learner: Learner;
  small?: boolean;
}) {
  const pet = rewards.find((item) => item.id === learner.pet);
  const charm = rewards.find((item) => item.id === learner.charm);
  return (
    <span
      className={styles['pet'] + ' ' + (small ? styles['small'] : '')}
      role="img"
      aria-label={`${pet?.name ?? 'Fox friend'}${charm ? ` with ${charm.name.toLowerCase()}` : ''}`}
    >
      <span>{pet?.icon ?? '🦊'}</span>
      {charm && <span className={styles['charm']}>{charm.icon}</span>}
    </span>
  );
}
