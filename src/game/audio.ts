import type { SfxKind } from "./sim";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

export function getMuted(): boolean {
  return muted;
}

export function setMuted(next: boolean) {
  muted = next;
  try {
    localStorage.setItem("pong-mute", next ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (ctx && master) {
    master.gain.setTargetAtTime(next ? 0 : 0.22, ctx.currentTime, 0.02);
  }
}

export function loadMutePref() {
  try {
    muted = localStorage.getItem("pong-mute") === "1";
  } catch {
    muted = false;
  }
}

/** Call synchronously inside a click, key, or touch handler. */
export function unlockAudio() {
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  if (!ctx) {
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.22;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
}

export function resumeAudio() {
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

function tone(freq: number, dur: number, when: number, gain = 0.8, type: OscillatorType = "square") {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(gain, when + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(when);
  osc.stop(when + dur + 0.02);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}

export function playSfx(kind: SfxKind) {
  if (!ctx || !master || muted) return;
  const t = ctx.currentTime;
  const wobble = 1 + (Math.random() * 2 - 1) * 0.04;
  if (kind === "paddle") tone(540 * wobble, 0.06, t, 0.7);
  else if (kind === "wall") tone(240 * wobble, 0.05, t, 0.45);
  else if (kind === "score") {
    tone(196, 0.12, t, 0.7);
    tone(140, 0.16, t + 0.08, 0.55);
  } else if (kind === "win") {
    tone(392, 0.12, t, 0.6);
    tone(523, 0.12, t + 0.12, 0.6);
    tone(659, 0.14, t + 0.24, 0.6);
    tone(784, 0.22, t + 0.38, 0.7);
  }
}
