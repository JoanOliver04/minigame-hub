"use client";

import { useCallback, useSyncExternalStore } from "react";
import { readValue, subscribeValue, writeValue } from "./browserStorage";

type LocalRecord = { revision: number; value: string; applied?: string[] };
const cache = new Map<string, LocalRecord>();
const temporary = new Set<string>();
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
export function readBrowserRecord(key: string) { return cache.get(key)?.value ?? readValue(key); }
export function isTemporaryRecord(key: string) { return temporary.has(key); }

export function subscribeBrowserRecord(key: string, notify: () => void) {
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
}

export function useBrowserRecord(key: string | null) {
  const subscribe = useCallback((notify: () => void) => key === null ? () => {} : subscribeBrowserRecord(key, notify), [key]);
  return useSyncExternalStore(subscribe, () => key === null ? null : readBrowserRecord(key), empty);
}

/** Keep the read and update in the same transaction, including the first import of a legacy value. */
export async function updateBrowserRecord(key: string, update: (value: string | null) => string | undefined, pendingKey?: string) {
  let next: LocalRecord | undefined;
  let appliedChange = false;
  let committed = false;
  function apply(current: LocalRecord | undefined, raw: string | null) {
    appliedChange = false;
    if (pendingKey && (readValue(pendingKey) === null || current?.applied?.includes(pendingKey))) return current;
    const value = update(raw);
    if (value === undefined) return current;
    appliedChange = true;
    const revision = (current?.revision ?? 0) + 1;
    if (!pendingKey) return { revision, value };
    // A second tab may replay an interrupted write before its receipt is removed.
    const applied = (current?.applied ?? []).filter(id => readValue(id) !== null);
    return { revision, value, applied: [...applied, pendingKey] };
  }
  try {
    const db = await database();
    await new Promise<void>((resolve, reject) => {
      const txn = db.transaction(storeName, "readwrite");
      const store = txn.objectStore(storeName);
      const previous = store.get(key);
      previous.onsuccess = () => {
        remember(key, previous.result);
        const current = cache.get(key);
        next = apply(current, current?.value ?? readValue(key));
        if (next && next !== current) store.put(next, key);
      };
      txn.oncomplete = () => { committed = true; resolve(); };
      txn.onabort = () => reject(txn.error);
    });
  } catch {
    // Private and storage-restricted contexts still support results within the visit.
    const current = cache.get(key);
    next = apply(current, readValue(key) ?? current?.value ?? null);
  }
  if (next) {
    remember(key, next);
    // Retain the existing format for older versions and signal subscribers in other tabs.
    const mirrored = writeValue(key, cache.get(key)!.value);
    if (committed || mirrored) temporary.delete(key);
    else temporary.add(key);
  }
  if (pendingKey) writeValue(pendingKey, null);
  return appliedChange;
}
