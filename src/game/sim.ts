export const W = 800;
export const H = 450;
export const PADDLE_W = 12;
export const PADDLE_H = 84;
export const BALL = 12;
export const LEFT_X = 28;
export const RIGHT_X = W - 28 - PADDLE_W;
export const WIN_SCORE = 7;
export const PADDLE_SPEED = 620;
export const SERVE_SPEED = 330;
export const MAX_SPEED = 740;
export const STEP = 1 / 120;

export type Phase = "lobby" | "countdown" | "play" | "point" | "over";
export type Side = 1 | 2;
export type SfxKind = "paddle" | "wall" | "score" | "win";

export interface Sim {
  p1: number;
  p2: number;
  bx: number;
  by: number;
  vx: number;
  vy: number;
  s1: number;
  s2: number;
  phase: Phase;
  countdown: number;
  pointT: number;
  winner: 0 | Side;
  serveDir: 1 | -1;
  hits: number;
  paused: boolean;
  epoch: number;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function paddleCenterY(top: number): number {
  return top + PADDLE_H / 2;
}

function centerPaddles(sim: Sim) {
  const y = (H - PADDLE_H) / 2;
  sim.p1 = y;
  sim.p2 = y;
}

function centerBall(sim: Sim) {
  sim.bx = W / 2 - BALL / 2;
  sim.by = H / 2 - BALL / 2;
  sim.vx = 0;
  sim.vy = 0;
}

export function createSim(): Sim {
  const sim: Sim = {
    p1: 0,
    p2: 0,
    bx: 0,
    by: 0,
    vx: 0,
    vy: 0,
    s1: 0,
    s2: 0,
    phase: "lobby",
    countdown: 3,
    pointT: 0,
    winner: 0,
    serveDir: 1,
    hits: 0,
    paused: false,
    epoch: 1,
  };
  centerPaddles(sim);
  centerBall(sim);
  return sim;
}

export function toLobby(sim: Sim) {
  sim.s1 = 0;
  sim.s2 = 0;
  sim.winner = 0;
  sim.paused = false;
  sim.hits = 0;
  sim.phase = "lobby";
  sim.epoch += 1;
  centerPaddles(sim);
  centerBall(sim);
}

export function beginCountdown(sim: Sim, dir?: 1 | -1) {
  if (dir) sim.serveDir = dir;
  sim.phase = "countdown";
  sim.countdown = 3;
  sim.paused = false;
  sim.winner = 0;
  sim.hits = 0;
  centerBall(sim);
}

export function resetMatch(sim: Sim) {
  sim.s1 = 0;
  sim.s2 = 0;
  sim.winner = 0;
  sim.paused = false;
  sim.epoch += 1;
  centerPaddles(sim);
  beginCountdown(sim, Math.random() < 0.5 ? 1 : -1);
}

export function movePaddle(sim: Sim, side: Side, dir: number, dt: number) {
  const next = clamp(
    (side === 1 ? sim.p1 : sim.p2) + dir * PADDLE_SPEED * dt,
    0,
    H - PADDLE_H,
  );
  if (side === 1) sim.p1 = next;
  else sim.p2 = next;
}

/** Smooth follow used for touch. `centerY` is the desired paddle center. */
export function glidePaddle(sim: Sim, side: Side, centerY: number, dt: number) {
  const current = side === 1 ? sim.p1 : sim.p2;
  const desired = clamp(centerY - PADDLE_H / 2, 0, H - PADDLE_H);
  const next = current + (desired - current) * Math.min(1, dt * 22);
  if (side === 1) sim.p1 = next;
  else sim.p2 = next;
}

function launch(sim: Sim) {
  sim.bx = W / 2 - BALL / 2;
  sim.by = H / 2 - BALL / 2;
  const angle = (Math.random() * 2 - 1) * 0.45;
  const speed = SERVE_SPEED;
  sim.vx = sim.serveDir * speed * Math.cos(angle);
  sim.vy = speed * Math.sin(angle);
  sim.phase = "play";
  sim.hits = 0;
}

function bounce(sim: Sim, side: Side): void {
  const paddleTop = side === 1 ? sim.p1 : sim.p2;
  const rel = clamp(
    (sim.by + BALL / 2 - (paddleTop + PADDLE_H / 2)) / (PADDLE_H / 2),
    -1,
    1,
  );
  const incoming = Math.hypot(sim.vx, sim.vy);
  const speed = Math.min(MAX_SPEED, Math.max(SERVE_SPEED, incoming * 1.065));
  const angle = rel * 1.02;
  const dir = side === 1 ? 1 : -1;
  sim.vx = dir * speed * Math.cos(angle);
  sim.vy = speed * Math.sin(angle);
  sim.hits += 1;
  sim.bx = side === 1 ? LEFT_X + PADDLE_W + 1 : RIGHT_X - BALL - 1;
}

function overlaps(
  bx: number,
  by: number,
  px: number,
  py: number,
): boolean {
  return bx < px + PADDLE_W && bx + BALL > px && by < py + PADDLE_H && by + BALL > py;
}

function crossedFace(
  prevBx: number,
  bx: number,
  by: number,
  paddleX: number,
  paddleY: number,
  side: Side,
): boolean {
  const face = side === 1 ? paddleX + PADDLE_W : paddleX;
  const prev = side === 1 ? prevBx + BALL : prevBx;
  const now = side === 1 ? bx + BALL : bx;
  const crossed = side === 1 ? prev >= face && now <= face : prev <= face && now >= face;
  if (!crossed) return false;
  return by < paddleY + PADDLE_H && by + BALL > paddleY;
}

function award(sim: Sim, scorer: Side, events: SfxKind[]) {
  if (scorer === 1) sim.s1 += 1;
  else sim.s2 += 1;
  sim.hits = 0;
  // Serve toward the player who just missed.
  sim.serveDir = scorer === 1 ? 1 : -1;
  centerBall(sim);
  const total = scorer === 1 ? sim.s1 : sim.s2;
  events.push("score");
  if (total >= WIN_SCORE) {
    sim.phase = "over";
    sim.winner = scorer;
    events.push("win");
    return;
  }
  sim.phase = "point";
  sim.pointT = 0.85;
}

/** Advance the authoritative simulation by a fixed slice of time. */
export function tick(sim: Sim, dt: number): SfxKind[] {
  if (sim.paused) return [];
  if (sim.phase === "lobby" || sim.phase === "over") return [];
  if (sim.phase === "point") {
    sim.pointT -= dt;
    if (sim.pointT <= 0) beginCountdown(sim, sim.serveDir);
    return [];
  }
  if (sim.phase === "countdown") {
    sim.countdown -= dt;
    centerBall(sim);
    if (sim.countdown <= 0) launch(sim);
    return [];
  }

  const events: SfxKind[] = [];
  const prevBx = sim.bx;
  sim.bx += sim.vx * dt;
  sim.by += sim.vy * dt;

  if (sim.by <= 0) {
    sim.by = 0;
    sim.vy = Math.abs(sim.vy);
    events.push("wall");
  } else if (sim.by + BALL >= H) {
    sim.by = H - BALL;
    sim.vy = -Math.abs(sim.vy);
    events.push("wall");
  }

  const hitLeft =
    sim.vx < 0 &&
    (overlaps(sim.bx, sim.by, LEFT_X, sim.p1) ||
      crossedFace(prevBx, sim.bx, sim.by, LEFT_X, sim.p1, 1));
  const hitRight =
    sim.vx > 0 &&
    (overlaps(sim.bx, sim.by, RIGHT_X, sim.p2) ||
      crossedFace(prevBx, sim.bx, sim.by, RIGHT_X, sim.p2, 2));

  if (hitLeft) {
    bounce(sim, 1);
    events.push("paddle");
  } else if (hitRight) {
    bounce(sim, 2);
    events.push("paddle");
  } else if (sim.bx + BALL <= 0) {
    award(sim, 2, events);
  } else if (sim.bx >= W) {
    award(sim, 1, events);
  }
  return events;
}

export interface Snap {
  seq: number;
  epoch: number;
  p1: number;
  p2: number;
  bx: number;
  by: number;
  vx: number;
  vy: number;
  s1: number;
  s2: number;
  phase: Phase;
  countdown: number;
  winner: 0 | Side;
  paused: boolean;
  hits: number;
  serveDir: 1 | -1;
}

export function makeSnap(sim: Sim, seq: number): Snap {
  return {
    seq,
    epoch: sim.epoch,
    p1: sim.p1,
    p2: sim.p2,
    bx: sim.bx,
    by: sim.by,
    vx: sim.vx,
    vy: sim.vy,
    s1: sim.s1,
    s2: sim.s2,
    phase: sim.phase,
    countdown: sim.countdown,
    winner: sim.winner,
    paused: sim.paused,
    hits: sim.hits,
    serveDir: sim.serveDir,
  };
}

export function applySnap(sim: Sim, snap: Snap, keep: 0 | Side) {
  const p1 = sim.p1;
  const p2 = sim.p2;
  sim.epoch = snap.epoch;
  sim.p1 = snap.p1;
  sim.p2 = snap.p2;
  sim.bx = snap.bx;
  sim.by = snap.by;
  sim.vx = snap.vx;
  sim.vy = snap.vy;
  sim.s1 = snap.s1;
  sim.s2 = snap.s2;
  sim.phase = snap.phase;
  sim.countdown = snap.countdown;
  sim.winner = snap.winner;
  sim.paused = snap.paused;
  sim.hits = snap.hits;
  sim.serveDir = snap.serveDir;
  if (keep === 1) sim.p1 = p1;
  if (keep === 2) sim.p2 = p2;
}

export function finiteSnap(data: unknown): Snap | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (o.t !== "snap" || !o.s || typeof o.s !== "object") return null;
  const s = o.s as Record<string, unknown>;
  const num = (k: string) => (typeof s[k] === "number" && Number.isFinite(s[k] as number) ? (s[k] as number) : null);
  const seq = num("seq");
  const epoch = num("epoch");
  const p1 = num("p1");
  const p2 = num("p2");
  const bx = num("bx");
  const by = num("by");
  const vx = num("vx");
  const vy = num("vy");
  const s1 = num("s1");
  const s2 = num("s2");
  const countdown = num("countdown");
  const hits = num("hits");
  const phase = s.phase;
  const winner = s.winner;
  const serveDir = s.serveDir;
  if (
    seq === null ||
    epoch === null ||
    p1 === null ||
    p2 === null ||
    bx === null ||
    by === null ||
    vx === null ||
    vy === null ||
    s1 === null ||
    s2 === null ||
    countdown === null ||
    hits === null
  ) {
    return null;
  }
  if (phase !== "lobby" && phase !== "countdown" && phase !== "play" && phase !== "point" && phase !== "over") {
    return null;
  }
  if (winner !== 0 && winner !== 1 && winner !== 2) return null;
  if (serveDir !== 1 && serveDir !== -1) return null;
  return {
    seq,
    epoch,
    p1: clamp(p1, -20, H),
    p2: clamp(p2, -20, H),
    bx: clamp(bx, -40, W + 40),
    by: clamp(by, -40, H + 40),
    vx: clamp(vx, -MAX_SPEED * 1.2, MAX_SPEED * 1.2),
    vy: clamp(vy, -MAX_SPEED * 1.2, MAX_SPEED * 1.2),
    s1: clamp(Math.round(s1), 0, 99),
    s2: clamp(Math.round(s2), 0, 99),
    phase,
    countdown: clamp(countdown, 0, 5),
    winner,
    paused: Boolean(s.paused),
    hits: clamp(Math.round(hits), 0, 999),
    serveDir,
  };
}
