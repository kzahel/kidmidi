import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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

export function useHuntSession(
  snapshot: LearnerSnapshot | null,
  record: (event: Encounter) => void,
  enabled: boolean,
) {
  const [state, setState] = useState(startHunt);
  const [roundId, setRoundId] = useState('');
  const [adaptive, setAdaptive] = useState(true);
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
  } | null>(null);

  function begin(
    next = startHunt(model.current.level),
    previous: number | null = null,
  ) {
    const profile = latest.current.snapshot;
    if (!profile || !latest.current.enabled) {
      round.current = null;
      return;
    }
    const now = browserClock.now();
    const day = learningDay(now, profile.learner.timeZone);
    const plan: LearningChoice = auto.current
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
    const updated = { ...next, target: plan.target };
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
    };
    setRoundId(round.current.id);
    model.current = updated;
    setState(updated);
    setChoice(plan);
  }
  useLayoutEffect(() => {
    if (snapshot && owner.current !== snapshot.learner.id) {
      owner.current = snapshot.learner.id;
      auto.current = true;
      setAdaptive(true);
    }
    begin();
    return () => {
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
    const next = guessHunt(model.current, midi);
    model.current = next;
    setState(next);
    if (next.found)
      latest.current.record({
        id: active.id,
        learnerId: active.learnerId,
        startedAt: active.startedAt,
        day: active.day,
        target: next.target,
        spelling: `${noteName(next.target)}${octave(next.target)}`,
        guesses: [...active.guesses],
        firstResponseMs: active.firstResponseMs,
        durationMs: active.timer.read(),
        assistance: 'note-name',
        input: active.input ?? input,
        reason: active.choice.reason,
        reward: next.reward,
      });
  }
  return {
    state,
    roundId,
    adaptive,
    choice,
    guess,
    reset: () => begin(),
    next: () => {
      if (model.current.found)
        begin(nextHunt(model.current), model.current.target);
    },
    chooseRange: (level: HuntLevel | 'adaptive') => {
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
