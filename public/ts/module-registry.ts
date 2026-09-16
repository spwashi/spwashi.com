/** Generic instance ownership; no DOM, catalog, or bootstrap dependency. */
export type RegistryRecord = {
  id: string;
  cleanup?: (() => unknown) | null;
  /** Loader-owned disposal includes lifecycle events and joined async teardown. */
  dispose?: () => unknown;
};

export type RegistryLifecycle = 'unmounting' | 'unmounted';

export function createRegistry<RecordType extends RegistryRecord = RegistryRecord>() {
  const records = new Map<string, RecordType>();
  const pendingCleanups = new WeakMap<RecordType, Promise<void>>();

  function cleanupAll(onLifecycle?: (record: RecordType, stage: RegistryLifecycle) => void) {
    const pending: Promise<void>[] = [];
    // A cleanup may register another instance. That replacement belongs to the
    // next lifetime and must not be visited or removed by this cleanup wave.
    for (const [id, record] of [...records]) {
      const existing = pendingCleanups.get(record);
      if (existing) {
        pending.push(existing);
        continue;
      }
      let complete!: () => void;
      const disposal = new Promise<void>((resolve) => { complete = resolve; });
      pendingCleanups.set(record, disposal);
      pending.push(disposal);
      const owned = typeof record.dispose === 'function';
      let finished = false;
      const notify = (stage: RegistryLifecycle) => {
        try {
          if (!owned) onLifecycle?.(record, stage);
        } catch (error) {
          console.warn(`[module-registry] lifecycle callback failed for ${record.id}`, error);
        }
      };
      const finish = () => {
        if (finished) return;
        finished = true;
        try {
          notify('unmounted');
        } finally {
          if (records.get(id) === record) records.delete(id);
          pendingCleanups.delete(record);
          complete();
        }
      };
      const fail = (error: unknown) => {
        console.warn(`[module-registry] cleanup failed for ${record.id}`, error);
        finish();
      };
      try {
        notify('unmounting');
        const result = owned ? record.dispose!() : record.cleanup?.();
        if (result != null && typeof (result as PromiseLike<unknown>).then === 'function') {
          void Promise.resolve(result).then(finish, fail);
        } else {
          finish();
        }
      } catch (error) {
        fail(error);
      }
    }
    return Promise.allSettled(pending);
  }

  return {
    set(id: string, record: RecordType): RecordType {
      records.set(id, record);
      return record;
    },
    get(id: string): RecordType | null {
      return records.get(id) ?? null;
    },
    has(id: string): boolean {
      return records.has(id);
    },
    remove(id: string): void {
      records.delete(id);
    },
    values(): RecordType[] {
      return [...records.values()];
    },
    cleanupAll,
  };
}

export type ModuleRegistry<RecordType extends RegistryRecord = RegistryRecord> = ReturnType<typeof createRegistry<RecordType>>;
