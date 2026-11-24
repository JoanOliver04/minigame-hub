type Area = "local" | "session";

// Keep the current visit usable if storage is disabled or full.
const fallbacks = { local: new Map<string, string | null>(), session: new Map<string, string | null>() };
const changeEvent = "minihub-storage";

export function readValue(key: string, area: Area = "local"): string | null {
  if (typeof window === "undefined") return null;
  if (fallbacks[area].has(key)) return fallbacks[area].get(key) ?? null;
  try {
    return window[area === "local" ? "localStorage" : "sessionStorage"].getItem(key);
  } catch {
    return null;
  }
}

export function writeValue(key: string, value: string | null, area: Area = "local") {
  try {
    const storage = window[area === "local" ? "localStorage" : "sessionStorage"];
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
    fallbacks[area].delete(key);
  } catch {
    fallbacks[area].set(key, value);
  }
  window.dispatchEvent(new CustomEvent(changeEvent, { detail: key }));
}

export function subscribeStorage(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(changeEvent, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(changeEvent, listener);
  };
}

export function subscribeValue(key: string, listener: () => void) {
  const local = (event: Event) => { if ((event as CustomEvent<string>).detail === key) listener(); };
  const remote = (event: StorageEvent) => { if (event.key === key || event.key === null) listener(); };
  window.addEventListener(changeEvent, local);
  window.addEventListener("storage", remote);
  return () => {
    window.removeEventListener(changeEvent, local);
    window.removeEventListener("storage", remote);
  };
}
