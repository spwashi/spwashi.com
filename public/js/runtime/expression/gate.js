/**
 * Spw Interaction Gate
 *
 * Unlocks 'Premium Interaction Semantics' via a passcode-based hash check.
 * The passcode is typically found in blog posts related to hashing and weights.
 */

import { bus } from '/public/js/kernel/bus.js';
import { writeRuntimeDatasetValues } from '/public/js/kernel/dom-contracts.js';
import { guardCall } from '/public/js/kernel/dom-render.js';
import {
  readStorageFlag,
  runCriticalPath,
  STORAGE_KEYS,
  writeStorageFlag,
} from '/public/js/kernel/storage-utils.js';

const PASSCODE_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';

function unlock() {
  writeStorageFlag(STORAGE_KEYS.SEMANTICS_UNLOCKED, true);
  writeRuntimeDatasetValues(document.body, {
    spwSemantics: 'unlocked',
  }, {
    source: 'gate',
    reason: 'semantics-unlocked',
  });
  bus.emit('gate:unlocked', { status: 'manifest' });
}

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function initSpwGate() {
  if (readStorageFlag(STORAGE_KEYS.SEMANTICS_UNLOCKED)) {
    runCriticalPath('gate:restore', unlock, null);
  }

  window.spwUnlockSemantics = guardCall(async (passcode) => {
    const hash = await sha256(passcode);
    if (hash === PASSCODE_HASH) {
      unlock();
      console.log('@ [gate] semantics unlocked. welcome to boonhonk.');
      return true;
    }
    console.error('@ [gate] invalid weight descriptor.');
    return false;
  }, 'gate:unlock', { silent: true });
}