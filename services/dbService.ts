import { DailyLog, UserProfile, WeightLog } from "../types";
import { DEFAULT_PROFILE } from "../constants";

const DB_NAME = 'NutriMindDB';
const DB_VERSION = 1;

// Helper to open DB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('logs')) {
        db.createObjectStore('logs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('weight_logs')) {
        db.createObjectStore('weight_logs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', { keyPath: 'id' });
      }
    };
  });
};

export const dbService = {
  // --- Log Operations ---

  getAllLogs: async (): Promise<DailyLog[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('logs', 'readonly');
      const store = transaction.objectStore('logs');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  addLog: async (log: DailyLog): Promise<DailyLog[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('logs', 'readwrite');
      const store = transaction.objectStore('logs');
      store.put(log);

      transaction.oncomplete = async () => {
        // Return updated list for easy state management
        const allLogs = await dbService.getAllLogs();
        resolve(allLogs);
      };
      transaction.onerror = () => reject(transaction.error);
    });
  },

  deleteLog: async (id: string): Promise<DailyLog[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('logs', 'readwrite');
      const store = transaction.objectStore('logs');
      store.delete(id);

      transaction.oncomplete = async () => {
        const allLogs = await dbService.getAllLogs();
        resolve(allLogs);
      };
      transaction.onerror = () => reject(transaction.error);
    });
  },

  getLogsByDate: async (dateStr: string): Promise<DailyLog[]> => {
    const logs = await dbService.getAllLogs();
    return logs.filter(l => l.date === dateStr);
  },

  // --- Weight Operations ---

  getWeightLogs: async (): Promise<WeightLog[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('weight_logs', 'readonly');
      const store = transaction.objectStore('weight_logs');
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result || [];
        // Sort by date
        result.sort((a: WeightLog, b: WeightLog) => new Date(a.date).getTime() - new Date(b.date).getTime());
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  },

  addWeightLog: async (log: WeightLog): Promise<WeightLog[]> => {
    const db = await openDB();
    // Check for existing entry on same date manually (or could use index)
    const currentLogs = await dbService.getWeightLogs();
    const existing = currentLogs.find(l => l.date === log.date);
    
    // Reuse ID if exists to overwrite
    const logToSave = existing ? { ...log, id: existing.id } : log;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('weight_logs', 'readwrite');
      const store = transaction.objectStore('weight_logs');
      store.put(logToSave);

      transaction.oncomplete = async () => {
        const updated = await dbService.getWeightLogs();
        resolve(updated);
      };
      transaction.onerror = () => reject(transaction.error);
    });
  },

  deleteWeightLog: async (id: string): Promise<WeightLog[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('weight_logs', 'readwrite');
      const store = transaction.objectStore('weight_logs');
      store.delete(id);

      transaction.oncomplete = async () => {
        const updated = await dbService.getWeightLogs();
        resolve(updated);
      };
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // --- Profile Operations ---

  getProfile: async (): Promise<UserProfile> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('profile', 'readonly');
      const store = transaction.objectStore('profile');
      const request = store.get('user_main'); // Single user key

      request.onsuccess = () => resolve(request.result || DEFAULT_PROFILE);
      request.onerror = () => resolve(DEFAULT_PROFILE); // Fallback
    });
  },

  updateProfile: async (profile: UserProfile): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('profile', 'readwrite');
      const store = transaction.objectStore('profile');
      // Ensure we store it with the fixed key so we can retrieve it easily
      store.put({ ...profile, id: 'user_main' });
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
};