const PIN_STORAGE_KEY = 'spw-pins';

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function getPinStorageKey() {
  return PIN_STORAGE_KEY;
}

export function readPins() {
  return safeParse(localStorage.getItem(PIN_STORAGE_KEY), {});
}

export function writePins(pins) {
  localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(pins));
}

export function clearPins() {
  localStorage.removeItem(PIN_STORAGE_KEY);
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
