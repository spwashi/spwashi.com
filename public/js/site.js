(() => {
    const onReady = () => {
        const frames = Array.from(document.querySelectorAll('.site-frame'));

        const activateFrame = (frame) => {
            if (!frame) return;
            frames.forEach((item) => item.classList.toggle('is-active-frame', item === frame));
        };

        const resolveTargetFrame = (selector) => {
            if (!selector || !selector.startsWith('#')) return null;
            const target = document.querySelector(selector);
            if (!target) return null;
            if (target.classList.contains('site-frame')) return target;
            return target.closest('.site-frame');
        };

        const activateFromHash = () => {
            const hashTarget = resolveTargetFrame(window.location.hash);
            if (hashTarget) {
                activateFrame(hashTarget);
                return true;
            }
            return false;
        };

        const interactiveAnchors = Array.from(
            document.querySelectorAll('.frame-sigil[href^="#"], .operator-chip[href^="#"]')
        );

        interactiveAnchors.forEach((anchor) => {
            anchor.addEventListener('click', () => {
                const targetFrame = resolveTargetFrame(anchor.getAttribute('href'));
                if (targetFrame) activateFrame(targetFrame);
            });
        });

        const frameSensitiveNodes = Array.from(
            document.querySelectorAll('.frame-card, .frame-panel, .mode-panel, .site-figure, .syntax-token, .frame-list a')
        );

        frameSensitiveNodes.forEach((node) => {
            const frame = node.closest('.site-frame');
            if (!frame) return;
            node.addEventListener('mouseenter', () => activateFrame(frame));
            node.addEventListener('focusin', () => activateFrame(frame));
        });

        const groupedNodes = Array.from(document.querySelectorAll('[data-mode-group]'));
        const groupNames = Array.from(
            new Set(groupedNodes.map((node) => node.dataset.modeGroup).filter(Boolean))
        );

        const setGroupMode = (groupName, modeValue) => {
            const buttons = Array.from(
                document.querySelectorAll(`[data-mode-group="${groupName}"][data-set-mode]`)
            );
            const panels = Array.from(
                document.querySelectorAll(`[data-mode-group="${groupName}"][data-mode-panel]`)
            );

            buttons.forEach((button) => {
                const active = button.dataset.setMode === modeValue;
                button.classList.toggle('is-selected', active);
                button.setAttribute('aria-pressed', active ? 'true' : 'false');
                if (button.closest('.mode-switch')) {
                    button.setAttribute('tabindex', active ? '0' : '-1');
                }
            });

            panels.forEach((panel) => {
                const active = panel.dataset.modePanel === modeValue;
                panel.hidden = !active;
                panel.classList.toggle('is-active-panel', active);
            });

            const activePanel = panels.find((panel) => panel.dataset.modePanel === modeValue);
            const frame = activePanel?.closest('.site-frame')
                || buttons.find((button) => button.dataset.setMode === modeValue)?.closest('.site-frame');
            if (frame) activateFrame(frame);
        };

        groupNames.forEach((groupName) => {
            const buttons = Array.from(
                document.querySelectorAll(`[data-mode-group="${groupName}"][data-set-mode]`)
            );
            const initialMode = buttons.find((button) => button.getAttribute('aria-pressed') === 'true')?.dataset.setMode
                || buttons[0]?.dataset.setMode;

            buttons.forEach((button) => {
                button.addEventListener('click', () => setGroupMode(groupName, button.dataset.setMode));

                const switchRoot = button.closest('.mode-switch');
                if (!switchRoot) return;

                button.addEventListener('keydown', (event) => {
                    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
                    event.preventDefault();

                    const switchButtons = buttons.filter((candidate) => candidate.closest('.mode-switch') === switchRoot);
                    const currentIndex = switchButtons.indexOf(button);

                    if (event.key === 'Home') {
                        setGroupMode(groupName, switchButtons[0].dataset.setMode);
                        switchButtons[0].focus();
                        return;
                    }

                    if (event.key === 'End') {
                        const last = switchButtons[switchButtons.length - 1];
                        setGroupMode(groupName, last.dataset.setMode);
                        last.focus();
                        return;
                    }

                    const direction = event.key === 'ArrowRight' ? 1 : -1;
                    const nextIndex = (currentIndex + direction + switchButtons.length) % switchButtons.length;
                    const nextButton = switchButtons[nextIndex];
                    setGroupMode(groupName, nextButton.dataset.setMode);
                    nextButton.focus();
                });
            });

            if (initialMode) setGroupMode(groupName, initialMode);
        });

        if (!activateFromHash() && frames[0]) {
            activateFrame(frames[0]);
        }

        window.addEventListener('hashchange', activateFromHash);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
    } else {
        onReady();
    }
})();
