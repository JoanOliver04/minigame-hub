/**
 * Tiny WebAudio synth shared by every mini-game — no audio assets needed.
 * Client-only: the AudioContext is created lazily on first user interaction.
 */

import { readValue, subscribeValue, writeValue } from "./browserStorage";

export type SoundKind = "win" | "lose" | "error" | "blip";

let audioCtx: AudioContext | null = null;
let master: GainNode | null = null;
const soundKey = "miniHubSound";

export function setSoundEnabled(value: boolean) {
  writeValue(soundKey, value ? "on" : "off");
}

export function isSoundEnabled() {
  return readValue(soundKey) !== "off";
}

export function subscribeSound(listener: () => void) {
  return subscribeValue(soundKey, listener);
}

export function playSound(kind: SoundKind) {
  if (!isSoundEnabled()) return;
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
      master = audioCtx.createGain();
      master.connect(audioCtx.destination);
      subscribeSound(() => { if (master) master.gain.value = isSoundEnabled() ? 1 : 0; });
    }
    const now = audioCtx.currentTime;

    const beep = (freq: number, start: number, dur: number, vol: number) => {
      const osc = audioCtx!.createOscillator();
      const gain = audioCtx!.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(gain).connect(master!);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      osc.start(now + start);
      osc.stop(now + start + dur);
    };

    if (kind === "win") {
      // ascending arpeggio
      beep(523, 0.0, 0.15, 0.18);
      beep(659, 0.13, 0.15, 0.18);
      beep(784, 0.26, 0.3, 0.2);
    } else if (kind === "lose") {
      // descending
      beep(392, 0.0, 0.15, 0.16);
      beep(330, 0.13, 0.15, 0.16);
      beep(262, 0.26, 0.3, 0.18);
    } else if (kind === "error") {
      // low buzz
      beep(160, 0, 0.18, 0.15);
    } else {
      // neutral blip
      beep(420, 0, 0.09, 0.1);
    }
  } catch {
    /* audio unavailable — silently skip */
  }
}
