/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TFM } from './types.ts';

const DB_NAME = 'TFM_Evaluation_DB';
const STORE_NAME = 'file_handles';
const HANDLE_KEY = 'active_file_handle';

/**
 * Access IndexedDB to store and retrieve FileSystemFileHandle.
 * FileSystemFileHandle instances are serializable in public IndexedDB store
 * across page sessions so they can be loaded again after user confirmation.
 */
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveFileHandle(handle: FileSystemFileHandle): Promise<void> {
  try {
    const db = await openIDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(handle, HANDLE_KEY);
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error('Error guardant el file handle a IndexedDB:', err);
  }
}

export async function getStoredFileHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openIDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(HANDLE_KEY);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error llegint el file handle de IndexedDB:', err);
    return null;
  }
}

export async function clearStoredFileHandle(): Promise<void> {
  try {
    const db = await openIDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(HANDLE_KEY);
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error('Error eliminant el file handle de IndexedDB:', err);
  }
}

/**
 * Write a string of content into the given file handle.
 */
export async function writeFileContents(handle: FileSystemFileHandle, content: string): Promise<void> {
  // Verify permissions
  const options = { mode: 'readwrite' as const };
  if ((await (handle as any).queryPermission(options)) !== 'granted') {
    const requested = await (handle as any).requestPermission(options);
    if (requested !== 'granted') {
      throw new Error("No s'han concedit permisos d'escriptura per al fitxer.");
    }
  }
  
  const writable = await (handle as any).createWritable();
  await writable.write(content);
  await writable.close();
}

/**
 * Read text content from a file handle.
 */
export async function readFileContents(handle: FileSystemFileHandle): Promise<string> {
  const options = { mode: 'read' as const };
  if ((await (handle as any).queryPermission(options)) !== 'granted') {
    const requested = await (handle as any).requestPermission(options);
    if (requested !== 'granted') {
      throw new Error("No s'han concedit permisos de lectura per al fitxer.");
    }
  }
  const file = await handle.getFile();
  return await file.text();
}
