import {
  type Learner,
  type LearnerRepository,
  type LearnerSnapshot,
  learnerName,
  type Purchase,
  withEncounter,
  withEquipment,
  withPurchase,
} from './learners';
import type { Encounter } from './learning';

function request<T>(operation: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    operation.onsuccess = () => resolve(operation.result);
    operation.onerror = () => reject(operation.error);
  });
}
function completed(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () =>
      reject(tx.error ?? new Error('Learner save was interrupted.'));
    tx.onerror = () => reject(tx.error);
  });
}

export class IndexedDbLearners implements LearnerRepository {
  private connection?: Promise<IDBDatabase>;
  private open() {
    return (this.connection ??= new Promise<IDBDatabase>((resolve, reject) => {
      const opening = indexedDB.open('kidmidi-learners', 1);
      opening.onupgradeneeded = () => {
        const db = opening.result;
        db.createObjectStore('learners', { keyPath: 'id' });
        db.createObjectStore('settings');
        for (const name of ['encounters', 'purchases']) {
          db.createObjectStore(name, { keyPath: 'id' }).createIndex(
            'learnerId',
            'learnerId',
          );
        }
      };
      opening.onsuccess = () => {
        opening.result.onversionchange = () => {
          opening.result.close();
          this.connection = undefined;
        };
        resolve(opening.result);
      };
      opening.onerror = () => {
        this.connection = undefined;
        reject(opening.error);
      };
      opening.onblocked = () => {
        this.connection = undefined;
        reject(new Error('Close older Kidmidi tabs to open learners.'));
      };
    }));
  }
  async list() {
    const db = await this.open();
    return (
      (await request(
        db.transaction('learners').objectStore('learners').getAll(),
      )) as Learner[]
    ).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  }
  async selected() {
    const db = await this.open();
    return (
      ((await request(
        db.transaction('settings').objectStore('settings').get('selected'),
      )) as string) ?? null
    );
  }
  async select(id: string) {
    const db = await this.open();
    const tx = db.transaction(['learners', 'settings'], 'readwrite');
    const done = completed(tx);
    if (!(await request(tx.objectStore('learners').get(id)))) {
      await done;
      throw new Error('Learner not found.');
    }
    tx.objectStore('settings').put(id, 'selected');
    await done;
  }
  async create(learner: Learner) {
    learner = { ...learner, name: learnerName(learner.name) };
    const db = await this.open();
    const tx = db.transaction(['learners', 'settings'], 'readwrite');
    const done = completed(tx);
    tx.objectStore('learners').add(learner);
    tx.objectStore('settings').put(learner.id, 'selected');
    await done;
    return { learner, encounters: [], purchases: [] };
  }
  private async snapshot(
    tx: IDBTransaction,
    id: string,
  ): Promise<LearnerSnapshot> {
    const [learner, encounters, purchases] = await Promise.all([
      request(tx.objectStore('learners').get(id)),
      request(tx.objectStore('encounters').index('learnerId').getAll(id)),
      request(tx.objectStore('purchases').index('learnerId').getAll(id)),
    ]);
    if (!learner) throw new Error('Learner not found.');
    return {
      learner: learner as Learner,
      encounters: (encounters as Encounter[]).sort(
        (a, b) => a.startedAt - b.startedAt || a.id.localeCompare(b.id),
      ),
      purchases: purchases as Purchase[],
    };
  }
  async load(id: string) {
    const db = await this.open();
    return this.snapshot(
      db.transaction(['learners', 'encounters', 'purchases']),
      id,
    );
  }
  private async change(
    id: string,
    update: (snapshot: LearnerSnapshot) => LearnerSnapshot,
  ) {
    const db = await this.open();
    const tx = db.transaction(
      ['learners', 'encounters', 'purchases'],
      'readwrite',
    );
    const done = completed(tx);
    // Read and write inside one transaction: competing tabs cannot overspend.
    try {
      const before = await this.snapshot(tx, id);
      const after = update(before);
      tx.objectStore('learners').put(after.learner);
      const oldEncounters = new Set(before.encounters.map((event) => event.id));
      const oldPurchases = new Set(
        before.purchases.map((purchase) => purchase.id),
      );
      for (const event of after.encounters)
        if (!oldEncounters.has(event.id))
          tx.objectStore('encounters').add(event);
      for (const purchase of after.purchases)
        if (!oldPurchases.has(purchase.id))
          tx.objectStore('purchases').add(purchase);
      await done;
      return after;
    } catch (error) {
      try {
        tx.abort();
      } catch {
        /* Transaction may already have failed. */
      }
      await done.catch(() => {});
      throw error;
    }
  }
  async rename(id: string, name: string) {
    await this.change(id, (state) => ({
      ...state,
      learner: { ...state.learner, name: learnerName(name) },
    }));
  }
  record(event: Encounter) {
    return this.change(event.learnerId, (state) => withEncounter(state, event));
  }
  buy(id: string, item: string, purchaseId: string, at: number) {
    return this.change(id, (state) =>
      withPurchase(state, item, purchaseId, at),
    );
  }
  equip(
    id: string,
    slot: 'pet' | 'charm' | 'backdrop',
    item: string | null,
    remove = false,
  ) {
    return this.change(id, (state) => withEquipment(state, slot, item, remove));
  }
}
