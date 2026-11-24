"use client";

import { useCallback, useSyncExternalStore } from "react";
import { readValue, subscribeValue, writeValue } from "./browserStorage";

type LocalRecord = { revision: number; value: string };
const cache = new Map<string, LocalRecord>();
const storeName = "records";
let connection: Promise<IDBDatabase> | undefined;

function database() {
  if (!connection) {
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open("miniHubRecords", 1);
      open.onupgradeneeded = () => open.result.createObjectStore(storeName);
      open.onsuccess = () => {
        const db = open.result;
        db.onversionchange = () => { db.close(); connection = undefined; };
        resolve(db);
      };
      open.onerror = () => reject(open.error);
    });
  }
  return connection;
}

function remember(key: string, record: LocalRecord | undefined) {
  if (record && record.revision >= (cache.get(key)?.revision ?? 0)) cache.set(key, record);
}

const empty = () => null;
export function useBrowserRecord(key: string | null) {
  const subscribe = useCallback((notify: () => void) => {
    if (key === null) return () => {};
    let active = true;
    const refresh = async () => {
      notify();
      try {
        const db = await database();
        if (!active) return;
        const request = db.transaction(storeName).objectStore(storeName).get(key);
        request.onsuccess = () => {
          if (!active) return;
          remember(key, request.result);
          notify();
        };
      } catch {
        if (active) {
          // Let storage events update the fallback snapshot across tabs as well.
          cache.delete(key);
          notify();
        }
      }
    };
    const unsubscribe = subscribeValue(key, refresh);
    void refresh();
    return () => { active = false; unsubscribe(); };
  }, [key]);
  return useSyncExternalStore(subscribe, () => key === null ? null : cache.get(key)?.value ?? readValue(key), empty);
}

/** Keep the read and update in the same transaction, including the first import of a legacy value. */
export async function updateBrowserRecord(key: string, update: (value: string | null) => string) {
  let next: LocalRecord | undefined;
  try {
    const db = await database();
    await new Promise<void>((resolve, reject) => {
      const txn = db.transaction(storeName, "readwrite");
      const store = txn.objectStore(storeName);
      const previous = store.get(key);
      previous.onsuccess = () => {
        remember(key, previous.result);
        const current = cache.get(key);
        next = { revision: (current?.revision ?? 0) + 1, value: update(current?.value ?? readValue(key)) };
        store.put(next, key);
      };
      txn.oncomplete = () => resolve();
      txn.onabort = () => reject(txn.error);
    });
  } catch {
    // Private and storage-restricted contexts still support results within the visit.
    const current = cache.get(key);
    next = { revision: (current?.revision ?? 0) + 1, value: update(readValue(key) ?? current?.value ?? null) };
  }
  if (next) {
    remember(key, next);
    // Retain the existing format for older versions and signal subscribers in other tabs.
    writeValue(key, cache.get(key)!.value);
  }
}
