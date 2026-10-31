import { type Lesson, type StarCount } from './curriculum';
import styles from './LessonStars.module.css';

export function LessonStars({
  stars,
  label = 'Best',
}: {
  stars: StarCount;
  label?: string;
}) {
  return (
    <span
      className={styles['stars']}
      aria-label={`${label}: ${stars} of 3 stars`}
    >
      <span aria-hidden="true">
        {'★'.repeat(stars)}
        <span className={styles['empty']}>{'☆'.repeat(3 - stars)}</span>
      </span>
    </span>
  );
}

export function StarRules({ lesson }: { lesson: Lesson }) {
  return (
    <div className={styles['rules']} aria-label="Star requirements">
      <strong>Stars for this exercise</strong>
      <span>★ Finish with at least 60% of the possible hearts.</span>
      <span>★★ No wrong notes, at any pace.</span>
      <span>
        ★★★ No wrong notes and every find within{' '}
        {lesson.patterns
          ? '4 seconds to start each shape, then 2 seconds per note'
          : '4 seconds'}
        .
      </span>
      <span>
        Held keys and celebrations do not use up finding time. Names and hints
        are always allowed. Your best never goes down.
      </span>
      <span>
        💎 +1 for each no-mistakes set. Your first star also gives 💎{' '}
        {lesson.gems} once; earlier badge rewards still count.
      </span>
    </div>
  );
}
