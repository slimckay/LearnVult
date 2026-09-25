const DB_NAME = "learnvult-offline";
const STORE = "resources";
const QUEUE = "uploadQueue";
const PROGRESS = "progress";
const VERSION = 3;

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(QUEUE)) db.createObjectStore(QUEUE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(PROGRESS)) db.createObjectStore(PROGRESS, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function withStore(store, mode, work) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const result = work(tx.objectStore(store));
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
      })
  );
}

export async function saveOfflineResource(resource, blob) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({
      ...resource,
      blob,
      savedAt: new Date().toISOString(),
    });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineResource(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).get(Number(id) || id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function listOfflineResources() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProgress(id, page) {
  await withStore(PROGRESS, "readwrite", (store) =>
    store.put({ id: Number(id) || id, page: Number(page) || 1, updatedAt: new Date().toISOString() })
  );
}

export async function getProgress(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(PROGRESS, "readonly").objectStore(PROGRESS).get(Number(id) || id);
    request.onsuccess = () => resolve(request.result || { page: 1 });
    request.onerror = () => reject(request.error);
  });
}

export async function queueUpload(item) {
  const record = {
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
    ...item,
  };
  await withStore(QUEUE, "readwrite", (store) => store.put(record));
  return record;
}

export async function listQueuedUploads() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(QUEUE, "readonly").objectStore(QUEUE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function removeQueuedUpload(id) {
  await withStore(QUEUE, "readwrite", (store) => store.delete(id));
}

export function openBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "resource";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
