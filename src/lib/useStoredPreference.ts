"use client";

import { useCallback, useEffect, useState } from "react";

/** Load browser preferences before allowing the initial value to be saved. */
export function useStoredPreference<T extends string>(
  key: string,
  initialValue: T,
  parse: (stored: string | null) => T | null,
) {
  const [preference, setPreference] = useState({ value: initialValue, ready: false });

  useEffect(() => {
    let value = initialValue;
    try {
      value = parse(localStorage.getItem(key)) ?? initialValue;
    } catch {
      // The UI continues to work when browser storage is disabled.
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read client storage after hydration
    setPreference((current) => current.ready ? current : { value, ready: true });
  }, [key, initialValue, parse]);

  useEffect(() => {
    if (!preference.ready) return;
    try {
      localStorage.setItem(key, preference.value);
    } catch {
      // The preference remains available for the current visit.
    }
  }, [key, preference]);

  const setValue = useCallback((value: T) => setPreference({ value, ready: true }), []);
  return [preference.value, setValue] as const;
}
