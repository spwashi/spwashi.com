const EDITABLE_SELECTOR = 'textarea, select, input:not([type="button"]):not([type="submit"]):not([type="reset"]), [contenteditable="true"]';
const PREFIX_TIMEOUT_MS = 1400;

export const RPG_SHORTCUT_SECTIONS = [
    { key: 'g then s', label: 'Scene lane' },
    { key: 'g then i', label: 'Initiative lane' },
    { key: 'g then c', label: 'Clock lane' },
    { key: 'g then a', label: 'Asset draft' },
    { key: 'g then n', label: 'Notes lane' },
    { key: 'g then b', label: 'Brief lane' }
];

export const RPG_SHORTCUT_ACTIONS = [
    { key: 'a', label: 'Add actor' },
    { key: 'c', label: 'Add clock' },
    { key: 't', label: 'Next turn' },
    { key: 'k', label: 'Focus asset draft' },
    { key: 'b', label: 'Copy brief' },
    { key: 'Esc', label: 'Cancel card edit' }
];

const isEditableTarget = (target) => (
    target instanceof Element && Boolean(target.closest(EDITABLE_SELECTOR))
);

const buildSequenceHint = (shortcutKeys) => `Jump to ${shortcutKeys.join(', ')}`;

export const createShortcutManager = ({
    scope = document,
    focusMap,
    actions,
    onStatus
}) => {
    const gotoShortcuts = {
        s: { label: 'scene lane', run: () => focusMap.scene?.() },
        i: { label: 'initiative lane', run: () => focusMap.initiative?.() },
        c: { label: 'clock lane', run: () => focusMap.clocks?.() },
        a: { label: 'asset draft', run: () => focusMap.assets?.() },
        n: { label: 'notes lane', run: () => focusMap.notes?.() },
        b: { label: 'brief lane', run: () => focusMap.brief?.() }
    };
    const actionShortcuts = {
        a: { label: 'add actor', run: () => actions.addActor?.() },
        c: { label: 'add clock', run: () => actions.addClock?.() },
        t: { label: 'next turn', run: () => actions.nextTurn?.() },
        k: { label: 'focus asset draft', run: () => focusMap.assets?.() },
        b: { label: 'copy brief', run: () => actions.copyBrief?.() }
    };

    let prefix = '';
    let prefixTimer = 0;

    const clearPrefix = () => {
        prefix = '';
        window.clearTimeout(prefixTimer);
        prefixTimer = 0;
    };

    const armPrefix = () => {
        clearPrefix();
        prefix = 'g';
        onStatus?.(buildSequenceHint(Object.keys(gotoShortcuts)));
        prefixTimer = window.setTimeout(() => {
            clearPrefix();
        }, PREFIX_TIMEOUT_MS);
    };

    const handleKeydown = (event) => {
        if (event.defaultPrevented) return;
        if (event.metaKey || event.ctrlKey || event.altKey) {
            clearPrefix();
            return;
        }
        if (isEditableTarget(event.target)) return;

        if (event.key === 'Escape') {
            clearPrefix();
            if (actions.cancelAssetEdit?.()) {
                event.preventDefault();
                onStatus?.('Canceled asset edit');
            }
            return;
        }

        const key = event.key.toLowerCase();

        if (prefix === 'g') {
            clearPrefix();
            const shortcut = gotoShortcuts[key];
            if (!shortcut) return;
            event.preventDefault();
            shortcut.run();
            onStatus?.(`Focused ${shortcut.label}`);
            return;
        }

        if (key === 'g') {
            event.preventDefault();
            armPrefix();
            return;
        }

        const shortcut = actionShortcuts[key];
        if (!shortcut) return;
        event.preventDefault();
        shortcut.run();
        onStatus?.(`Ran ${shortcut.label}`);
    };

    scope.addEventListener('keydown', handleKeydown);

    return {
        destroy: () => {
            clearPrefix();
            scope.removeEventListener('keydown', handleKeydown);
        }
    };
};
