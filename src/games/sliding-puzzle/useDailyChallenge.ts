"use client";

import { useSyncExternalStore } from "react";
import { readValue, subscribeStorage, writeValue } from "@/lib/browserStorage";
import { updateBrowserRecord, useBrowserRecord } from "@/lib/browserRecords";
import { betterResult, localDay, readBest, readDailyRun, type DailyBest, type DailyRun } from "./daily";

const runKey = "miniHubDailyRun_v1";
const bestKey = (day: string) => "miniHubDailyBest_v1:" + day;
const emptySnapshot = () => null;

function subscribeDay(listener: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  function schedule() {
    clearTimeout(timer);
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    timer = setTimeout(refresh, midnight.getTime() - now.getTime());
  }
  function refresh() { listener(); schedule(); }
  schedule();
  window.addEventListener("pageshow", refresh);
  document.addEventListener("visibilitychange", refresh);
  return () => {
    clearTimeout(timer);
    window.removeEventListener("pageshow", refresh);
    document.removeEventListener("visibilitychange", refresh);
  };
}

export function useLocalDay() {
  return useSyncExternalStore(subscribeDay, () => localDay(new Date()), emptySnapshot);
}

export function useDailyStatus(day: string | null) {
  const best = useBrowserRecord(day ? bestKey(day) : null);
  const run = useSyncExternalStore(subscribeStorage, () => day ? readValue(runKey, "session") : null, emptySnapshot);
  return { best: readBest(best), run: day ? readDailyRun(run, day) : null };
}

export function saveDailyRun(run: DailyRun | null) {
  writeValue(runKey, run ? JSON.stringify(run) : null, "session");
}

export function loadDailyRun(day: string) {
  return readDailyRun(readValue(runKey, "session"), day);
}

export function saveDailyBest(day: string, result: DailyBest) {
  void updateBrowserRecord(bestKey(day), (raw) => JSON.stringify(betterResult(readBest(raw), result)));
}
