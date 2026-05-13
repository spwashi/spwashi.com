const LOCAL_DEV_GLOBAL = '__SPW_LOCAL_DEV__';

const LOCAL_DEV_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
]);

function readWindowFlag(): boolean {
  try {
    return (window as unknown as Record<string, unknown>)[LOCAL_DEV_GLOBAL] === true;
  } catch {
    return false;
  }
}

function readDatasetFlag(): boolean {
  try {
    return document.documentElement.dataset.spwDevServer === 'true';
  } catch {
    return false;
  }
}

function readHostname(): string {
  try {
    return String(window.location.hostname || '').toLowerCase();
  } catch {
    return '';
  }
}

function isLocalDevelopmentHost(): boolean {
  const hostname = readHostname();
  return LOCAL_DEV_HOSTS.has(hostname) || hostname.endsWith('.localhost');
}

function isLocalDevelopmentRuntime(): boolean {
  return readWindowFlag() || readDatasetFlag() || isLocalDevelopmentHost();
}

function shouldDisableServiceWorkerInDevelopment(): boolean {
  return isLocalDevelopmentRuntime();
}

export {
  isLocalDevelopmentHost,
  isLocalDevelopmentRuntime,
  shouldDisableServiceWorkerInDevelopment,
};
