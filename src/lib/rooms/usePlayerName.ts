"use client";

/**
 * Display name for the rooms feature, persisted in localStorage. Same
 * post-mount hydration pattern as ScoresContext/LocaleContext (default
 * empty string during SSR, load once on mount, persist after that) — but
 * scoped as a local hook rather than a global context, since only /rooms/*
 * screens need it.
 */

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "miniHubPlayerName_v1";

export function usePlayerName(): [string, (name: string) => void] {
  const [name, setName] = useState("");
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setName(raw);
    } catch {
      /* corrupt or blocked storage — start fresh */
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch {
      /* storage blocked — ignore */
    }
  }, [name]);

  return [name, setName];
}
