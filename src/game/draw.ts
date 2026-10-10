import { BALL, H, LEFT_X, PADDLE_H, PADDLE_W, RIGHT_X, W, type Phase } from "./sim";

export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export interface DrawState {
  p1: number;
  p2: number;
  bx: number;
  by: number;
  phase: Phase;
}

export function spawnSparks(list: Spark[], x: number, y: number) {
  for (let i = 0; i < 7; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 140;
    list.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0.22 + Math.random() * 0.12,
    });
  }
}

export function stepSparks(list: Spark[], dt: number) {
  for (let i = list.length - 1; i >= 0; i--) {
    const s = list[i]!;
    s.life -= dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.life <= 0) list.splice(i, 1);
  }
}

export function drawCourt(
  ctx: CanvasRenderingContext2D,
  view: DrawState,
  sparks: Spark[],
  flash: number,
) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#1f7a14";
  for (let y = 8; y < H - 8; y += 26) {
    ctx.fillRect(W / 2 - 2, y, 4, 14);
  }

  ctx.strokeStyle = "#1f7a14";
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, W - 4, H - 4);

  ctx.fillStyle = "#5dff3a";
  ctx.shadowColor = "#5dff3a";
  ctx.shadowBlur = flash > 0 ? 26 : 12;
  ctx.fillRect(LEFT_X, view.p1, PADDLE_W, PADDLE_H);
  ctx.fillRect(RIGHT_X, view.p2, PADDLE_W, PADDLE_H);
  ctx.fillRect(view.bx, view.by, BALL, BALL);
  ctx.shadowBlur = 0;

  for (const s of sparks) {
    ctx.globalAlpha = Math.max(0, s.life * 3);
    ctx.fillRect(s.x, s.y, 4, 4);
  }
  ctx.globalAlpha = 1;
}

export function resizeCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(rect.width * dpr));
  const h = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  ctx.imageSmoothingEnabled = false;
  return ctx;
}
