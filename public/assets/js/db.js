
const DB_NAME = 'proyecto_web_pwa';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('queue')) {
        const store = db.createObjectStore('queue', { keyPath: 'uuid' });
        store.createIndex('by_synced', 'synced', { unique: false });
        store.createIndex('by_created', 'created_at', { unique: false });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(storeName, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(storeName, mode);
    const store = t.objectStore(storeName);
    let result;
    Promise.resolve(fn(store)).then((r) => { result = r; }).catch(reject);
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
  });
}

export const DB = {
  async putMeta(key, value) {
    return tx('meta', 'readwrite', (s) => s.put({ key, value }));
  },
  async getMeta(key) {
    return tx('meta', 'readonly', (s) => new Promise((res) => {
      const r = s.get(key);
      r.onsuccess = () => res(r.result ? r.result.value : null);
      r.onerror = () => res(null);
    }));
  },
  async enqueue(item) {
    item.synced = 0; // 0 = pendiente, 1 = sincronizado
    item.created_at = item.created_at || Date.now();
    return tx('queue', 'readwrite', (s) => s.put(item));
  },
  async pending(limit = 250) {
    return tx('queue', 'readonly', (s) => new Promise((res) => {
      const idx = s.index('by_synced');
      const out = [];
      const cursorReq = idx.openCursor(IDBKeyRange.only(0));
      cursorReq.onsuccess = () => {
        const cur = cursorReq.result;
        if (!cur || out.length >= limit) return res(out);
        out.push(cur.value);
        cur.continue();
      };
      cursorReq.onerror = () => res(out);
    }));
  },
  async markSynced(uuids) {
    if (!uuids || !uuids.length) return 0;
    return tx('queue', 'readwrite', (s) => new Promise((res) => {
      let done = 0;
      uuids.forEach((u) => {
        const r = s.get(u);
        r.onsuccess = () => {
          const v = r.result;
          if (v) { v.synced = 1; s.put(v); }
          done++;
          if (done === uuids.length) res(done);
        };
        r.onerror = () => { done++; if (done === uuids.length) res(done); };
      });
    }));
  },
  async countPending() {
    return tx('queue', 'readonly', (s) => new Promise((res) => {
      const idx = s.index('by_synced');
      const req = idx.count(IDBKeyRange.only(0));
      req.onsuccess = () => res(req.result || 0);
      req.onerror = () => res(0);
    }));
  },
  async cleanupSynced(olderThanMs = 1000 * 60 * 60 * 24 * 7) {
    const cutoff = Date.now() - olderThanMs;
    return tx('queue', 'readwrite', (s) => new Promise((res) => {
      let deleted = 0;
      const cursorReq = s.openCursor();
      cursorReq.onsuccess = () => {
        const cur = cursorReq.result;
        if (!cur) return res(deleted);
        const v = cur.value;
        if (v.synced === 1 && (v.created_at || 0) < cutoff) {
          s.delete(cur.key);
          deleted++;
        }
        cur.continue();
      };
      cursorReq.onerror = () => res(deleted);
    }));
  }
};
