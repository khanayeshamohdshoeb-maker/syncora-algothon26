import {
  Task,
  PendingOperation,
  ConflictItem,
  SyncActivity,
  AppSettings,
} from '../types';

const DB_NAME = 'syncora_offline_db';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

// Default initial tasks for demo/first launch
export const INITIAL_DEMO_TASKS: Task[] = [
  {
    id: 'task-sec-101',
    title: 'Deploy End-to-End Cryptographic Handshake',
    description: 'Implement zero-knowledge salt rotation and AES-GCM transport layer for encrypted device outbox sync.',
    priority: 'urgent',
    completed: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    version: 1,
    syncState: 'SYNCED',
    tags: ['Security', 'Cryptography', 'Backend'],
    dueDate: '2026-10-10',
  },
  {
    id: 'task-pwa-102',
    title: 'Verify Offline Service Worker Cache Invalidation',
    description: 'Ensure cache-first strategy for app shell assets and stale-while-revalidate for static dictionaries.',
    priority: 'high',
    completed: true,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    version: 2,
    syncState: 'SYNCED',
    tags: ['PWA', 'Offline', 'Core'],
    dueDate: '2026-10-08',
  },
  {
    id: 'task-crdt-103',
    title: 'Benchmark Revision Tree Vector Merging',
    description: 'Stress-test multi-peer divergence resolution under high latency conditions and concurrent offline updates.',
    priority: 'medium',
    completed: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    version: 1,
    syncState: 'SYNCED',
    tags: ['Algorithm', 'SyncEngine'],
    dueDate: '2026-10-15',
  },
  {
    id: 'task-audit-104',
    title: 'Audit Local IndexedDB Quota Thresholds',
    description: 'Verify storage persistence requests and warning banners when exceeding 80% browser partition budget.',
    priority: 'low',
    completed: false,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    version: 1,
    syncState: 'SYNCED',
    tags: ['Storage', 'IndexedDB'],
    dueDate: '2026-10-20',
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  autoSync: true,
  syncIntervalSeconds: 10,
  conflictDefaultStrategy: 'prompt',
  soundFeedback: true,
  deviceId: 'node-syncora-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
  deviceName: 'Syncora Workstation (Alpha)',
};

/**
 * Open and initialize IndexedDB stores
 */
export async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Local Tasks Store
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('syncState', 'syncState', { unique: false });
        taskStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // 2. Pending Operations Outbox Store
      if (!db.objectStoreNames.contains('pending_operations')) {
        const outboxStore = db.createObjectStore('pending_operations', { keyPath: 'id' });
        outboxStore.createIndex('status', 'status', { unique: false });
        outboxStore.createIndex('timestamp', 'timestamp', { unique: false });
        outboxStore.createIndex('taskId', 'taskId', { unique: false });
      }

      // 3. Conflicts Store
      if (!db.objectStoreNames.contains('conflicts')) {
        const conflictStore = db.createObjectStore('conflicts', { keyPath: 'id' });
        conflictStore.createIndex('taskId', 'taskId', { unique: false });
        conflictStore.createIndex('status', 'status', { unique: false });
      }

      // 4. Sync Activities Store
      if (!db.objectStoreNames.contains('activities')) {
        const activityStore = db.createObjectStore('activities', { keyPath: 'id' });
        activityStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // 5. Remote Server Replica Store
      if (!db.objectStoreNames.contains('server_replica')) {
        db.createObjectStore('server_replica', { keyPath: 'id' });
      }

      // 6. Settings Store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Initialize data if database is empty
 */
export async function initializeDatabase(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['tasks', 'server_replica', 'settings'], 'readwrite');
  const taskStore = tx.objectStore('tasks');
  const serverStore = tx.objectStore('server_replica');
  const settingsStore = tx.objectStore('settings');

  return new Promise((resolve, reject) => {
    const countReq = taskStore.count();
    countReq.onsuccess = () => {
      if (countReq.result === 0) {
        // Seed default tasks both locally and to server replica
        for (const task of INITIAL_DEMO_TASKS) {
          taskStore.put(task);
          serverStore.put({ ...task });
        }
      }
    };

    const settingsReq = settingsStore.get('app_settings');
    settingsReq.onsuccess = () => {
      if (!settingsReq.result) {
        settingsStore.put({ key: 'app_settings', ...DEFAULT_SETTINGS });
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* =========================================================================
   TASK STORE OPERATIONS
   ========================================================================= */

export async function getAllTasks(): Promise<Task[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readonly');
    const store = tx.objectStore('tasks');
    const req = store.getAll();
    req.onsuccess = () => {
      // Filter out permanently deleted tombstones from UI view
      const tasks = (req.result as Task[]).filter((t) => !t.isDeleted);
      resolve(tasks);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getTaskById(id: string): Promise<Task | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readonly');
    const store = tx.objectStore('tasks');
    const req = store.get(id);
    req.onsuccess = () => resolve((req.result as Task) || null);
    req.onerror = () => reject(req.error);
  });
}

export async function putTask(task: Task): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    const req = store.put(task);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteTaskPermanently(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/* =========================================================================
   PENDING OPERATIONS OUTBOX
   ========================================================================= */

export async function getPendingOperations(): Promise<PendingOperation[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_operations', 'readonly');
    const store = tx.objectStore('pending_operations');
    const req = store.getAll();
    req.onsuccess = () => {
      const items = req.result as PendingOperation[];
      // Sort oldest to newest (FIFO)
      items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function putPendingOperation(op: PendingOperation): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_operations', 'readwrite');
    const store = tx.objectStore('pending_operations');
    const req = store.put(op);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deletePendingOperation(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_operations', 'readwrite');
    const store = tx.objectStore('pending_operations');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllPendingOperations(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_operations', 'readwrite');
    const store = tx.objectStore('pending_operations');
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/* =========================================================================
   CONFLICTS STORE
   ========================================================================= */

export async function getAllConflicts(): Promise<ConflictItem[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('conflicts', 'readonly');
    const store = tx.objectStore('conflicts');
    const req = store.getAll();
    req.onsuccess = () => {
      const conflicts = (req.result as ConflictItem[]).filter((c) => c.status === 'UNRESOLVED');
      resolve(conflicts);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function putConflict(conflict: ConflictItem): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('conflicts', 'readwrite');
    const store = tx.objectStore('conflicts');
    const req = store.put(conflict);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function resolveConflict(conflictId: string, strategy: 'KEEP_LOCAL' | 'KEEP_SERVER' | 'MERGE'): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['conflicts'], 'readwrite');
    const store = tx.objectStore('conflicts');
    const req = store.get(conflictId);
    req.onsuccess = () => {
      const item = req.result as ConflictItem | undefined;
      if (item) {
        item.status = 'RESOLVED';
        item.resolvedAt = new Date().toISOString();
        item.resolutionStrategy = strategy;
        store.put(item);
      }
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteConflict(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('conflicts', 'readwrite');
    const store = tx.objectStore('conflicts');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/* =========================================================================
   SYNC ACTIVITIES STORE
   ========================================================================= */

export async function getRecentActivities(limit: number = 50): Promise<SyncActivity[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('activities', 'readonly');
    const store = tx.objectStore('activities');
    const req = store.getAll();
    req.onsuccess = () => {
      const list = req.result as SyncActivity[];
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      resolve(list.slice(0, limit));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function logActivity(activity: Omit<SyncActivity, 'id' | 'timestamp'>): Promise<SyncActivity> {
  const entry: SyncActivity = {
    ...activity,
    id: 'act-' + Math.random().toString(36).substring(2, 10),
    timestamp: new Date().toISOString(),
  };

  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('activities', 'readwrite');
    const store = tx.objectStore('activities');
    const req = store.put(entry);
    req.onsuccess = () => resolve(entry);
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllActivities(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('activities', 'readwrite');
    const store = tx.objectStore('activities');
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/* =========================================================================
   SERVER REPLICA (Remote persistence simulator)
   ========================================================================= */

export async function getServerTasks(): Promise<Task[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('server_replica', 'readonly');
    const store = tx.objectStore('server_replica');
    const req = store.getAll();
    req.onsuccess = () => {
      const tasks = (req.result as Task[]).filter((t) => !t.isDeleted);
      resolve(tasks);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getServerTaskById(id: string): Promise<Task | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('server_replica', 'readonly');
    const store = tx.objectStore('server_replica');
    const req = store.get(id);
    req.onsuccess = () => resolve((req.result as Task) || null);
    req.onerror = () => reject(req.error);
  });
}

export async function putServerTask(task: Task): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('server_replica', 'readwrite');
    const store = tx.objectStore('server_replica');
    const req = store.put(task);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteServerTask(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('server_replica', 'readwrite');
    const store = tx.objectStore('server_replica');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/* =========================================================================
   SETTINGS STORE
   ========================================================================= */

export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const req = store.get('app_settings');
    req.onsuccess = () => {
      if (req.result) {
        const { key: _k, ...rest } = req.result;
        resolve(rest as AppSettings);
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    const req = store.put({ key: 'app_settings', ...updated });
    req.onsuccess = () => resolve(updated);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Reset database to pristine demo state
 */
export async function resetDatabaseToDefault(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['tasks', 'pending_operations', 'conflicts', 'activities', 'server_replica'], 'readwrite');
  tx.objectStore('tasks').clear();
  tx.objectStore('pending_operations').clear();
  tx.objectStore('conflicts').clear();
  tx.objectStore('activities').clear();
  tx.objectStore('server_replica').clear();

  for (const task of INITIAL_DEMO_TASKS) {
    tx.objectStore('tasks').put(task);
    tx.objectStore('server_replica').put({ ...task });
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
