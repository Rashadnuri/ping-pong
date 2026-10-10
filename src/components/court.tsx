import { useEffect, useRef, useState } from "react";
import { createBrain, driveAi, type Difficulty } from "@/game/ai";
import { playSfx, unlockAudio } from "@/game/audio";
import { drawCourt, resizeCanvas, spawnSparks, stepSparks, type Spark } from "@/game/draw";
import {
  BALL,
  H,
  PADDLE_H,
  STEP,
  W,
  applySnap,
  beginCountdown,
  clamp,
  createSim,
  finiteSnap,
  glidePaddle,
  makeSnap,
  movePaddle,
  resetMatch,
  tick,
  toLobby,
  type Phase,
  type Side,
  type Sim,
} from "@/game/sim";

export type LinkState = "waiting" | "connecting" | "live" | "reconnecting" | "failed";
export type CourtMode = "ai" | "local" | "online" | "demo";

interface Hud {
  phase: Phase;
  s1: number;
  s2: number;
  countdown: number;
  paused: boolean;
  winner: 0 | Side;
  ready: boolean;
  oppReady: boolean;
  notice: string;
}

interface World {
  sim: Sim;
  mode: CourtMode;
  side: Side;
  link: LinkState;
  difficulty: Difficulty;
  authority: boolean;
  silent: boolean;
  remoteY: number | null;
  localReady: boolean;
  remoteReady: boolean;
  lastSeq: number;
  snapBx: number;
  snapBy: number;
  snapVx: number;
  snapVy: number;
  snapAt: number;
  sparks: Spark[];
  flash: number;
  keys: Set<string>;
  pointers: Map<number, { side: Side; y: number }>;
  aiL: ReturnType<typeof createBrain>;
  aiR: ReturnType<typeof createBrain>;
  lastSend: number;
  seq: number;
  prevLink: LinkState;
  notice: string;
  noticeUntil: number;
  broadcast: ((data: unknown) => void) | null;
  send: ((data: unknown, peerId?: string) => void) | null;
}

export interface PongProbe {
  mode: string;
  phase: Phase;
  s1: number;
  s2: number;
  bx: number;
  by: number;
  vx: number;
  vy: number;
  p1: number;
  p2: number;
  paused: boolean;
  winner: number;
  side: number;
  link: string;
}

declare global {
  interface Window {
    __pong?: PongProbe;
  }
}

function readHud(w: World): Hud {
  const sim = w.sim;
  return {
    phase: sim.phase,
    s1: sim.s1,
    s2: sim.s2,
    countdown: sim.countdown,
    paused: sim.paused,
    winner: sim.winner,
    ready: w.localReady,
    oppReady: w.remoteReady,
    notice: w.notice,
  };
}

function hudSig(h: Hud): string {
  return [
    h.phase,
    h.s1,
    h.s2,
    h.paused ? 1 : 0,
    Math.ceil(h.countdown),
    h.winner,
    h.ready ? 1 : 0,
    h.oppReady ? 1 : 0,
    h.notice,
  ].join("|");
}

function pointerTarget(w: World, side: Side): number | null {
  let y: number | null = null;
  for (const p of w.pointers.values()) {
    if (p.side === side) y = p.y;
  }
  return y;
}

function applyHuman(w: World, side: Side, dt: number) {
  const target = pointerTarget(w, side);
  if (target !== null) {
    glidePaddle(w.sim, side, target, dt);
    return;
  }
  const keys = w.keys;
  let dir = 0;
  if (w.mode === "local") {
    if (side === 1) {
      if (keys.has("KeyW")) dir -= 1;
      if (keys.has("KeyS")) dir += 1;
    } else {
      if (keys.has("ArrowUp")) dir -= 1;
      if (keys.has("ArrowDown")) dir += 1;
    }
  } else if (side === w.side || w.mode === "ai") {
    if (keys.has("KeyW") || keys.has("ArrowUp")) dir -= 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) dir += 1;
  }
  if (dir !== 0) movePaddle(w.sim, side, dir, dt);
}

function courtPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect();
  const x = rect.width > 0 ? (clientX - rect.left) / rect.width : 0.5;
  const y = rect.height > 0 ? (clientY - rect.top) / rect.height : 0.5;
  return { x: clamp(x, 0, 1), y: clamp(y, 0, 1) * H };
}

export function Court({
  mode,
  difficulty = "normal",
  side = 1,
  link = "live",
  names,
  rtt = null,
  roomJoined = true,
  broadcast = null,
  send = null,
  onMessage = null,
  onExit,
  onRetry,
}: {
  mode: CourtMode;
  difficulty?: Difficulty;
  side?: Side;
  link?: LinkState;
  names: { p1: string; p2: string };
  rtt?: number | null;
  roomJoined?: boolean;
  broadcast?: ((data: unknown) => void) | null;
  send?: ((data: unknown, peerId?: string) => void) | null;
  onMessage?:
    | ((
        fn: (from: string, data: unknown, channel: "state" | "reliable") => void,
      ) => () => void)
    | null;
  onExit?: () => void;
  onRetry?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<World | null>(null);
  if (!worldRef.current) {
    const sim = createSim();
    if (mode === "ai" || mode === "local") beginCountdown(sim, 1);
    if (mode === "demo") {
      sim.phase = "play";
      sim.vx = 280;
      sim.vy = 150;
      sim.bx = W / 2 - BALL / 2;
      sim.by = H / 2 - BALL / 2;
    }
    worldRef.current = {
      sim,
      mode,
      side,
      link,
      difficulty,
      authority: mode !== "online",
      silent: mode === "demo",
      remoteY: null,
      localReady: false,
      remoteReady: false,
      lastSeq: 0,
      snapBx: sim.bx,
      snapBy: sim.by,
      snapVx: 0,
      snapVy: 0,
      snapAt: 0,
      sparks: [],
      flash: 0,
      keys: new Set(),
      pointers: new Map(),
      aiL: createBrain(),
      aiR: createBrain(),
      lastSend: 0,
      seq: 1,
      prevLink: link,
      notice: "",
      noticeUntil: 0,
      broadcast,
      send,
    };
  }

  const wLive = worldRef.current;
  wLive.mode = mode;
  wLive.side = side;
  wLive.link = link;
  wLive.difficulty = difficulty;
  wLive.silent = mode === "demo";
  wLive.authority =
    mode === "demo" || mode === "ai" || mode === "local" || (mode === "online" && side === 1 && link === "live");
  wLive.broadcast = broadcast;
  wLive.send = send;

  const [hud, setHud] = useState<Hud>(() => readHud(wLive));

  useEffect(() => {
    if (!onMessage) return;
    return onMessage((_from, data, channel) => {
      const w = worldRef.current;
      if (!w || !data || typeof data !== "object") return;
      const msg = data as Record<string, unknown>;
      if (channel === "state" && msg.t === "pad" && typeof msg.y === "number" && w.mode === "online" && w.side === 1) {
        w.remoteY = clamp(msg.y, 0, H - PADDLE_H);
        return;
      }
      if (channel === "state" && msg.t === "snap") {
        if (w.mode !== "online" || w.side !== 2) return;
        const snap = finiteSnap(msg);
        if (!snap || snap.seq <= w.lastSeq) return;
        w.lastSeq = snap.seq;
        const sim = w.sim;
        const prev = { s1: sim.s1, s2: sim.s2, vx: sim.vx, vy: sim.vy, phase: sim.phase, epoch: sim.epoch };
        if (snap.epoch !== sim.epoch) {
          w.localReady = false;
          w.remoteReady = false;
        }
        applySnap(sim, snap, 2);
        w.snapBx = snap.bx;
        w.snapBy = snap.by;
        w.snapVx = snap.vx;
        w.snapVy = snap.vy;
        w.snapAt = performance.now();
        if (sim.s1 > prev.s1 || sim.s2 > prev.s2) playSfx("score");
        if (prev.phase !== "over" && sim.phase === "over") playSfx("win");
        if (prev.phase === "play" && sim.phase === "play") {
          if (prev.vx * sim.vx < 0) {
            playSfx("paddle");
            spawnSparks(w.sparks, sim.bx + BALL / 2, sim.by + BALL / 2);
            w.flash = 0.12;
          } else if (prev.vy * sim.vy < 0) playSfx("wall");
        }
        return;
      }
      if (channel === "reliable" && msg.t === "ready" && msg.epoch === w.sim.epoch) {
        w.remoteReady = Boolean(msg.v);
        return;
      }
      if (channel === "reliable" && msg.t === "pause" && w.mode === "online" && w.side === 1) {
        const phase = w.sim.phase;
        if (phase === "play" || phase === "countdown" || phase === "point" || w.sim.paused) {
          w.sim.paused = !w.sim.paused;
        }
      }
    });
  }, [onMessage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    let last = performance.now();
    let accum = 0;
    let sig = "";

    const onKeyDown = (e: KeyboardEvent) => {
      const w = worldRef.current;
      if (!w || w.mode === "demo") return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (e.repeat) return;
        unlockAudio();
        togglePause(w);
        return;
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
      w.keys.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      worldRef.current?.keys.delete(e.code);
    };
    const onBlur = () => {
      worldRef.current?.keys.clear();
      worldRef.current?.pointers.clear();
    };

    const frame = (now: number) => {
      const w = worldRef.current!;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const sim = w.sim;

      if (w.notice && now > w.noticeUntil) w.notice = "";

      if (w.mode === "online" && w.link === "waiting" && w.prevLink !== "waiting" && sim.phase !== "lobby") {
        toLobby(sim);
        w.localReady = false;
        w.remoteReady = false;
        w.notice = "OPPONENT DISCONNECTED";
        w.noticeUntil = now + 4000;
      }
      w.prevLink = w.link;

      if (w.mode === "online" && w.link === "live" && sim.phase !== "lobby") w.notice = "";

      if (w.mode !== "demo" && !sim.paused) {
        if (w.mode === "local") {
          applyHuman(w, 1, dt);
          applyHuman(w, 2, dt);
        } else if (w.mode === "ai") {
          applyHuman(w, 1, dt);
        } else if (w.mode === "online") {
          if (w.side === 1 && w.remoteY !== null) sim.p2 = w.remoteY;
          applyHuman(w, w.side, dt);
        }
      }

      if (w.authority && !sim.paused) {
        if (w.mode === "ai") driveAi(sim, 2, w.difficulty, w.aiR, dt);
        if (w.mode === "demo") {
          driveAi(sim, 1, "normal", w.aiL, dt);
          driveAi(sim, 2, "normal", w.aiR, dt);
        }
      }

      if (
        w.mode === "online" &&
        w.side === 1 &&
        w.link === "live" &&
        w.localReady &&
        w.remoteReady &&
        (sim.phase === "lobby" || sim.phase === "over")
      ) {
        resetMatch(sim);
        w.localReady = false;
        w.remoteReady = false;
      }

      if (w.authority) {
        accum += dt;
        let guard = 0;
        while (accum >= STEP && guard++ < 8) {
          const events = tick(sim, STEP);
          accum -= STEP;
          if (!w.silent) {
            for (const ev of events) {
              playSfx(ev);
              if (ev === "paddle") {
                spawnSparks(w.sparks, sim.bx + BALL / 2, sim.by + BALL / 2);
                w.flash = 0.12;
              }
            }
          }
          if (w.mode === "demo" && sim.phase !== "play") {
            sim.s1 = 0;
            sim.s2 = 0;
            sim.winner = 0;
            sim.paused = false;
            sim.phase = "play";
            sim.hits = 0;
            sim.bx = W / 2 - BALL / 2;
            sim.by = H / 2 - BALL / 2;
            const dir = Math.random() < 0.5 ? 1 : -1;
            sim.vx = dir * 300;
            sim.vy = (Math.random() * 2 - 1) * 180;
          }
        }
      } else if (w.mode === "online" && sim.phase === "countdown" && !sim.paused) {
        sim.countdown = Math.max(0, sim.countdown - dt);
      }

      if (w.mode === "online" && w.link === "live" && now - w.lastSend > 50) {
        w.lastSend = now;
        if (w.side === 1) {
          w.broadcast?.( { t: "snap", s: makeSnap(sim, w.seq++) });
        } else {
          w.broadcast?.({ t: "pad", y: sim.p2 });
        }
      }

      w.flash = Math.max(0, w.flash - dt);
      stepSparks(w.sparks, dt);

      const ctx = resizeCanvas(canvas);
      if (ctx) {
        let bx = sim.bx;
        let by = sim.by;
        if (w.mode === "online" && w.side === 2 && sim.phase === "play" && !sim.paused && w.snapAt > 0) {
          const age = Math.min(0.1, (now - w.snapAt) / 1000);
          bx = w.snapBx + w.snapVx * age;
          by = clamp(w.snapBy + w.snapVy * age, 0, H - BALL);
        }
        drawCourt(ctx, { p1: sim.p1, p2: sim.p2, bx, by, phase: sim.phase }, w.sparks, w.flash);
        window.__pong = {
          mode: w.mode,
          phase: sim.phase,
          s1: sim.s1,
          s2: sim.s2,
          bx,
          by,
          vx: sim.vx,
          vy: sim.vy,
          p1: sim.p1,
          p2: sim.p2,
          paused: sim.paused,
          winner: sim.winner,
          side: w.side,
          link: w.link,
        };
      }

      const next = readHud(w);
      const nextSig = hudSig(next);
      if (nextSig !== sig) {
        sig = nextSig;
        setHud(next);
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const sim = worldRef.current.sim;
  const interactive = mode !== "demo";

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    unlockAudio();
    const canvas = canvasRef.current;
    const w = worldRef.current;
    if (!canvas || !w || w.sim.paused) return;
    const pt = courtPoint(canvas, e.clientX, e.clientY);
    const which: Side = mode === "local" ? (pt.x < 0.5 ? 1 : 2) : side;
    w.pointers.set(e.pointerId, { side: which, y: pt.y });
    canvas.setPointerCapture(e.pointerId);
  };
  const onPointerEnd = (e: React.PointerEvent<HTMLCanvasElement>) => {
    worldRef.current?.pointers.delete(e.pointerId);
  };

  const pressReady = () => {
    const w = worldRef.current;
    if (!w) return;
    unlockAudio();
    w.localReady = true;
    w.send?.({ t: "ready", v: true, epoch: w.sim.epoch });
    setHud(readHud(w));
  };

  const pressPause = () => {
    const w = worldRef.current;
    if (!w) return;
    unlockAudio();
    togglePause(w);
    setHud(readHud(w));
  };

  const pressRestart = () => {
    const w = worldRef.current;
    if (!w || w.mode === "online") return;
    unlockAudio();
    resetMatch(w.sim);
    setHud(readHud(w));
  };

  const showReady = mode === "online" && link === "live" && (hud.phase === "lobby" || hud.phase === "over");
  const showCount = hud.phase === "countdown" && !hud.paused;
  const countLabel = Math.max(1, Math.ceil(hud.countdown));

  let banner: string | null = null;
  if (mode === "online" && !roomJoined) banner = "JOINING ROOM";
  else if (mode === "online" && link === "waiting") banner = hud.notice || "WAITING FOR OPPONENT";
  else if (mode === "online" && link === "connecting") banner = "CONNECTING";
  else if (mode === "online" && link === "reconnecting") banner = "OPPONENT RECONNECTING";
  else if (mode === "online" && link === "failed") banner = "LINK FAILED";
  else if (hud.paused) banner = "PAUSED";
  else if (hud.phase === "over") banner = hud.winner === 1 ? `${names.p1} WINS` : `${names.p2} WINS`;

  const youAre = mode === "online" && link !== "waiting" ? side : 0;

  return (
    <div
      className={interactive ? "w-full" : "pointer-events-none absolute inset-0"}
      aria-hidden={interactive ? undefined : true}
    >
      {interactive && (
        <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div className="min-w-0">
            <div className="truncate font-term text-2xl uppercase leading-none">{names.p1}</div>
            <div className="font-term text-lg uppercase text-dim">
              {mode === "local" ? "W / S" : youAre === 1 ? "You · P1 · left" : "P1 · left"}
            </div>
          </div>
          <div className="font-pixel text-xl text-fg sm:text-3xl" aria-live="polite">
            <span data-testid="score-p1">{hud.s1}</span>
            <span className="px-2 text-dim">:</span>
            <span data-testid="score-p2">{hud.s2}</span>
          </div>
          <div className="min-w-0 text-right">
            <div className="truncate font-term text-2xl uppercase leading-none">{names.p2}</div>
            <div className="font-term text-lg uppercase text-dim">
              {mode === "local" ? "Arrows" : youAre === 2 ? "You · P2 · right" : mode === "ai" ? difficulty : "P2 · right"}
            </div>
          </div>
        </div>
      )}

      <div className={interactive ? "court-frame" : "h-full w-full"}>
        <div className="relative border-2 border-dim bg-bg shadow-glow">
          <canvas
            ref={canvasRef}
            className="aspect-video w-full touch-none"
            role="img"
            aria-label="Pong court"
            onPointerDown={onPointer}
            onPointerMove={onPointer}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
          />
          {interactive && (banner || showCount || showReady) && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg/75 px-4 text-center">
              {banner && <p className="glow max-w-full font-pixel text-xs uppercase leading-relaxed sm:text-sm">{banner}</p>}
              {showCount && <p className="glow font-pixel text-4xl">{countLabel}</p>}
              {mode === "online" && link === "failed" && (
                <div className="pointer-events-auto w-full max-w-xs">
                  <p className="mb-3 font-term text-xl text-dim">
                    A strict network can block the direct link. Retry, or switch Wi-Fi.
                  </p>
                  <button type="button" className="btn-line" onClick={onRetry}>
                    Retry link
                  </button>
                </div>
              )}
              {showReady && (
                <div className="pointer-events-auto w-full max-w-xs">
                  <p className="mb-3 font-term text-xl text-dim">
                    {hud.ready && !hud.oppReady
                      ? "Waiting for opponent"
                      : !hud.ready && hud.oppReady
                        ? "Opponent is ready"
                        : hud.phase === "over"
                          ? "First to 7. Rematch?"
                          : "Both players ready up"}
                  </p>
                  <button type="button" className="btn-fill" onClick={pressReady} disabled={hud.ready}>
                    {hud.phase === "over" ? "Rematch" : "Ready"}
                  </button>
                </div>
              )}
              {hud.paused && (
                <div className="pointer-events-auto w-full max-w-xs">
                  <button type="button" className="btn-fill" onClick={pressPause}>
                    Resume
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {interactive && (
        <div className="mx-auto mt-3 flex w-full max-w-xl flex-col gap-2">
          <p className="text-center font-term text-xl uppercase text-dim">
            {mode === "local"
              ? "Left drag or W/S · right drag or arrows · space pauses"
              : mode === "online"
                ? rtt != null
                  ? `Drag or W/S/arrows · space pauses · ${rtt} ms`
                  : "Drag or W/S/arrows · space pauses"
                : `Drag or W/S/arrows · space pauses · first to 7`}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn-line" onClick={pressPause}>
              {hud.paused ? "Resume" : "Pause"}
            </button>
            {mode === "online" ? (
              <button type="button" className="btn-line" onClick={onExit}>
                Leave
              </button>
            ) : (
              <button type="button" className="btn-line" onClick={pressRestart}>
                Restart
              </button>
            )}
          </div>
          {mode !== "online" && (
            <button type="button" className="btn-line" onClick={onExit}>
              Menu
            </button>
          )}
          {mode === "online" && hud.phase === "over" && !showReady && null}
          <p className="sr-only" data-testid="phase">
            {hud.phase} {sim.winner}
          </p>
        </div>
      )}
    </div>
  );
}

function togglePause(w: World) {
  const phase = w.sim.phase;
  const can = phase === "play" || phase === "countdown" || phase === "point" || w.sim.paused;
  if (!can) return;
  if (w.mode === "online" && w.side !== 1) {
    w.sim.paused = !w.sim.paused;
    w.send?.({ t: "pause" });
    return;
  }
  w.sim.paused = !w.sim.paused;
}
