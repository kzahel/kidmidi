import { useEffect, useRef, useState } from 'react';
import { IndexedDbLearners } from './learner-repository';
import {
  type Learner,
  type LearnerRepository,
  type LearnerSnapshot,
  withEncounter,
} from './learners';
import type { Encounter } from './learning';

export function useLearners(repository: LearnerRepository = defaultRepository) {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [snapshot, setSnapshot] = useState<LearnerSnapshot | null>(null);
  const current = useRef(snapshot);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const pending = useRef(new Map<string, Encounter>());
  const queue = useRef(Promise.resolve());
  const alive = useRef(true);
  function publish(next: LearnerSnapshot) {
    if (!alive.current) return;
    current.current = next;
    setSnapshot(next);
  }
  function fail(error: unknown) {
    if (alive.current)
      setError(
        error instanceof Error
          ? error.message
          : 'Could not save learner progress.',
      );
  }
  async function refreshList() {
    const list = await repository.list();
    if (alive.current) setLearners(list);
  }
  async function init() {
    setBusy(true);
    setError('');
    try {
      const list = await repository.list();
      const selected = await repository.selected();
      const id =
        list.find((learner) => learner.id === selected)?.id ?? list[0]?.id;
      const state = id
        ? await repository.load(id)
        : await repository.create({
            id: crypto.randomUUID(),
            name: 'Piano friend',
            createdAt: Date.now(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            unlocked: 3,
            pet: 'fox',
            charm: null,
          });
      publish(state);
      await refreshList();
    } catch (error) {
      fail(error);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  useEffect(() => {
    alive.current = true;
    void init();
    return () => {
      alive.current = false;
    };
  }, [repository]);

  function save(event: Encounter) {
    queue.current = queue.current.then(async () => {
      try {
        const saved = await repository.record(event);
        pending.current.delete(event.id);
        if (alive.current) {
          setPendingCount(pending.current.size);
          if (!pending.current.size) setError('');
          if (current.current?.learner.id === event.learnerId) {
            let merged = saved;
            for (const outstanding of pending.current.values())
              if (outstanding.learnerId === event.learnerId)
                merged = withEncounter(merged, outstanding);
            publish(merged);
          }
        }
      } catch (error) {
        fail(error);
      }
    });
  }
  function record(event: Encounter) {
    if (!current.current || current.current.learner.id !== event.learnerId)
      return;
    publish(withEncounter(current.current, event));
    pending.current.set(event.id, event);
    setPendingCount(pending.current.size);
    save(event);
  }
  async function retry() {
    if (!current.current) return init();
    setError('');
    for (const event of pending.current.values()) save(event);
    await queue.current;
  }
  async function change(action: () => Promise<LearnerSnapshot>) {
    setBusy(true);
    setError('');
    try {
      await queue.current;
      if (pending.current.size)
        throw new Error(
          'Please retry saving your hearts before changing learners or rewards.',
        );
      publish(await action());
      await refreshList();
    } catch (error) {
      fail(error);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return {
    learners,
    snapshot,
    busy,
    error,
    pendingCount,
    record,
    retry,
    select: (id: string) =>
      change(async () => {
        await repository.select(id);
        return repository.load(id);
      }),
    create: (name: string) =>
      change(() =>
        repository.create({
          id: crypto.randomUUID(),
          name,
          createdAt: Date.now(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          unlocked: 3,
          pet: 'fox',
          charm: null,
        }),
      ),
    rename: (name: string) =>
      change(async () => {
        const id = current.current!.learner.id;
        await repository.rename(id, name);
        return repository.load(id);
      }),
    buy: (item: string) =>
      change(() =>
        repository.buy(
          current.current!.learner.id,
          item,
          crypto.randomUUID(),
          Date.now(),
        ),
      ),
    equip: (
      slot: 'pet' | 'charm' | 'backdrop',
      item: string | null,
      remove = false,
    ) =>
      change(() =>
        repository.equip(current.current!.learner.id, slot, item, remove),
      ),
  };
}
const defaultRepository = new IndexedDbLearners();
export type LearnersController = ReturnType<typeof useLearners>;
