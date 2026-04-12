/**
 * spw-image-store.js
 *
 * IndexedDB image storage for profile cards and local tools.
 * localStorage is not suitable for images (5MB limit, string-only).
 * IndexedDB handles blobs natively and survives across sessions.
 *
 * Keys are stored in profile/seed JSON; blobs live here.
 * Store: 'images' in database 'spw-local-assets'
 */

const DB_NAME = 'spw-local-assets';
const DB_VERSION = 1;
const STORE_NAME = 'images';

let db = null;

function openDB() {
  if (db) return Promise.resolve(db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const idb = e.target.result;
      if (!idb.objectStoreNames.contains(STORE_NAME)) {
        idb.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror   = e => reject(e.target.error);
  });
}

/** Store a File or Blob under a key. Returns the key. */
export async function storeImage(key, file) {
  const idb = await openDB();
  const dataUrl = await fileToDataUrl(file);
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ key, dataUrl, type: file.type, savedAt: Date.now() });
    tx.oncomplete = () => resolve(key);
    tx.onerror    = e => reject(e.target.error);
  });
}

/** Retrieve a data URL by key. Returns null if not found. */
export async function getImageDataUrl(key) {
  if (!key) return null;
  const idb = await openDB();
  return new Promise((resolve, reject) => {
    const req = idb.transaction(STORE_NAME, 'readonly')
      .objectStore(STORE_NAME).get(key);
    req.onsuccess = e => resolve(e.target.result?.dataUrl || null);
    req.onerror   = e => reject(e.target.error);
  });
}

/** Delete an image by key. */
export async function deleteImage(key) {
  if (!key) return;
  const idb = await openDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror    = e => reject(e.target.error);
  });
}

/** List all stored image keys and metadata (no blobs). */
export async function listImages() {
  const idb = await openDB();
  return new Promise((resolve, reject) => {
    const items = [];
    const req = idb.transaction(STORE_NAME, 'readonly')
      .objectStore(STORE_NAME).openCursor();
    req.onsuccess = e => {
      const cursor = e.target.result;
      if (cursor) {
        items.push({ key: cursor.value.key, type: cursor.value.type, savedAt: cursor.value.savedAt });
        cursor.continue();
      } else {
        resolve(items);
      }
    };
    req.onerror = e => reject(e.target.error);
  });
}

/** Generate a stable key for a profile image */
export function profileImageKey(profileId = 'default') {
  return `profile-avatar:${profileId}`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = e => reject(e.target.error);
    reader.readAsDataURL(file);
  });
}
