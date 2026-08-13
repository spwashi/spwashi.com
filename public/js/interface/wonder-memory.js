import {
    getActiveRecentPathMemory,
    getRecentPathSignalStrength,
    getWonderMemoryMode,
    getWonderMemoryStrength,
    inferAnchorTokens,
    inferWonderFromOperation,
    normalizeAccentToken,
    parseAccentList,
    resolveAccentTokenColors,
    tokensFromHref,
    uniqueAccentValues
} from './accent-palette.js';
import { describeCognitiveState } from '/public/js/runtime/cognitive-state.js';

const MEMORY_TARGET_SELECTOR = [
    '.topic-photo-card',
    '.page-index a',
    '.operator-chip',
    '.frame-sigil',
    '.spec-pill',
    '.intent-cluster',
    '.context-edge-card',
    '.math-lens-card'
].join(', ');

const SITEWIDE_ONLY_SELECTOR = '.intent-cluster, .context-edge-card, .math-lens-card';
const RESONANT_BLOCK_SELECTOR = '.topic-photo-card, .intent-cluster, .context-edge-card, .math-lens-card';
const LIMINALITY_CHARGE = Object.freeze({
    entry: 0.05,
    threshold: 0.1,
    settled: 0.12,
    nested: 0.16,
    projected: 0.22,
    deep: 0.28,
});
const FAMILIARITY_GROUND = Object.freeze({
    fresh: 0,
    familiar: 0.04,
    practiced: 0.08,
    fluent: 0.12,
    habitual: 0.16,
});

// Display-facing readout, not the field model's own bias(b) = tanh(β·F(b)).
// `strength` is expected to already carry both the σ₀ settings multiplier
// and the applyWonderMemoryState() temporal decay term — this function only
// folds in the categorical liminality/familiarity terms on top.
function computeWonderFieldBalance({
    strength = 0,
    signalCount = 0,
    liminality = 'settled',
    familiarity = 'fresh',
} = {}) {
    const strengthNorm = Math.min(1, Math.max(0, Number(strength) / 2));
    const signalBoost = Math.min(0.18, Math.max(0, Number(signalCount) || 0) * 0.02);
    const liminalityCharge = LIMINALITY_CHARGE[liminality] ?? 0.1;
    const familiarityGround = FAMILIARITY_GROUND[familiarity] ?? 0.05;
    const balance = 0.38 + strengthNorm * 0.34 + signalBoost + liminalityCharge - familiarityGround * 0.5;
    return Math.min(0.88, Math.max(0.22, balance)).toFixed(4);
}

export function computeLocomotionFieldBalance(progress = 0) {
    const normalized = Math.min(1, Math.max(0, Number(progress) || 0));
    return (0.42 + normalized * 0.28).toFixed(4);
}

function readTargetMemorySnapshot(target) {
    return {
        wonderState: target.getAttribute('data-spw-wonder-state') || '',
        fieldWonder: target.getAttribute('data-spw-field-wonder') || '',
        memoryMatch: target.getAttribute('data-spw-memory-match') || ''
    };
}

function writeTargetMemorySnapshot(target, snapshot) {
    if (snapshot.wonderState) target.dataset.spwWonderState = snapshot.wonderState;
    else delete target.dataset.spwWonderState;

    if (snapshot.fieldWonder) target.dataset.spwFieldWonder = snapshot.fieldWonder;
    else delete target.dataset.spwFieldWonder;

    if (snapshot.memoryMatch) target.dataset.spwMemoryMatch = snapshot.memoryMatch;
    else delete target.dataset.spwMemoryMatch;
}

function setMemoryState(target, state, wonder) {
    target.dataset.spwWonderState = state;
    target.dataset.spwFieldWonder = wonder;
}

function getRuntimeAccentColors() {
    const rootStyles = getComputedStyle(document.documentElement);

    return {
        teal: rootStyles.getPropertyValue('--teal').trim() || 'hsl(180 100% 28%)',
        amber: rootStyles.getPropertyValue('--op-object-color').trim() || 'hsl(36 80% 36%)',
        rust: rootStyles.getPropertyValue('--op-pragma-color').trim() || 'hsl(0 40% 38%)',
        violet: rootStyles.getPropertyValue('--op-probe-color').trim() || 'hsl(268 55% 42%)',
        sea: rootStyles.getPropertyValue('--op-topic-color').trim() || 'hsl(192 62% 32%)',
        blue: rootStyles.getPropertyValue('--op-ref-color').trim() || 'hsl(214 70% 38%)',
        ink: rootStyles.getPropertyValue('--ink').trim() || 'hsl(188 14% 18%)',
    };
}

function clearTargetState(target) {
    if (target.dataset.spwWonderMemoryManaged !== 'true') return;

    writeTargetMemorySnapshot(target, {
        wonderState: target.dataset.spwWonderMemoryPrevWonderState || '',
        fieldWonder: target.dataset.spwWonderMemoryPrevFieldWonder || '',
        memoryMatch: target.dataset.spwWonderMemoryPrevMemoryMatch || ''
    });

    delete target.dataset.spwWonderMemoryManaged;
    delete target.dataset.spwWonderMemoryPrevWonderState;
    delete target.dataset.spwWonderMemoryPrevFieldWonder;
    delete target.dataset.spwWonderMemoryPrevMemoryMatch;
    target.style.removeProperty('--wonder-accent-color');
    target.style.removeProperty('--delight-color');
}

function snapshotTargetState(target) {
    if (target.dataset.spwWonderMemoryManaged === 'true') return;

    target.dataset.spwWonderMemoryManaged = 'true';
    const snapshot = readTargetMemorySnapshot(target);
    target.dataset.spwWonderMemoryPrevWonderState = snapshot.wonderState;
    target.dataset.spwWonderMemoryPrevFieldWonder = snapshot.fieldWonder;
    target.dataset.spwWonderMemoryPrevMemoryMatch = snapshot.memoryMatch;
}

function getManualMemoryTokens(target) {
    const localHost = target.closest?.('[data-spw-memory-anchor], [data-spw-accent-anchor], [data-spw-context], [data-spw-surface]') || null;
    const manual = [
        target.dataset.spwMemoryAnchor || '',
        target.dataset.spwAccentAnchor || '',
        localHost?.dataset?.spwMemoryAnchor || '',
        localHost?.dataset?.spwAccentAnchor || ''
    ]
        .flatMap((value) => parseAccentList(value).map(normalizeAccentToken));

    return uniqueAccentValues(manual);
}

function inferTargetTokens(target) {
    const hrefTokens = target.matches('a[href]')
        ? tokensFromHref(target.getAttribute('href') || '')
        : [];

    const localHost = target.closest?.('[data-spw-memory-anchor], [data-spw-accent-anchor], [data-spw-context], [data-spw-surface]') || null;
    const contextualTokens = localHost && localHost !== target
        ? inferAnchorTokens(localHost)
        : [];

    return uniqueAccentValues([
        ...getManualMemoryTokens(target),
        ...hrefTokens,
        ...inferAnchorTokens(target),
        ...contextualTokens,
        normalizeAccentToken(target.textContent || '')
    ]);
}

function clearRootState(root) {
    delete root.dataset.spwWonderMemoryState;
    delete root.dataset.spwWonderMemoryWonder;
    delete root.dataset.spwWonderMemoryFamiliarity;
    delete root.dataset.spwWonderMemoryLiminality;
    delete root.dataset.spwWonderMemoryGradient;
    delete root.dataset.spwWonderMemorySignals;
    delete root.dataset.spwWonderMemoryMeaningMode;
    root.style.removeProperty('--wonder-accent-color');
    root.style.removeProperty('--delight-color');
    root.style.removeProperty('--spw-wonder-memory-color');
    root.style.removeProperty('--spw-wonder-memory-alt-color');
    root.style.removeProperty('--field-balance');
}

function collectTargets(root = document) {
    if (root instanceof Element) {
        return [
            ...(root.matches?.(MEMORY_TARGET_SELECTOR) ? [root] : []),
            ...root.querySelectorAll(MEMORY_TARGET_SELECTOR)
        ];
    }

    return [...root.querySelectorAll(MEMORY_TARGET_SELECTOR)];
}

export function clearWonderMemoryState(root = document) {
    const host = root === document ? document.documentElement : root;
    clearRootState(host);
    collectTargets(root).forEach(clearTargetState);
}

export function applyWonderMemoryState(root = document) {
    const mode = getWonderMemoryMode();
    const recent = getActiveRecentPathMemory();
    const strength = getWonderMemoryStrength();
    const host = root === document ? document.documentElement : root;
    const targets = collectTargets(root);

    targets.forEach(clearTargetState);

    if (!recent || !strength) {
        clearRootState(host);
        return;
    }

    // σ(Δt) = σ₀ · exp(−Δt/τ) — `strength` above is σ₀ (the settings-tunable
    // base); this folds in how much this specific interaction has decayed
    // since it happened, so --field-balance fades continuously rather than
    // holding at full strength until a hard TTL cutoff.
    const decayedStrength = strength * getRecentPathSignalStrength(recent);

    const colors = resolveAccentTokenColors(
        [...recent.tokens, recent.operator],
        getRuntimeAccentColors()
    );
    const primary = colors[0] || 'hsl(180 100% 28%)';
    const secondary = colors[1] || colors[0] || 'hsl(36 80% 36%)';
    const wonder = recent.wonder || inferWonderFromOperation(recent.operator, recent.tokens);
    const activeTokens = new Set(
        uniqueAccentValues([...recent.tokens, recent.operator].map(normalizeAccentToken))
    );
    const cognitiveState = describeCognitiveState({
        signalCount: recent.tokens.length,
        recentPath: recent,
        currentPath: window.location.pathname,
        currentSurface: document.body?.dataset?.spwSurface || '',
        pageArrival: document.documentElement.dataset.spwPageArrival || '',
        pageTransitionPhase: document.documentElement.dataset.spwPageTransitionPhase || '',
        pageLiminality: document.body?.dataset?.spwLiminality || '',
    });

    host.dataset.spwWonderMemoryState = 'active';
    host.dataset.spwWonderMemoryWonder = wonder;
    host.dataset.spwWonderMemoryFamiliarity = cognitiveState.familiarity;
    host.dataset.spwWonderMemoryLiminality = cognitiveState.liminality;
    host.dataset.spwWonderMemoryGradient = cognitiveState.gradient;
    host.dataset.spwWonderMemorySignals = String(recent.tokens.length);
    host.dataset.spwWonderMemoryMeaningMode = document.documentElement.dataset.spwMeaningMode || 'readable';
    host.style.setProperty('--wonder-accent-color', primary);
    host.style.setProperty('--delight-color', secondary);
    host.style.setProperty('--spw-wonder-memory-color', primary);
    host.style.setProperty('--spw-wonder-memory-alt-color', secondary);
    host.style.setProperty('--field-balance', computeWonderFieldBalance({
        strength: decayedStrength,
        signalCount: recent.tokens.length,
        liminality: cognitiveState.liminality,
        familiarity: cognitiveState.familiarity,
    }));

    targets.forEach((target) => {
        if (mode !== 'sitewide' && target.matches(SITEWIDE_ONLY_SELECTOR)) {
            return;
        }

        const matches = inferTargetTokens(target).filter((token) => activeTokens.has(token));
        if (!matches.length) return;

        snapshotTargetState(target);
        setMemoryState(target, target.matches(RESONANT_BLOCK_SELECTOR) ? 'resonant' : 'accented', wonder);
        target.dataset.spwMemoryMatch = matches.join(' ');
        target.style.setProperty('--wonder-accent-color', primary);
        target.style.setProperty('--delight-color', secondary);
    });
}
