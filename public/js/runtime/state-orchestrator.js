/* ==========================================================================
   state-orchestrator.js
   --------------------------------------------------------------------------
   Core runtime for managing Genetic CSS states and relational interactions.
   Exposes high-level state primitives (Resonance, Charge, Drift) to the DOM.
   ========================================================================== */

const STATE_ATTR = 'data-state';
const ATTENTION_ATTR = 'data-spw-attention';

/**
 * Registry of active observers and their state-matching rules.
 */
const orchestrator = {
  observers: new Set(),
  
  /**
   * Broadcasts a state change to the environment.
   * @param {Element} el - Target element.
   * @param {string} state - State token to toggle/set.
   * @param {boolean} active - Presence of state.
   */
  setState(el, state, active = true) {
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
  },

  /**
   * Batch update multiple states.
   */
  setStates(el, stateMap) {
    Object.entries(stateMap).forEach(([s, a]) => this.setState(el, s, a));
  },

  /**
   * Pulse a state (add temporarily then remove).
   */
  pulse(el, state, duration = 600) {
    this.setState(el, state, true);
    setTimeout(() => this.setState(el, state, false), duration);
  },

  /**
   * Manages relational "Attention" scaling.
   * Sets focus on an element and dims neighbors.
   */
  focus(el, scope = 'main') {
    const parent = el.closest(scope) || document.body;
    const siblings = parent.querySelectorAll(`.site-frame, [data-spw-kind="surface"]`);
    
    siblings.forEach(s => {
      if (s === el) {
        s.setAttribute(ATTENTION_ATTR, 'focused');
        this.setState(s, 'active', true);
      } else {
        s.setAttribute(ATTENTION_ATTR, 'dimmed');
        this.setState(s, 'active', false);
      }
    });
  }
};

/**
 * Global click handler for grounded interactive elements.
 * Automatically handles focus transitions and arrival pulses.
 */
function bindGlobalInteractions() {
  document.addEventListener('click', (e) => {
    const frame = e.target.closest('.site-frame');
    if (frame && !frame.matches('[data-state~="active"]')) {
      orchestrator.focus(frame);
      orchestrator.pulse(frame, 'arrival', 420);
    }
  }, { capture: true });
}

export { orchestrator, bindGlobalInteractions };
