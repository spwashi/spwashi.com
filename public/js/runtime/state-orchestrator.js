/* ==========================================================================
   frame-state.js
   --------------------------------------------------------------------------
   Shared runtime for frame state toggles and relational focus behavior.
   The helpers are exported individually so console scripts and extensions can
   call the smallest useful primitive instead of always routing through a
   mutable object wrapper.
   ========================================================================== */

const STATE_ATTR = 'data-state';
const ATTENTION_ATTR = 'data-spw-attention';

export function setState(el, state, active = true) {
  if (!el) return;
  const current = el.getAttribute(STATE_ATTR) || '';
  const states = new Set(current.split(' ').filter(Boolean));

  if (active) {
    states.add(state);
  } else {
    states.delete(state);
  }

  const next = Array.from(states).join(' ');
  if (next) {
    el.setAttribute(STATE_ATTR, next);
  } else {
    el.removeAttribute(STATE_ATTR);
  }
}

export function setStates(el, stateMap = {}) {
  Object.entries(stateMap).forEach(([state, active]) => setState(el, state, active));
}

export function pulseState(el, state, duration = 600) {
  setState(el, state, true);
  setTimeout(() => setState(el, state, false), duration);
}

export function focusFrame(el, scope = 'main') {
  if (!el) return;
  const parent = el.closest(scope) || document.body;
  const siblings = parent.querySelectorAll('.spw-frame, [data-spw-kind="frame"], [data-spw-kind="surface"]');

  siblings.forEach((sibling) => {
    if (sibling === el) {
      sibling.setAttribute(ATTENTION_ATTR, 'focused');
      setState(sibling, 'active', true);
    } else {
      sibling.setAttribute(ATTENTION_ATTR, 'dimmed');
      setState(sibling, 'active', false);
    }
  });
}

export const orchestrator = Object.freeze({
  observers: new Set(),
  setState,
  setStates,
  pulse: pulseState,
  focus: focusFrame,
});

export function bindGlobalInteractions() {
  document.addEventListener('click', (event) => {
    const frame = event.target.closest('.spw-frame, [data-spw-kind="frame"]');
    if (frame && !frame.matches('[data-state~="active"]')) {
      focusFrame(frame);
      pulseState(frame, 'arrival', 420);
    }
  }, { capture: true });
}
