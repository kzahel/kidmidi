import { useEffect, useState } from 'react';
import { Companion } from './Companion';
import {
  hasBadge,
  journeyProgress,
  lessonLength,
  lessons,
  worlds,
} from './curriculum';
import styles from './LearningMap.module.css';
import { progress } from './learners';
import type { LearnersController } from './useLearners';

const shelves = [
  {
    id: 'garden',
    name: 'Find notes',
    icon: '🌱',
    description: 'Find a note with its name to help.',
  },
  {
    id: 'treehouse',
    name: 'Read notes',
    icon: '🌳',
    description: 'Read the staff. Tap 💡 whenever you need a name.',
  },
  {
    id: 'river',
    name: 'Patterns',
    icon: '🛶',
    description: 'Play a whole shape, then enjoy the celebration.',
  },
  {
    id: 'soon',
    name: 'Coming soon',
    icon: '🔭',
    description: 'More musical adventures. These are not playable yet.',
  },
];
const smallScreen =
  '(max-width: 360px), (max-width: 640px) and (max-height: 800px)';

export function LearningMap({
  controller,
  onLesson,
  onPractice,
  initialWorld,
}: {
  controller: LearnersController;
  initialWorld?: string;
  onLesson(id: string): void;
  onPractice(): void;
}) {
  const [selected, setSelected] = useState(() =>
    Math.max(
      0,
      shelves.findIndex((shelf) => shelf.id === initialWorld),
    ),
  );
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(() =>
    window.matchMedia(smallScreen).matches ? 2 : 4,
  );
  useEffect(() => {
    const media = window.matchMedia(smallScreen);
    const resize = () => {
      setPageSize(media.matches ? 2 : 4);
      setPage(0);
    };
    media.addEventListener('change', resize);
    return () => media.removeEventListener('change', resize);
  }, []);
  const snapshot = controller.snapshot;
  if (!snapshot) return null;
  const stats = progress(snapshot);
  const journey = journeyProgress(snapshot);
  const shelf = shelves[selected];
  const content = lessons.filter((lesson) => lesson.world === shelf.id);
  const future = worlds.filter(
    (world) => !lessons.some((lesson) => lesson.world === world.id),
  );
  const pages = Math.ceil(
    (shelf.id === 'soon' ? future.length : content.length) / pageSize,
  );
  const earned = content.filter((lesson) =>
    hasBadge(snapshot, lesson.id),
  ).length;
  return (
    <section className={styles['map']} aria-label="Learning map">
      <div className={styles['map-heading']}>
        <div>
          <h1>Lessons</h1>
          <p>Choose any lesson. Start wherever you like.</p>
        </div>
        <button
          type="button"
          onClick={onPractice}
          aria-label="Practice note hunt"
        >
          🎹 Free practice
        </button>
      </div>
      <nav className={styles['shelves']} aria-label="Lesson groups">
        {shelves.map((item, index) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={selected === index}
            onClick={() => {
              setSelected(index);
              setPage(0);
            }}
          >
            <span aria-hidden="true">{item.icon}</span> {item.name}
          </button>
        ))}
      </nav>
      <section
        className={styles['world-panel']}
        aria-label={`${shelf.name} lessons`}
      >
        <div className={styles['panel-heading']}>
          <div>
            <h2>
              {shelf.icon} {shelf.name}
            </h2>
            <p>{shelf.description}</p>
          </div>
          <div className={styles['companion-summary']}>
            <Companion learner={snapshot.learner} compact />
            {content.length > 0 && (
              <span>
                {earned}/{content.length} 🏅
              </span>
            )}
          </div>
        </div>
        <div className={styles['lessons']}>
          {content
            .slice(page * pageSize, (page + 1) * pageSize)
            .map((lesson, index) => {
              const badge = hasBadge(snapshot, lesson.id);
              const world = worlds.find((world) => world.id === lesson.world)!;
              return (
                <button
                  type="button"
                  key={lesson.id}
                  onClick={() => onLesson(lesson.id)}
                  aria-label={`${world.name}: ${lesson.name}${badge ? ', badge earned' : ''}`}
                >
                  <span className={styles['lesson-icon']} aria-hidden="true">
                    {lesson.icon}
                  </span>
                  <strong>
                    {index + 1 + page * pageSize}. {lesson.name}
                  </strong>
                  <span className={styles['description']}>
                    {lesson.description}
                  </span>
                  <small>
                    {lesson.patterns
                      ? `${lessonLength(lesson) / lesson.patterns[0].length} patterns`
                      : `${lessonLength(lesson)} notes`}{' '}
                    · {badge ? '🏅 Badge earned' : '▶ Ready to play'}
                  </small>
                </button>
              );
            })}
          {shelf.id === 'soon' &&
            future
              .slice(page * pageSize, (page + 1) * pageSize)
              .map((world) => (
                <article key={world.id} className={styles['preview']}>
                  <span className={styles['lesson-icon']} aria-hidden="true">
                    {world.icon}
                  </span>
                  <strong>{world.topic}</strong>
                  <small>Coming soon</small>
                </article>
              ))}
        </div>
        {pages > 1 && (
          <nav className={styles['pagination']} aria-label="Lesson pages">
            <button
              type="button"
              aria-label="Previous lesson page"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              ← Back
            </button>
            <span>
              {page + 1} / {pages}
            </span>
            <button
              type="button"
              aria-label="Next lesson page"
              disabled={page + 1 === pages}
              onClick={() => setPage(page + 1)}
            >
              More →
            </button>
          </nav>
        )}
      </section>
      <footer className={styles['map-footer']}>
        <span>
          🏅 {journey.badges}/{lessons.length} badges
        </span>
        <span
          aria-label={`${stats.balance} hearts, ${journey.gemBalance} gems`}
        >
          ♥ {stats.balance} · 💎 {journey.gemBalance}
        </span>
      </footer>
    </section>
  );
}
