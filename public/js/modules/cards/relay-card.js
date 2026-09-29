/**
 * modules/cards/relay-card.js
 *
 * A relay card turns a few choices into an easy first message: to back the
 * film's season promo, or to collaborate on lore.land. The reader picks, the
 * card and the message rewrite themselves, and the message leaves by email,
 * by clipboard for a DM, as a .spw.txt block, or as a screenshot.
 *
 * HTML carries everything a reader needs with JavaScript off: the choices,
 * a default message in the textarea, a mailto link with that message, and
 * the DM doors. This script only recomposes, copies, and keeps them in step.
 *
 * Nothing leaves the page on its own. The only text placed in a URL is the
 * message the reader can see and edit, and only in the mailto they open.
 *
 * Serialization: ^card[Film.Backing ref:YYYY]{ … }
 */
import { emitSpwAction } from '/public/js/kernel/shared.js';
import { bindSeedExits, copySeed, flashButton } from '/public/js/interface/seed-exits.js';

const HOST_SELECTOR = '[data-relay-card]';

function controlValue(control) {
  if (control instanceof HTMLInputElement && (control.type === 'radio' || control.type === 'checkbox')) {
    if (!control.checked) return '';
    return control.dataset.relayValue || control.value;
  }
  return String(control.value || '').trim();
}

function fill(template, value) {
  return template.includes('{}') ? template.replace('{}', value) : template;
}

export class RelayCard {
  constructor(host) {
    this.host = host;
    this.controls = [...host.querySelectorAll('[data-relay-line]')];
    this.message = host.querySelector('[data-relay-message]');
    this.mail = host.querySelector('[data-relay-mail]');
    this.preview = host.querySelector('[data-relay-preview]');
    this.edited = false;
    this.onInput = (event) => this.handleInput(event);
    this.onClick = (event) => this.handleClick(event);
    host.addEventListener('input', this.onInput);
    host.addEventListener('change', this.onInput);
    host.addEventListener('click', this.onClick);
    this.unbindExits = bindSeedExits(host, {
      seed: () => this.block(),
      filename: () => `${host.dataset.relayFile || 'relay-card'}-${new Date().getFullYear()}`,
      card: () => this.preview,
      actions: { copy: '[data-action="copy-block"]' },
      labels: { screenshotOn: '. done', screenshotOff: '* screenshot' },
    });
    // Script-only doors stay hidden until there is a script to open them.
    host.querySelectorAll('[data-action][hidden]').forEach((button) => { button.hidden = false; });
    const status = host.querySelector('[data-relay-status]');
    if (status) status.textContent = 'A DM door copies the message first, so it is ready to paste.';
    this.compose('init');
    host.dataset.relayCard = 'ready';
  }

  lines() {
    return this.controls.map((control) => {
      const value = controlValue(control);
      return value ? fill(control.dataset.relayLine, value) : '';
    }).filter(Boolean);
  }

  text() {
    const opening = this.host.dataset.relayOpening || '';
    const closing = this.host.dataset.relayClosing || '';
    return [opening, ...this.lines(), closing].filter(Boolean).join('\n');
  }

  block() {
    const year = new Date().getFullYear();
    const tag = this.host.dataset.relaySeed || 'Relay.Card';
    const body = (this.message?.value || this.text()).split('\n').map((line) => `  ${line}`).join('\n');
    return `^card[${tag} ref:${year}]{\n${body}\n}`;
  }

  compose(reason) {
    if (this.message && !this.edited) this.message.value = this.text();
    this.syncMail();
    this.syncPreview();
    const chosen = this.lines().length;
    this.host.dataset.relayState = chosen === 0 ? 'empty' : 'composed';
    if (reason === 'change') emitSpwAction('*relay.compose', `${this.host.dataset.relaySeed || 'relay'} · ${chosen} lines`);
  }

  syncMail() {
    if (!(this.mail instanceof HTMLAnchorElement)) return;
    const address = this.mail.dataset.relayAddress || '';
    const subject = this.host.dataset.relaySubject || '';
    const body = this.message?.value || this.text();
    this.mail.href = `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  /* Preview slots mirror the named choices so the card can be screenshotted. */
  syncPreview() {
    if (!this.preview) return;
    this.preview.querySelectorAll('[data-relay-slot]').forEach((slot) => {
      const name = slot.dataset.relaySlot;
      const picked = this.controls.find((control) => control.name === name && controlValue(control));
      const value = picked ? controlValue(picked) : '';
      slot.textContent = value || slot.dataset.relayEmpty || '—';
      slot.toggleAttribute('data-checked', Boolean(value));
    });
  }

  handleInput(event) {
    const target = event.target;
    if (target === this.message) {
      this.edited = this.message.value.trim() !== this.text().trim();
      this.syncMail();
      return;
    }
    if (target instanceof Element && target.closest('[data-relay-line]')) this.compose('change');
  }

  handleClick(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const reset = target.closest('[data-action="rewrite"]');
    if (reset) {
      event.preventDefault();
      this.edited = false;
      this.compose('change');
      flashButton(reset, '✓ rewritten');
      return;
    }
    const copy = target.closest('[data-action="copy-message"]');
    if (copy) {
      event.preventDefault();
      void copySeed(this.message?.value || this.text(), copy, { copied: '✓ message copied' });
      return;
    }
    // A DM door copies the message first, so it is ready to paste when the app opens.
    const door = target.closest('[data-relay-dm]');
    if (door instanceof HTMLElement) {
      void copySeed(this.message?.value || this.text(), null);
      const status = this.host.querySelector('[data-relay-status]');
      if (status) status.textContent = `Message copied. Paste it into a DM on ${door.dataset.relayDm}.`;
      emitSpwAction('~relay.dm', door.dataset.relayDm || 'dm');
    }
  }

  destroy() {
    this.host.removeEventListener('input', this.onInput);
    this.host.removeEventListener('change', this.onInput);
    this.host.removeEventListener('click', this.onClick);
    this.unbindExits?.();
    delete this.host.dataset.relayCard;
  }
}

const instances = new Map();

export function initRelayCards(ctx, root = document) {
  const scope = root instanceof Element || root instanceof Document ? root : document;
  scope.querySelectorAll(HOST_SELECTOR).forEach((host) => {
    if (instances.has(host)) return;
    instances.set(host, new RelayCard(host));
  });
  return () => unmountRelayCards();
}

export function unmountRelayCards() {
  instances.forEach((instance) => instance.destroy());
  instances.clear();
}

export { unmountRelayCards as unmount };
