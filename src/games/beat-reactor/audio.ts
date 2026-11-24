import { isSoundEnabled, subscribeSound } from "@/lib/sound";
import { CHART_LEAD_IN } from "./generation";
import type { Bpm, Judgement } from "./types";

const laneFrequencies = [220, 277.18, 329.63, 392];
const bassRoots = [110, 87.31, 130.81, 98];

/** A song-relative clock. Silent play and devices without Web Audio use the monotonic clock. */
export class ReactorAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private audioOrigin: number | null = null;
  private wallOrigin = 0;
  private offset = 0;
  private running = false;
  private beatSeconds = 0;
  private nextBeat = 0;
  private unsubscribe: (() => void) | null = null;

  start(bpm: Bpm, muted: boolean, from = 0) {
    this.dispose();
    this.offset = from;
    this.wallOrigin = performance.now();
    this.running = true;
    this.beatSeconds = 60 / bpm;
    this.nextBeat = Math.ceil((from - CHART_LEAD_IN) / this.beatSeconds);
    if (muted) return;
    try {
      const ctx = new AudioContext();
      this.ctx = ctx;
      this.master = ctx.createGain();
      const updateGain = () => { if (this.master) this.master.gain.value = isSoundEnabled() ? 0.2 : 0; };
      updateGain();
      this.unsubscribe = subscribeSound(updateGain);
      this.master.connect(ctx.destination);
      if (ctx.state === "running") this.audioOrigin = ctx.currentTime;
      else void ctx.resume().catch(() => {});
    } catch {
      // The chart and its controls remain available with visual cues.
    }
  }

  get currentTime(): number {
    if (!this.running) return this.offset;
    const elapsed = (performance.now() - this.wallOrigin) / 1000;
    if (this.ctx?.state !== "running") {
      this.audioOrigin = null;
      return this.offset + elapsed;
    }
    this.audioOrigin ??= this.ctx.currentTime - elapsed;
    return this.offset + this.ctx.currentTime - this.audioOrigin;
  }

  private tone(type: OscillatorType, hz: number, volume: number, duration: number, at: number, endHz = hz) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const envelope = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(hz, at);
    osc.frequency.exponentialRampToValueAtTime(endHz, at + duration);
    envelope.gain.setValueAtTime(0.001, at);
    envelope.gain.exponentialRampToValueAtTime(volume, at + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.001, at + duration);
    osc.connect(envelope).connect(this.master);
    osc.onended = () => { osc.disconnect(); envelope.disconnect(); };
    osc.start(at);
    osc.stop(at + duration);
  }

  /** Schedule on the audio clock just ahead of the display frame; skip beats missed during a stall. */
  backing(now: number, end: number) {
    if (this.ctx?.state !== "running") return;
    this.nextBeat = Math.max(this.nextBeat, Math.ceil((now - 0.025 - CHART_LEAD_IN) / this.beatSeconds));
    for (;;) {
      const beat = this.nextBeat;
      const time = CHART_LEAD_IN + beat * this.beatSeconds;
      if (time > Math.min(now + 0.14, end)) return;
      const at = this.ctx.currentTime + Math.max(0, time - now);
      if (beat < 0) this.tone("triangle", 660, 0.16, 0.045, at);
      else if (beat % 2 === 0) {
        this.tone("sine", 125, 0.43, 0.14, at, 48);
        this.tone("triangle", bassRoots[Math.floor(beat / 4) % 4], 0.19, this.beatSeconds * 0.55, at);
      } else this.tone("triangle", 730, 0.19, 0.065, at, 210);
      this.nextBeat++;
    }
  }

  playLaneTone(lane: number, accent: boolean) {
    if (this.ctx) this.tone("triangle", laneFrequencies[lane], accent ? 0.4 : 0.3, 0.15, this.ctx.currentTime);
  }

  playFeedback(kind: Judgement) {
    if (this.ctx) this.tone("sine", kind === "perfect" ? 880 : kind === "great" ? 660 : kind === "good" ? 440 : 140,
      0.09, 0.075, this.ctx.currentTime);
  }

  pause() {
    const elapsed = this.currentTime;
    this.dispose();
    this.offset = elapsed;
  }

  dispose() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.running = false;
    this.master?.disconnect();
    this.master = null;
    if (this.ctx && this.ctx.state !== "closed") void this.ctx.close().catch(() => {});
    this.ctx = null;
    this.audioOrigin = null;
  }
}
