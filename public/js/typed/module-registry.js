export function createRegistry() {
    const records = new Map();
    const pendingCleanups = new WeakMap();
    function cleanupAll(onLifecycle) {
        const pending = [];
        // A cleanup may register another instance. That replacement belongs to the
        // next lifetime and must not be visited or removed by this cleanup wave.
        for (const [id, record] of [...records]) {
            const existing = pendingCleanups.get(record);
            if (existing) {
                pending.push(existing);
                continue;
            }
            let complete;
            const disposal = new Promise((resolve) => { complete = resolve; });
            pendingCleanups.set(record, disposal);
            pending.push(disposal);
            const owned = typeof record.dispose === 'function';
            let finished = false;
            const notify = (stage) => {
                try {
                    if (!owned)
                        onLifecycle?.(record, stage);
                }
                catch (error) {
                    console.warn(`[module-registry] lifecycle callback failed for ${record.id}`, error);
                }
            };
            const finish = () => {
                if (finished)
                    return;
                finished = true;
                try {
                    notify('unmounted');
                }
                finally {
                    if (records.get(id) === record)
                        records.delete(id);
                    pendingCleanups.delete(record);
                    complete();
                }
            };
            const fail = (error) => {
                console.warn(`[module-registry] cleanup failed for ${record.id}`, error);
                finish();
            };
            try {
                notify('unmounting');
                const result = owned ? record.dispose() : record.cleanup?.();
                if (result != null && typeof result.then === 'function') {
                    void Promise.resolve(result).then(finish, fail);
                }
                else {
                    finish();
                }
            }
            catch (error) {
                fail(error);
            }
        }
        return Promise.allSettled(pending);
    }
    return {
        set(id, record) {
            records.set(id, record);
            return record;
        },
        get(id) {
            return records.get(id) ?? null;
        },
        has(id) {
            return records.has(id);
        },
        remove(id) {
            records.delete(id);
        },
        values() {
            return [...records.values()];
        },
        cleanupAll,
    };
}
