/** Scheduling strategies. The loader owns eligibility, instances, and mount batching. */
import { writeDatasetValue } from '../../kernel/dom-contracts.js';
import { setRegionState } from '../region-profiler.js';
import { annotateModuleDescribesTarget } from '../catalog/describes-contract.js';
import { normalizeRuntimeToken } from './policy.js';
import { onIdle, once } from '/public/js/kernel/browser-primitives.js';

export function createModuleScheduler({ mountWhen, regionStates, html, setPageState, pageStates, getRoots, shouldScheduleDefinition, mountDefinition, beginMountBatch, endMountBatch, annotateModuleTrigger }) {
  async function mountImmediateLayer(defs, ctx, options = {}) {
    const eligible = defs.filter((def) => shouldScheduleDefinition(def, ctx, mountWhen.IMMEDIATE));
    if (!eligible.length) return;

    const layerLabel = normalizeRuntimeToken(options.label || eligible[0]?.layer || 'layer') || 'layer';
    const startMark = `spw:immediate-layer:${layerLabel}:batch-start`;
    const endMark = `spw:immediate-layer:${layerLabel}:batch-end`;
    const measureName = `spw:immediate-layer:${layerLabel}:parallel`;

    performance.mark(startMark);
    beginMountBatch();
    try {
      const settingsDef = eligible.find((def) => def.id === 'site-settings');
      const parallelDefs = eligible.filter((def) => def.id !== 'site-settings');

      if (settingsDef) {
        await mountDefinition(settingsDef, ctx, null, 0);
        await yieldToEventLoop();
      }
      if (parallelDefs.length) {
        await Promise.all(parallelDefs.map((def) => mountDefinition(def, ctx, null, 0)));
      }
    } finally {
      endMountBatch(ctx);
    }

    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
    performance.measure('spw:immediate-layer-parallel', startMark, endMark);
  }

  /* Scroll can reveal dozens of visible-mount roots in one IntersectionObserver
     callback. Mounting them via Promise.all chains their synchronous init work
     through microtasks — one long main-thread task whose style/layout cost
     scales with the wave. Drain through a frame-budgeted queue instead so each
     slice yields back to the event loop (input, paint) before continuing. */
  const VISIBLE_MOUNT_SLICE_BUDGET_MS = 10;

  function yieldToNextFrame() {
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      // Headless / background: rAF and scheduler may stall; always arm a timeout.
      window.setTimeout(finish, 16);
      if (typeof window.scheduler?.postTask === 'function') {
        try {
          window.scheduler.postTask(finish, { priority: 'user-visible' });
          return;
        } catch {
          // fall through to rAF
        }
      }
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => window.setTimeout(finish, 0));
        return;
      }
    });
  }

  async function yieldToEventLoop() {
    if (typeof globalThis.scheduler?.yield === 'function') {
      try {
        await globalThis.scheduler.yield();
        return;
      } catch {
        // fall through to frame budget
      }
    }
    return yieldToNextFrame();
  }

  async function mountVisibleFeatures(defs, ctx) {
    const visibleDefs = defs.filter((def) => shouldScheduleDefinition(def, ctx, mountWhen.VISIBLE));
    if (!visibleDefs.length) return;

    const queue = [];
    const queuedSingleDefs = new Set();
    let draining = false;

    const drainQueue = async () => {
      if (draining) return;
      draining = true;
      performance.mark('spw:visible-layer:drain-start');
      beginMountBatch();
      try {
        while (queue.length) {
          const sliceStart = performance.now();
          while (queue.length && performance.now() - sliceStart < VISIBLE_MOUNT_SLICE_BUDGET_MS) {
            const task = queue.shift();
            await task();
          }
          if (queue.length) await yieldToNextFrame();
        }
      } finally {
        endMountBatch(ctx);
        draining = false;
        performance.mark('spw:visible-layer:drain-end');
        performance.measure('spw:visible-layer:drain', 'spw:visible-layer:drain-start', 'spw:visible-layer:drain-end');
        if (queue.length) void drainQueue();
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.filter((entry) => entry.isIntersecting);
        if (!intersecting.length) return;

        for (const entry of intersecting) {
          const el = entry.target;
          observer.unobserve(el);

          for (const def of visibleDefs) {
            if (!el.matches(def.selector)) continue;
            annotateModuleTrigger(el, def, ctx, mountWhen.VISIBLE, 'triggered');

            if (def.rootMode === 'single') {
              if (queuedSingleDefs.has(def.id) || ctx.registry.has(def.id)) continue;
              queuedSingleDefs.add(def.id);
              queue.push(() => mountDefinition(def, ctx, null, 0));
            } else {
              queue.push(() => mountDefinition(def, ctx, el));
            }
          }
        }

        void drainQueue();
      },
      {
        root: null,
        rootMargin: '120px 0px',
        threshold: 0.01,
      }
    );

    ctx.addObserver(observer);

    for (const def of visibleDefs) {
      const roots = getRoots(def);
      roots.forEach((el) => {
        if (el instanceof HTMLElement) {
          setRegionState(el, regionStates.QUEUED);
          annotateModuleTrigger(el, def, ctx, mountWhen.VISIBLE, 'queued');
        }
        observer.observe(el);
      });
    }
  }

  async function mountInteractionFeatures(defs, ctx) {
    const interactionDefs = defs.filter((def) => shouldScheduleDefinition(def, ctx, mountWhen.INTERACTION));
    if (!interactionDefs.length) return;

    const activate = once(async () => {
      beginMountBatch();
      try {
        await Promise.all(interactionDefs.map(async (def) => {
          const roots = getRoots(def);
          if (!roots.length || def.rootMode === 'single') {
            return mountDefinition(def, ctx, null, 0);
          }
          return Promise.all(roots.map((root, index) => {
            annotateModuleTrigger(root, def, ctx, mountWhen.INTERACTION, 'triggered');
            return mountDefinition(def, ctx, root, index);
          }));
        }));
      } finally {
        endMountBatch(ctx);
      }
    });

    const handler = () => {
      void activate();
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('pointerdown', handler, options);
      window.removeEventListener('keydown', handler, options);
      window.removeEventListener('touchstart', handler, options);
    };

    const options = { once: true, passive: true };
    for (const def of interactionDefs) {
      getRoots(def).forEach((root) => annotateModuleTrigger(root, def, ctx, mountWhen.INTERACTION, 'waiting'));
    }
    window.addEventListener('pointerdown', handler, options);
    window.addEventListener('keydown', handler, options);
    window.addEventListener('touchstart', handler, options);

    ctx.addCleanup(cleanup);
  }

  /**
   * What a module offers, derived from what it declares it writes.
   *
   * `updates:` already tags every attribute with a channel, so a module's worth
   * to a reader is computable rather than editorial: one that writes `residue`
   * leaves something a visit keeps, one that writes `measure` leaves a checkable
   * claim, and one that writes only `flourish` is complete decoration. Ranked so
   * the strongest claim a module can make is the one it advertises.
   */
  const OFFER_RANK = ['residue', 'measure', 'structural', 'inspect', 'temporal', 'flourish', 'diagnostic'];

  function describeModuleOffer(def) {
    const channels = new Set(
      (def.updates || [])
        .map((entry) => String(entry).split(':')[0])
        .filter(Boolean)
    );
    return OFFER_RANK.find((channel) => channels.has(channel)) || 'flourish';
  }

  /**
   * Invited mounting — a designed trigger, one root at a time.
   *
   * Scroll position is not a decision. A module mounted because a root drifted
   * into the viewport arrives unannounced, gives the reader no way to anticipate
   * it, and cannot be sought out on purpose; INTERACTION is better only in that
   * it waits, but it still fires every pending module on the first input
   * anywhere on the page.
   *
   * An invitation is per root and per module. The root advertises what it is
   * holding before the module exists, and the module arrives because this reader
   * chose this element. In the electrostatic reading that the rest of the site
   * uses, an uninvited module is stored potential and accepting is the discharge:
   * the invitation is the visible potential difference, and the reader closes the
   * circuit.
   *
   * The invitation itself is CSS, driven by attributes written here, so a page
   * with no JavaScript still shows nothing misleading — an invitation that cannot
   * be accepted is never drawn, because the attribute that draws it is written by
   * the runtime that would accept it.
   */
  async function mountInvitedFeatures(defs, ctx) {
    const invitedDefs = defs.filter((def) => shouldScheduleDefinition(def, ctx, mountWhen.INVITED));
    if (!invitedDefs.length) return;

    /** Accepting affects one root and one module, never the whole page. */
    const accept = async (el, def) => {
      if (el.dataset.spwModuleTriggerStatus === 'triggered') return;
      annotateModuleTrigger(el, def, ctx, mountWhen.INVITED, 'triggered');
      beginMountBatch();
      try {
        await (def.rootMode === 'single'
          ? mountDefinition(def, ctx, null, 0)
          : mountDefinition(def, ctx, el));
      } finally {
        endMountBatch(ctx);
      }
    };

    for (const def of invitedDefs) {
      const offer = describeModuleOffer(def);

      for (const el of getRoots(def)) {
        if (!(el instanceof HTMLElement)) continue;

        annotateModuleTrigger(el, def, ctx, mountWhen.INVITED, 'waiting');
        annotateModuleDescribesTarget(el, def.describes);
        // What the reader stands to gain, so the invitation can be drawn at a
        // strength that matches the offer rather than uniformly.
        writeDatasetValue(el, 'spwModuleOffer', offer);

        const onAccept = (event) => {
          // Keyboard acceptance is deliberate; a stray keydown is not an answer.
          if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
          void accept(el, def);
          detach();
        };

        const detach = () => {
          el.removeEventListener('pointerenter', onAccept);
          el.removeEventListener('focusin', onAccept);
          el.removeEventListener('keydown', onAccept);
        };

        el.addEventListener('pointerenter', onAccept, { passive: true });
        el.addEventListener('focusin', onAccept, { passive: true });
        el.addEventListener('keydown', onAccept);
        ctx.addCleanup(detach);
      }
    }
  }

  async function mountRegionLayer(defs, ctx) {
    const regionDefs = defs.filter((def) => shouldScheduleDefinition(def, ctx, mountWhen.REGION));
    if (!regionDefs.length || !ctx.regions.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.filter((entry) => entry.isIntersecting);
        if (!intersecting.length) return;

        void (async () => {
          beginMountBatch();
          try {
            await Promise.all(intersecting.map(async (entry) => {
              const el = entry.target;

              for (const def of regionDefs) {
                if (!el.matches(def.selector)) continue;
                await mountDefinition(def, ctx, el);
              }

              observer.unobserve(el);
            }));
          } finally {
            endMountBatch(ctx);
          }
        })();
      },
      {
        root: null,
        rootMargin: '160px 0px',
        threshold: 0.01,
      }
    );

    ctx.addObserver(observer);

    ctx.regions.forEach((region) => {
      setRegionState(region.el, regionStates.PRIMED);
      observer.observe(region.el);
    });
  }

  /** Stagger IDLE mounts so residue/ledger listeners exist before collectible flourishes. */
  const IDLE_CHUNK_ORDER = Object.freeze([
    'idle-residue',
    'idle-collectible',
    'idle-chrome',
    'idle-lab',
    'idle-default',
  ]);

  function inferIdleTimingChunk(def) {
    const explicit = normalizeRuntimeToken(def?.timingChunk || '');
    if (explicit && IDLE_CHUNK_ORDER.includes(explicit)) return explicit;

    const arc = normalizeRuntimeToken(def?.timingArc || '');
    if (/ledger|residue|memory|spell$/.test(arc) || arc === 'enhance-ledger' || arc === 'enhance-spell') {
      return 'idle-residue';
    }
    if (/collect|reward|discover|guide|haptic|cauldron/.test(arc) || /collect|reward|discover/.test(def?.id || '')) {
      return 'idle-collectible';
    }
    if (/navigator|shell|chrome|logo|nav/.test(arc) || /navigator|logo|shell/.test(def?.id || '')) {
      return 'idle-chrome';
    }
    if (/lab|debug|metacognition|topic|learning|palette/.test(arc) || /lab|debug|topic|palette|pronunciation|query/.test(def?.id || '')) {
      return 'idle-lab';
    }
    return 'idle-default';
  }

  function groupIdleDefsByChunk(idleDefs) {
    const groups = new Map(IDLE_CHUNK_ORDER.map((chunk) => [chunk, []]));
    idleDefs.forEach((def) => {
      const chunk = inferIdleTimingChunk(def);
      const bucket = groups.get(chunk) || groups.get('idle-default');
      bucket.push(def);
    });
    return IDLE_CHUNK_ORDER
      .map((chunk) => ({ chunk, defs: groups.get(chunk) || [] }))
      .filter((entry) => entry.defs.length);
  }

  async function mountIdleDefinitionBatch(idleDefs, ctx) {
    beginMountBatch();
    try {
      await Promise.all(idleDefs.map(async (def) => {
        const roots = getRoots(def);
        if (!roots.length || def.rootMode === 'single') {
          return mountDefinition(def, ctx, null, 0);
        }
        return Promise.all(roots.map((root, index) => {
          annotateModuleTrigger(root, def, ctx, mountWhen.IDLE, 'triggered');
          return mountDefinition(def, ctx, root, index);
        }));
      }));
    } finally {
      endMountBatch(ctx);
    }
  }

  function queueIdleEnhancements(defs, ctx) {
    const idleDefs = defs.filter((def) => shouldScheduleDefinition(def, ctx, mountWhen.IDLE));
    const hasSettled = defs.some((def) => shouldScheduleDefinition(def, ctx, mountWhen.SETTLED));

    const finalizeEnhancement = () => {
      setPageState(pageStates.ENHANCED);
      ctx.bus.emit('spw:page-enhanced', { route: ctx.route });
      queueSettledEnhancements(defs, ctx);
    };

    if (!idleDefs.length) {
      if (!hasSettled) return;
      const handle = onIdle(() => {
        finalizeEnhancement();
      });
      ctx.addTimer(handle);
      return;
    }

    const handle = onIdle(async () => {
      if (ctx.runtimePolicy.delay) {
        await new Promise((resolve) => {
          const timer = window.setTimeout(resolve, ctx.runtimePolicy.delay);
          ctx.addTimer(timer);
        });
      }

      const chunks = groupIdleDefsByChunk(idleDefs);
      writeDatasetValue(html, 'spwRuntimeIdleChunks', chunks.map((entry) => entry.chunk).join(' '));

      for (const [index, entry] of chunks.entries()) {
        writeDatasetValue(html, 'spwRuntimeIdleChunk', entry.chunk);
        performance.mark(`spw:idle-chunk:${entry.chunk}:start`);
        await mountIdleDefinitionBatch(entry.defs, ctx);
        performance.mark(`spw:idle-chunk:${entry.chunk}:end`);
        performance.measure(
          `spw:idle-chunk:${entry.chunk}`,
          `spw:idle-chunk:${entry.chunk}:start`,
          `spw:idle-chunk:${entry.chunk}:end`,
        );

        // Yield between chunks so residue listeners can attach before collectible flourishes fire.
        if (index < chunks.length - 1) {
          await new Promise((resolve) => {
            const yieldHandle = onIdle(() => resolve(), 180);
            ctx.addTimer(yieldHandle);
          });
        }
      }

      writeDatasetValue(html, 'spwRuntimeIdleChunk', null);
      finalizeEnhancement();
    });

    for (const def of idleDefs) {
      getRoots(def).forEach((root) => annotateModuleTrigger(root, def, ctx, mountWhen.IDLE, 'queued'));
    }

    ctx.addTimer(handle);
  }

  function queueSettledEnhancements(defs, ctx) {
    const settledDefs = defs.filter((def) => shouldScheduleDefinition(def, ctx, mountWhen.SETTLED));
    if (!settledDefs.length) return;

    const run = async () => {
      // Multi-barrier settle: wait for web fonts and double-rAF so spatial
      // measurements only execute once typography has fully rendered and settled.
      await new Promise((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          resolve();
        };
        const timeout = window.setTimeout(finish, 320);
        ctx.addTimer?.(timeout);

        const raf = globalThis.requestAnimationFrame
          ? globalThis.requestAnimationFrame.bind(globalThis)
          : (cb) => window.setTimeout(cb, 16);

        const fontsReady = typeof document !== 'undefined' && document.fonts?.ready
          ? document.fonts.ready.catch(() => {})
          : Promise.resolve();

        fontsReady.then(() => {
          raf(() => {
            raf(finish);
          });
        });
      });

      performance.mark('spw:settled-layer:start');
      beginMountBatch();
      try {
        await Promise.all(settledDefs.map((def) => mountDefinition(def, ctx, null, 0)));
      } finally {
        endMountBatch(ctx);
      }
      performance.mark('spw:settled-layer:end');
      try {
        performance.measure('spw:settled-layer', 'spw:settled-layer:start', 'spw:settled-layer:end');
      } catch {
        // measure requires both marks; ignore if navigation cleared them
      }

      ctx.bus.emit('spw:layout-assumptions-ready', { route: ctx.route });
    };

    void run();
  }

  return { mountImmediateLayer, mountVisibleFeatures, mountInteractionFeatures, mountInvitedFeatures, mountRegionLayer, queueIdleEnhancements, queueSettledEnhancements };
}
