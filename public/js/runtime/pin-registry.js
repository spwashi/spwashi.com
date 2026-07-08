import { readJson, removeJson, writeJson, STORAGE_KEYS } from '/public/js/kernel/storage-utils.js';

const PIN_STORAGE_KEY = STORAGE_KEYS.PIN_REGISTRY;

export function getPinStorageKey() {
  return PIN_STORAGE_KEY;
}

export function readPins() {
  return readJson(PIN_STORAGE_KEY, {}, { requireObject: true });
}

export function writePins(pins) {
  return writeJson(PIN_STORAGE_KEY, pins);
}

export function clearPins() {
  return removeJson(PIN_STORAGE_KEY);
}

export function buildPinRecord(meta = {}, page = window.location.pathname) {
  return {
    page,
    id: meta.id,
    timestamp: Date.now(),
    title: document.title,
    wonder: meta.wonder,
    operator: meta.operator,
    context: meta.context,
  };
}

export function pinRecordKey(page = window.location.pathname, id = '') {
  return `${page}#${id}`;
}