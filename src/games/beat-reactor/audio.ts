/**
 * Beat Reactor — dedicated Web Audio graph (blueprint §6.2).
 *
 * The AudioContext clock is authoritative: chart hitTimes and judgement are
 * both expressed in `audioContext.currentTime` seconds, never `Date.now()`.
 * This module owns exactly one AudioContext per mounted game instance and
 * must be closed on unmount (blueprint §6.7: "audio nodes disconnect").
 */

const LANE_FREQS = [220, 277, 330, 392]; // one tone per lane, tap sound
const ACCENT_BOOST = 1.5;

export class ReactorAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  ensureStarted(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.2;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  get currentTime(): number {
    return this.ctx?.currentTime ?? 0;
  }

  playLaneTone(lane: number, accent: boolean, muted: boolean) {
    if (muted || !this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    osc.type = "square";
    osc.frequency.value = LANE_FREQS[lane] ?? 300;
    const vol = accent ? 0.16 * ACCENT_BOOST : 0.12;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playFeedback(kind: "perfect" | "great" | "good" | "miss") {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const freq = kind === "perfect" ? 900 : kind === "great" ? 700 : kind === "good" ? 500 : 140;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = kind === "miss" ? "sawtooth" : "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(kind === "miss" ? 0.14 : 0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  dispose() {
    this.master?.disconnect();
    this.master = null;
    if (this.ctx) {
      const ctx = this.ctx;
      this.ctx = null;
      void ctx.close();
    }
  }
}
