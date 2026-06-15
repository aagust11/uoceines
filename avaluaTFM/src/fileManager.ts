/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TFM } from './types.ts';

const DB_NAME = 'TFM_Evaluation_DB';
const STORE_NAME = 'file_handles';
const HANDLE_KEY = 'active_file_handle';
const DIR_HANDLE_KEY = 'active_directory_handle';
const PDF_STORE_NAME = 'pdf_blobs';

/**
 * Access IndexedDB to store and retrieve FileSystemFileHandle/DirectoryHandles.
 */
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2); // Upgraded to v2 for pdf_blobs
    request.onupgradeneeded = (e) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(PDF_STORE_NAME)) {
        db.createObjectStore(PDF_STORE_NAME);
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

// Directory handle methods
export async function saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await openIDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(handle, DIR_HANDLE_KEY);
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error('Error guardant el directory handle a IndexedDB:', err);
  }
}

export async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openIDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(DIR_HANDLE_KEY);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error llegint el directory handle de IndexedDB:', err);
    return null;
  }
}

export async function clearStoredDirectoryHandle(): Promise<void> {
  try {
    const db = await openIDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(DIR_HANDLE_KEY);
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error('Error eliminant el directory handle de IndexedDB:', err);
  }
}

// PDF Blob management
export async function saveLocalPdf(tfmId: string, blob: Blob): Promise<void> {
  try {
    const db = await openIDB();
    const transaction = db.transaction(PDF_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(PDF_STORE_NAME);
    store.put(blob, tfmId);
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error('Error guardant el PDF a IndexedDB:', err);
  }
}

export async function getLocalPdf(tfmId: string): Promise<Blob | null> {
  try {
    const db = await openIDB();
    const transaction = db.transaction(PDF_STORE_NAME, 'readonly');
    const store = transaction.objectStore(PDF_STORE_NAME);
    const request = store.get(tfmId);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error llegint el PDF de IndexedDB:', err);
    return null;
  }
}

export async function deleteLocalPdf(tfmId: string): Promise<void> {
  try {
    const db = await openIDB();
    const transaction = db.transaction(PDF_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(PDF_STORE_NAME);
    store.delete(tfmId);
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error('Error eliminant el PDF de IndexedDB:', err);
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
