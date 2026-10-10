import {
  BALL,
  H,
  LEFT_X,
  PADDLE_H,
  RIGHT_X,
  type Side,
  type Sim,
} from "./sim";

export type Difficulty = "easy" | "normal" | "hard";

const TUNING: Record<Difficulty, { speed: number; error: number; think: number; predict: boolean }> = {
  easy: { speed: 250, error: 78, think: 0.28, predict: false },
  normal: { speed: 430, error: 28, think: 0.11, predict: true },
  hard: { speed: 680, error: 8, think: 0.04, predict: true },
};

export interface AiBrain {
  lag: number;
  target: number;
}

export function createBrain(): AiBrain {
  return { lag: 0, target: H / 2 };
}

function predictY(sim: Sim, paddleX: number): number {
  let x = sim.bx;
  let y = sim.by;
  let vx = sim.vx;
  let vy = sim.vy;
  if (Math.abs(vx) < 8) return y + BALL / 2;
  const goingRight = paddleX > x;
  if (goingRight !== vx > 0) return H / 2;
  for (let i = 0; i < 6; i++) {
    const dist = (goingRight ? paddleX : paddleX + 12) - x;
    if (Math.abs(vx) < 1) break;
    const t = dist / vx;
    if (t < 0) break;
    const ny = y + vy * t;
    if (vy < 0 && ny < 0) {
      const tw = y / -vy;
      x += vx * tw;
      y = 0;
      vy = Math.abs(vy);
      continue;
    }
    if (vy > 0 && ny + BALL > H) {
      const tw = (H - BALL - y) / vy;
      x += vx * tw;
      y = H - BALL;
      vy = -Math.abs(vy);
      continue;
    }
    return ny + BALL / 2;
  }
  return y + BALL / 2;
}

export function driveAi(sim: Sim, side: Side, difficulty: Difficulty, brain: AiBrain, dt: number) {
  if (sim.phase === "lobby" || sim.phase === "over") return;
  const tune = TUNING[difficulty];
  brain.lag -= dt;
  const top = side === 1 ? sim.p1 : sim.p2;
  if (brain.lag <= 0) {
    brain.lag = tune.think;
    const toward = side === 1 ? sim.vx < 0 : sim.vx > 0;
    const x = side === 1 ? LEFT_X : RIGHT_X;
    let aim = H / 2;
    if (sim.phase === "play" && toward) {
      aim = tune.predict ? predictY(sim, x) : sim.by + BALL / 2;
      aim += (Math.random() * 2 - 1) * tune.error;
    } else if (sim.phase !== "play") {
      aim = H / 2;
    } else {
      aim = top + PADDLE_H / 2;
    }
    brain.target = aim;
  }
  const center = top + PADDLE_H / 2;
  const maxStep = tune.speed * dt;
  const dy = Math.max(-maxStep, Math.min(maxStep, brain.target - center));
  const next = Math.max(0, Math.min(H - PADDLE_H, top + dy));
  if (side === 1) sim.p1 = next;
  else sim.p2 = next;
}
