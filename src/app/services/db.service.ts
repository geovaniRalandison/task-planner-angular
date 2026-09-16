import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DbService {
  private db: IDBDatabase | null = null;
  private openPromise: Promise<void> | null = null;

  constructor() {
    this.openPromise = this.openDatabase();
  }

  private async openDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TaskPlannerDB', 1);

      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', event);
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data');
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }
    await this.openPromise;
    if (!this.db) {
      throw new Error('Database not opened');
    }
    return this.db;
  }

  async getItem<T>(key: string): Promise<T | null> {
    const db = await this.ensureDB();
    return new Promise((resolve) => {
      const transaction = db.transaction('data', 'readonly');
      const store = transaction.objectStore('data');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result as T | null);
      request.onerror = () => resolve(null);
    });
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('data', 'readwrite');
      const store = transaction.objectStore('data');
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to set item'));
    });
  }

  async removeItem(key: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('data', 'readwrite');
      const store = transaction.objectStore('data');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to remove item'));
    });
  }

  async getLocalStorageItem<T>(key: string): Promise<T | null> {
    return this.getItem<T>(key);
  }

  async setLocalStorageItem<T>(key: string, value: T): Promise<void> {
    return this.setItem<T>(key, value);
  }

  async removeLocalStorageItem(key: string): Promise<void> {
    return this.removeItem(key);
  }
}