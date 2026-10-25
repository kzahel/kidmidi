import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  assessLesson,
  hasBadge,
  lessonById,
  lessonDeck,
  lessonOpen,
  patternSize,
} from './curriculum';
import { guessHunt, type HuntLevel, nextHunt, startHunt } from './hunt';
import type { LearnerSnapshot } from './learners';
import {
  browserClock,
  chooseExercise,
  type Encounter,
  type LearningChoice,
  learningDay,
  ResponseTimer,
} from './learning';
import { noteName, octave } from './music';

export type LessonResult = {
  hearts: number;
  gems: number;
  badge: boolean;
  successes: number;
  length: number;
};

export function useHuntSession(
  snapshot: LearnerSnapshot | null,
  record: (event: Encounter) => void,
  enabled: boolean,
) {
  const [state, setState] = useState(startHunt);
  const [roundId, setRoundId] = useState('');
  const [adaptive, setAdaptive] = useState(true);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [result, setResult] = useState<LessonResult | null>(null);
  const [helped, setHelped] = useState(false);
  const run = useRef<{
    lessonId: string;
    id: string;
    deck: number[];
    completed: number;
    points: number;
    events: Encounter[];
    result: LessonResult | null;
  } | null>(null);
  const [choice, setChoice] = useState<LearningChoice>({
    target: 60,
    reason: 'introduce',
    detail: 'Meet a new note',
  });
  const latest = useRef({ snapshot, record, enabled });
  latest.current = { snapshot, record, enabled };
  const model = useRef(state);
  const auto = useRef(true);
  const owner = useRef<string | null>(null);
  const round = useRef<{
    id: string;
    learnerId: string;
    startedAt: number;
    day: string;
    choice: LearningChoice;
    timer: ResponseTimer;
    guesses: number[];
    firstResponseMs: number | null;
    input: Encounter['input'] | null;
    assistance: Encounter['assistance'];
  } | null>(null);
  const suspended = useRef<(typeof round)['current']>(null);

  function begin(
    next = startHunt(model.current.level),
    previous: number | null = null,
  ) {
    const profile = latest.current.snapshot;
    if (!profile || !latest.current.enabled) {
      round.current = null;
      return;
    }
    const activeRun = run.current;
    const lesson = activeRun ? lessonById(activeRun.lessonId) : undefined;
    if (activeRun && lesson) {
      if (!lessonOpen(profile, lesson)) {
        run.current = null;
        setLessonId(null);
      } else if (activeRun.completed >= activeRun.deck.length) {
        round.current = null;
        setResult(activeRun.result);
        return;
      }
    }
    const now = browserClock.now();
    const day = learningDay(now, profile.learner.timeZone);
    const plan: LearningChoice =
      run.current && lesson
        ? {
            target: run.current.deck[run.current.completed],
            reason: 'chosen',
            detail: lesson.name,
          }
        : auto.current
          ? chooseExercise(
              profile.encounters,
              profile.learner.unlocked,
              day,
              previous,
            )
          : {
              target: next.target,
              reason: 'chosen',
              detail: 'Your choice of notes',
            };
    const updated = {
      ...next,
      target: plan.target,
      ...(run.current
        ? { points: run.current.points, solved: run.current.completed }
        : {}),
    };
    round.current = {
      id: crypto.randomUUID(),
      learnerId: profile.learner.id,
      startedAt: now,
      day,
      choice: plan,
      timer: new ResponseTimer(browserClock),
      guesses: [],
      firstResponseMs: null,
      input: null,
      assistance:
        run.current && lesson?.support === 'on-request' ? 'none' : 'note-name',
    };
    setRoundId(round.current.id);
    model.current = updated;
    setState(updated);
    setChoice(plan);
    setHelped(false);
    if (
      lesson?.patterns &&
      run.current &&
      run.current.completed % patternSize(lesson) !== 0
    ) {
      round.current.timer.start();
      if (document.hidden || !document.hasFocus()) round.current.timer.pause();
    }
  }
  useLayoutEffect(() => {
    if (snapshot && owner.current !== snapshot.learner.id) {
      owner.current = snapshot.learner.id;
      auto.current = true;
      setAdaptive(true);
      run.current = null;
      suspended.current = null;
      setLessonId(null);
      setResult(null);
    }
    if (enabled && run.current && suspended.current) {
      round.current = suspended.current;
      suspended.current = null;
      round.current.timer.resume();
    } else begin();
    return () => {
      if (run.current && round.current) {
        round.current.timer.pause();
        suspended.current = round.current;
      }
      round.current = null;
    };
  }, [enabled, snapshot?.learner.id]);

  useEffect(() => {
    const pause = () => round.current?.timer.pause();
    const resume = () => {
      if (!document.hidden) round.current?.timer.resume();
    };
    const visibility = () => (document.hidden ? pause() : resume());
    window.addEventListener('blur', pause);
    window.addEventListener('focus', resume);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('blur', pause);
      window.removeEventListener('focus', resume);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  function guess(midi: number, source: string) {
    const active = round.current;
    if (!active || !latest.current.enabled || model.current.found) return;
    const input =
      source === 'midi'
        ? 'midi'
        : source === 'computer'
          ? 'computer'
          : 'pointer';
    if (!active.guesses.length) {
      active.firstResponseMs = active.timer.read();
      active.input = input;
    } else if (active.input !== input) active.input = 'mixed';
    active.guesses.push(midi);
    const activeRun = run.current;
    const lesson = activeRun ? lessonById(activeRun.lessonId) : undefined;
    const next = guessHunt(model.current, midi, lesson?.heartMultiplier ?? 1);
    model.current = next;
    setState(next);
    if (next.found) {
      const event: Encounter = {
        id: active.id,
        learnerId: active.learnerId,
        startedAt: active.startedAt,
        day: active.day,
        target: next.target,
        spelling: `${noteName(next.target)}${octave(next.target)}`,
        guesses: [...active.guesses],
        firstResponseMs: active.firstResponseMs,
        durationMs: active.timer.read(),
        assistance: active.assistance,
        input: active.input ?? input,
        reason: active.choice.reason,
        reward: next.reward,
        ...(activeRun && lesson
          ? {
              lesson: {
                id: lesson.id,
                revision: lesson.revision,
                runId: activeRun.id,
                index: activeRun.completed,
              },
            }
          : {}),
      };
      if (activeRun && lesson) {
        activeRun.events.push(event);
        activeRun.completed++;
        activeRun.points += next.reward;
        if (activeRun.completed === activeRun.deck.length) {
          const profile = latest.current.snapshot!;
          const assessment = assessLesson(
            lesson,
            activeRun.events,
            activeRun.id,
          );
          activeRun.result = {
            hearts: activeRun.points,
            gems:
              assessment.earned && !hasBadge(profile, lesson.id)
                ? lesson.gems
                : 0,
            badge: assessment.earned,
            successes: assessment.successes,
            length: assessment.length,
          };
        }
      }
      latest.current.record(event);
      // The complete pattern is already visible. Keep recognition moving inside
      // it; the existing held-key celebration runs only at its boundary.
      if (
        activeRun &&
        lesson?.patterns &&
        activeRun.completed % patternSize(lesson) !== 0
      )
        begin(nextHunt(next), next.target);
    }
  }
  function chooseLesson(id: string) {
    const lesson = lessonById(id);
    const profile = latest.current.snapshot;
    if (!lesson || !profile || !lessonOpen(profile, lesson)) return;
    suspended.current = null;
    run.current = {
      lessonId: id,
      id: crypto.randomUUID(),
      deck: lessonDeck(lesson),
      completed: 0,
      points: 0,
      events: [],
      result: null,
    };
    setLessonId(id);
    setResult(null);
    begin();
  }
  const activeLesson = lessonId ? lessonById(lessonId) : undefined;
  const size = activeLesson ? patternSize(activeLesson) : 1;
  const completed = run.current?.completed ?? 0;
  const patternStart =
    Math.floor(Math.max(0, completed - (state.found ? 1 : 0)) / size) * size;
  const pattern =
    activeLesson?.patterns && run.current
      ? {
          pitches: run.current.deck.slice(patternStart, patternStart + size),
          index: completed - patternStart,
          id: `${run.current.id}-${patternStart}`,
        }
      : null;
  return {
    state,
    pattern,
    roundId,
    adaptive,
    choice,
    lesson: activeLesson,
    result,
    helped,
    chooseLesson,
    help: () => {
      if (!round.current || model.current.found) return;
      round.current.assistance = 'note-name';
      setHelped(true);
    },
    guess,
    reset: () => {
      if (run.current) chooseLesson(run.current.lessonId);
      else begin();
    },
    next: () => {
      if (model.current.found)
        begin(nextHunt(model.current), model.current.target);
    },
    chooseRange: (level: HuntLevel | 'adaptive') => {
      run.current = null;
      suspended.current = null;
      setLessonId(null);
      setResult(null);
      auto.current = level === 'adaptive';
      setAdaptive(auto.current);
      begin(startHunt(level === 'adaptive' ? 'first' : level));
    },
    ready: () => {
      round.current?.timer.start();
      if (document.hidden || !document.hasFocus()) round.current?.timer.pause();
    },
  };
}
export type HuntController = ReturnType<typeof useHuntSession>;
