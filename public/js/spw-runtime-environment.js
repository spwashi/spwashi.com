const LOCAL_DEV_GLOBAL = '__SPW_LOCAL_DEV__';

const LOCAL_DEV_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
]);

function readWindowFlag() {
  try {
    return window[LOCAL_DEV_GLOBAL] === true;
  } catch {
    return false;
  }
}

function readDatasetFlag() {
  try {
    return document.documentElement.dataset.spwDevServer === 'true';
  } catch {
    return false;
  }
}

function readHostname() {
  try {
    return String(window.location.hostname || '').toLowerCase();
  } catch {
    return '';
  }
}

function isLocalDevelopmentHost() {
  const hostname = readHostname();
  return LOCAL_DEV_HOSTS.has(hostname) || hostname.endsWith('.localhost');
}

function isLocalDevelopmentRuntime() {
  return readWindowFlag() || readDatasetFlag() || isLocalDevelopmentHost();
}

function shouldDisableServiceWorkerInDevelopment() {
  return isLocalDevelopmentRuntime();
}

export {
  isLocalDevelopmentHost,
  isLocalDevelopmentRuntime,
  shouldDisableServiceWorkerInDevelopment,
};
