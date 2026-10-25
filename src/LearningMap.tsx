import { useState } from 'react';
import {
  hasBadge,
  journeyProgress,
  lessonById,
  lessonOpen,
  lessons,
  worldOpen,
  worlds,
} from './curriculum';
import styles from './LearningMap.module.css';
import { progress } from './learners';
import type { LearnersController } from './useLearners';

export function LearningMap({
  controller,
  onLesson,
  onPractice,
}: {
  controller: LearnersController;
  onLesson(id: string): void;
  onPractice(): void;
}) {
  const snapshot = controller.snapshot;
  const [selected, setSelected] = useState(0);
  if (!snapshot) return null;
  const stats = progress(snapshot);
  const journey = journeyProgress(snapshot);
  const world = worlds[selected];
  const content = lessons.filter((lesson) => lesson.world === world.id);
  const open = worldOpen(snapshot, world);
  const ready = world.gate && hasBadge(snapshot, world.gate.badge);
  const requiredLesson = world.gate ? lessonById(world.gate.badge) : undefined;
  const previousWorldIndex = Math.max(
    0,
    worlds.findIndex((world) => world.id === requiredLesson?.world),
  );
  const previousWorld = worlds[previousWorldIndex];
  const disabled = controller.busy || controller.pendingCount > 0;
  return (
    <section className={styles['map']} aria-label="Learning map">
      <div className={styles['map-heading']}>
        <h1>🗺️</h1>
        <span
          aria-label={`${stats.balance} hearts, ${journey.gemBalance} gems`}
        >
          ♥ {stats.balance} · 💎 {journey.gemBalance}
        </span>
        <button
          type="button"
          onClick={onPractice}
          aria-label="Practice note hunt"
        >
          🎹 <span>Practice</span>
        </button>
      </div>
      <nav className={styles['worlds']} aria-label="Worlds">
        {worlds.map((place, index) => (
          <button
            type="button"
            key={place.id}
            onClick={() => setSelected(index)}
            aria-pressed={index === selected}
            title={place.topic}
            aria-description={place.topic}
            aria-label={`World ${index + 1}: ${place.name}${lessons.some((lesson) => lesson.world === place.id) ? '' : ', coming soon'}`}
          >
            <span aria-hidden="true">{place.icon}</span>
            <small>
              {index + 1} {worldOpen(snapshot, place) ? '✦' : '🔒'}
            </small>
          </button>
        ))}
      </nav>
      <div
        className={styles['world-panel']}
        aria-label={`World ${selected + 1} lessons`}
      >
        <h2>
          <span aria-hidden="true">{world.icon}</span> {world.name}
        </h2>
        {!content.length ? (
          <div className={styles['gate']}>
            <span aria-hidden="true">🌙</span>
            <p>Soon</p>
          </div>
        ) : !open && world.gate ? (
          <div className={styles['gate']}>
            <span aria-hidden="true">🔒</span>
            <p
              aria-label={`${previousWorld.name} badge ${ready ? 'collected' : 'needed'}`}
            >
              {requiredLesson?.icon ?? '🏅'} {ready ? '✓' : '○'}
            </p>
            <button
              type="button"
              disabled={disabled || !ready || stats.balance < world.gate.hearts}
              onClick={() => void controller.buy(`gate-${world.id}`)}
              aria-label={`Open ${world.name} for ${world.gate.hearts} hearts`}
            >
              🔑 ♥ {world.gate.hearts}
            </button>
            {!ready && (
              <button
                type="button"
                onClick={() => setSelected(previousWorldIndex)}
                aria-label={`Back to ${previousWorld.name}`}
              >
                {previousWorld.icon} ←
              </button>
            )}
          </div>
        ) : (
          <div className={styles['lessons']}>
            {content.map((lesson) => {
              const earned = hasBadge(snapshot, lesson.id);
              const unlocked = lessonOpen(snapshot, lesson);
              return (
                <button
                  type="button"
                  key={lesson.id}
                  disabled={!unlocked}
                  onClick={() => onLesson(lesson.id)}
                  aria-label={`${world.name}: ${lesson.name}${earned ? ', badge earned' : ''}`}
                >
                  <span className={styles['lesson-icon']} aria-hidden="true">
                    {lesson.icon}
                  </span>
                  <strong>{lesson.name}</strong>
                  <small>
                    {!unlocked ? '🔒' : earned ? '🏅 ✓' : `💎 ${lesson.gems}`}
                  </small>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
