import { o as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime, b as useNavigate, y as getRouteApi } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as previewPathPrefix } from "./router-qJ6FxOJe.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-OJJyZb2I.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STEP = 1 / 120;
function clamp(n, lo, hi) {
	return Math.max(lo, Math.min(hi, n));
}
function centerPaddles(sim) {
	const y = 183;
	sim.p1 = y;
	sim.p2 = y;
}
function centerBall(sim) {
	sim.bx = 394;
	sim.by = 219;
	sim.vx = 0;
	sim.vy = 0;
}
function createSim() {
	const sim = {
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
		epoch: 1
	};
	centerPaddles(sim);
	centerBall(sim);
	return sim;
}
function toLobby(sim) {
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
function beginCountdown(sim, dir) {
	if (dir) sim.serveDir = dir;
	sim.phase = "countdown";
	sim.countdown = 3;
	sim.paused = false;
	sim.winner = 0;
	sim.hits = 0;
	centerBall(sim);
}
function resetMatch(sim) {
	sim.s1 = 0;
	sim.s2 = 0;
	sim.winner = 0;
	sim.paused = false;
	sim.epoch += 1;
	centerPaddles(sim);
	beginCountdown(sim, Math.random() < .5 ? 1 : -1);
}
function movePaddle(sim, side, dir, dt) {
	const next = clamp((side === 1 ? sim.p1 : sim.p2) + dir * 620 * dt, 0, 366);
	if (side === 1) sim.p1 = next;
	else sim.p2 = next;
}
/** Smooth follow used for touch. `centerY` is the desired paddle center. */
function glidePaddle(sim, side, centerY, dt) {
	const current = side === 1 ? sim.p1 : sim.p2;
	const next = current + (clamp(centerY - 42, 0, 366) - current) * Math.min(1, dt * 22);
	if (side === 1) sim.p1 = next;
	else sim.p2 = next;
}
function launch(sim) {
	sim.bx = 394;
	sim.by = 219;
	const angle = (Math.random() * 2 - 1) * .45;
	const speed = 330;
	sim.vx = sim.serveDir * speed * Math.cos(angle);
	sim.vy = speed * Math.sin(angle);
	sim.phase = "play";
	sim.hits = 0;
}
function bounce(sim, side) {
	const paddleTop = side === 1 ? sim.p1 : sim.p2;
	const rel = clamp((sim.by + 6 - (paddleTop + 42)) / 42, -1, 1);
	const incoming = Math.hypot(sim.vx, sim.vy);
	const speed = Math.min(740, Math.max(330, incoming * 1.065));
	const angle = rel * 1.02;
	sim.vx = (side === 1 ? 1 : -1) * speed * Math.cos(angle);
	sim.vy = speed * Math.sin(angle);
	sim.hits += 1;
	sim.bx = side === 1 ? 41 : 747;
}
function overlaps(bx, by, px, py) {
	return bx < px + 12 && bx + 12 > px && by < py + 84 && by + 12 > py;
}
function crossedFace(prevBx, bx, by, paddleX, paddleY, side) {
	const face = side === 1 ? paddleX + 12 : paddleX;
	const prev = side === 1 ? prevBx + 12 : prevBx;
	const now = side === 1 ? bx + 12 : bx;
	if (!(side === 1 ? prev >= face && now <= face : prev <= face && now >= face)) return false;
	return by < paddleY + 84 && by + 12 > paddleY;
}
function award(sim, scorer, events) {
	if (scorer === 1) sim.s1 += 1;
	else sim.s2 += 1;
	sim.hits = 0;
	sim.serveDir = scorer === 1 ? 1 : -1;
	centerBall(sim);
	const total = scorer === 1 ? sim.s1 : sim.s2;
	events.push("score");
	if (total >= 7) {
		sim.phase = "over";
		sim.winner = scorer;
		events.push("win");
		return;
	}
	sim.phase = "point";
	sim.pointT = .85;
}
/** Advance the authoritative simulation by a fixed slice of time. */
function tick(sim, dt) {
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
	const events = [];
	const prevBx = sim.bx;
	sim.bx += sim.vx * dt;
	sim.by += sim.vy * dt;
	if (sim.by <= 0) {
		sim.by = 0;
		sim.vy = Math.abs(sim.vy);
		events.push("wall");
	} else if (sim.by + 12 >= 450) {
		sim.by = 438;
		sim.vy = -Math.abs(sim.vy);
		events.push("wall");
	}
	const hitLeft = sim.vx < 0 && (overlaps(sim.bx, sim.by, 28, sim.p1) || crossedFace(prevBx, sim.bx, sim.by, 28, sim.p1, 1));
	const hitRight = sim.vx > 0 && (overlaps(sim.bx, sim.by, 760, sim.p2) || crossedFace(prevBx, sim.bx, sim.by, 760, sim.p2, 2));
	if (hitLeft) {
		bounce(sim, 1);
		events.push("paddle");
	} else if (hitRight) {
		bounce(sim, 2);
		events.push("paddle");
	} else if (sim.bx + 12 <= 0) award(sim, 2, events);
	else if (sim.bx >= 800) award(sim, 1, events);
	return events;
}
function makeSnap(sim, seq) {
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
		serveDir: sim.serveDir
	};
}
function applySnap(sim, snap, keep) {
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
function finiteSnap(data) {
	if (!data || typeof data !== "object") return null;
	const o = data;
	if (o.t !== "snap" || !o.s || typeof o.s !== "object") return null;
	const s = o.s;
	const num = (k) => typeof s[k] === "number" && Number.isFinite(s[k]) ? s[k] : null;
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
	if (seq === null || epoch === null || p1 === null || p2 === null || bx === null || by === null || vx === null || vy === null || s1 === null || s2 === null || countdown === null || hits === null) return null;
	if (phase !== "lobby" && phase !== "countdown" && phase !== "play" && phase !== "point" && phase !== "over") return null;
	if (winner !== 0 && winner !== 1 && winner !== 2) return null;
	if (serveDir !== 1 && serveDir !== -1) return null;
	return {
		seq,
		epoch,
		p1: clamp(p1, -20, 450),
		p2: clamp(p2, -20, 450),
		bx: clamp(bx, -40, 840),
		by: clamp(by, -40, 490),
		vx: clamp(vx, -888, 888),
		vy: clamp(vy, -888, 888),
		s1: clamp(Math.round(s1), 0, 99),
		s2: clamp(Math.round(s2), 0, 99),
		phase,
		countdown: clamp(countdown, 0, 5),
		winner,
		paused: Boolean(s.paused),
		hits: clamp(Math.round(hits), 0, 999),
		serveDir
	};
}
var TUNING = {
	easy: {
		speed: 250,
		error: 78,
		think: .28,
		predict: false
	},
	normal: {
		speed: 430,
		error: 28,
		think: .11,
		predict: true
	},
	hard: {
		speed: 680,
		error: 8,
		think: .04,
		predict: true
	}
};
function createBrain() {
	return {
		lag: 0,
		target: 225
	};
}
function predictY(sim, paddleX) {
	let x = sim.bx;
	let y = sim.by;
	let vx = sim.vx;
	let vy = sim.vy;
	if (Math.abs(vx) < 8) return y + 6;
	const goingRight = paddleX > x;
	if (goingRight !== vx > 0) return 225;
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
		if (vy > 0 && ny + 12 > 450) {
			const tw = (438 - y) / vy;
			x += vx * tw;
			y = 438;
			vy = -Math.abs(vy);
			continue;
		}
		return ny + 6;
	}
	return y + 6;
}
function driveAi(sim, side, difficulty, brain, dt) {
	if (sim.phase === "lobby" || sim.phase === "over") return;
	const tune = TUNING[difficulty];
	brain.lag -= dt;
	const top = side === 1 ? sim.p1 : sim.p2;
	if (brain.lag <= 0) {
		brain.lag = tune.think;
		const toward = side === 1 ? sim.vx < 0 : sim.vx > 0;
		const x = side === 1 ? 28 : 760;
		let aim = 225;
		if (sim.phase === "play" && toward) {
			aim = tune.predict ? predictY(sim, x) : sim.by + 6;
			aim += (Math.random() * 2 - 1) * tune.error;
		} else if (sim.phase !== "play") aim = 225;
		else aim = top + 42;
		brain.target = aim;
	}
	const center = top + 42;
	const maxStep = tune.speed * dt;
	const dy = Math.max(-maxStep, Math.min(maxStep, brain.target - center));
	const next = Math.max(0, Math.min(366, top + dy));
	if (side === 1) sim.p1 = next;
	else sim.p2 = next;
}
var ctx = null;
var master = null;
var muted = false;
function getMuted() {
	return muted;
}
function setMuted(next) {
	muted = next;
	try {
		localStorage.setItem("pong-mute", next ? "1" : "0");
	} catch {}
	if (ctx && master) master.gain.setTargetAtTime(next ? 0 : .22, ctx.currentTime, .02);
}
function loadMutePref() {
	try {
		muted = localStorage.getItem("pong-mute") === "1";
	} catch {
		muted = false;
	}
}
/** Call synchronously inside a click, key, or touch handler. */
function unlockAudio() {
	const AC = window.AudioContext || window.webkitAudioContext;
	if (!AC) return;
	if (!ctx) {
		ctx = new AC({ latencyHint: "interactive" });
		master = ctx.createGain();
		master.gain.value = muted ? 0 : .22;
		master.connect(ctx.destination);
	}
	if (ctx.state === "suspended") ctx.resume();
}
function resumeAudio() {
	if (ctx && ctx.state === "suspended") ctx.resume();
}
function tone(freq, dur, when, gain = .8, type = "square") {
	if (!ctx || !master) return;
	const osc = ctx.createOscillator();
	const g = ctx.createGain();
	osc.type = type;
	osc.frequency.setValueAtTime(freq, when);
	g.gain.setValueAtTime(1e-4, when);
	g.gain.exponentialRampToValueAtTime(gain, when + .008);
	g.gain.exponentialRampToValueAtTime(1e-4, when + dur);
	osc.connect(g);
	g.connect(master);
	osc.start(when);
	osc.stop(when + dur + .02);
	osc.onended = () => {
		osc.disconnect();
		g.disconnect();
	};
}
function playSfx(kind) {
	if (!ctx || !master || muted) return;
	const t = ctx.currentTime;
	const wobble = 1 + (Math.random() * 2 - 1) * .04;
	if (kind === "paddle") tone(540 * wobble, .06, t, .7);
	else if (kind === "wall") tone(240 * wobble, .05, t, .45);
	else if (kind === "score") {
		tone(196, .12, t, .7);
		tone(140, .16, t + .08, .55);
	} else if (kind === "win") {
		tone(392, .12, t, .6);
		tone(523, .12, t + .12, .6);
		tone(659, .14, t + .24, .6);
		tone(784, .22, t + .38, .7);
	}
}
function spawnSparks(list, x, y) {
	for (let i = 0; i < 7; i++) {
		const a = Math.random() * Math.PI * 2;
		const sp = 40 + Math.random() * 140;
		list.push({
			x,
			y,
			vx: Math.cos(a) * sp,
			vy: Math.sin(a) * sp,
			life: .22 + Math.random() * .12
		});
	}
}
function stepSparks(list, dt) {
	for (let i = list.length - 1; i >= 0; i--) {
		const s = list[i];
		s.life -= dt;
		s.x += s.vx * dt;
		s.y += s.vy * dt;
		if (s.life <= 0) list.splice(i, 1);
	}
}
function drawCourt(ctx, view, sparks, flash) {
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, 800, 450);
	ctx.fillStyle = "#1f7a14";
	for (let y = 8; y < 442; y += 26) ctx.fillRect(398, y, 4, 14);
	ctx.strokeStyle = "#1f7a14";
	ctx.lineWidth = 3;
	ctx.strokeRect(2, 2, 796, 446);
	ctx.fillStyle = "#5dff3a";
	ctx.shadowColor = "#5dff3a";
	ctx.shadowBlur = flash > 0 ? 26 : 12;
	ctx.fillRect(28, view.p1, 12, 84);
	ctx.fillRect(760, view.p2, 12, 84);
	ctx.fillRect(view.bx, view.by, 12, 12);
	ctx.shadowBlur = 0;
	for (const s of sparks) {
		ctx.globalAlpha = Math.max(0, s.life * 3);
		ctx.fillRect(s.x, s.y, 4, 4);
	}
	ctx.globalAlpha = 1;
}
function resizeCanvas(canvas) {
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
	ctx.setTransform(canvas.width / 800, 0, 0, canvas.height / 450, 0, 0);
	ctx.imageSmoothingEnabled = false;
	return ctx;
}
function readHud(w) {
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
		notice: w.notice
	};
}
function hudSig(h) {
	return [
		h.phase,
		h.s1,
		h.s2,
		h.paused ? 1 : 0,
		Math.ceil(h.countdown),
		h.winner,
		h.ready ? 1 : 0,
		h.oppReady ? 1 : 0,
		h.notice
	].join("|");
}
function pointerTarget(w, side) {
	let y = null;
	for (const p of w.pointers.values()) if (p.side === side) y = p.y;
	return y;
}
function applyHuman(w, side, dt) {
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
function courtPoint(canvas, clientX, clientY) {
	const rect = canvas.getBoundingClientRect();
	const x = rect.width > 0 ? (clientX - rect.left) / rect.width : .5;
	const y = rect.height > 0 ? (clientY - rect.top) / rect.height : .5;
	return {
		x: clamp(x, 0, 1),
		y: clamp(y, 0, 1) * 450
	};
}
function Court({ mode, difficulty = "normal", side = 1, link = "live", names, rtt = null, roomJoined = true, broadcast = null, send = null, onMessage = null, onExit, onRetry }) {
	const canvasRef = (0, import_react.useRef)(null);
	const worldRef = (0, import_react.useRef)(null);
	if (!worldRef.current) {
		const sim = createSim();
		if (mode === "ai" || mode === "local") beginCountdown(sim, 1);
		if (mode === "demo") {
			sim.phase = "play";
			sim.vx = 280;
			sim.vy = 150;
			sim.bx = 394;
			sim.by = 219;
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
			keys: /* @__PURE__ */ new Set(),
			pointers: /* @__PURE__ */ new Map(),
			aiL: createBrain(),
			aiR: createBrain(),
			lastSend: 0,
			seq: 1,
			prevLink: link,
			notice: "",
			noticeUntil: 0,
			broadcast,
			send
		};
	}
	const wLive = worldRef.current;
	wLive.mode = mode;
	wLive.side = side;
	wLive.link = link;
	wLive.difficulty = difficulty;
	wLive.silent = mode === "demo";
	wLive.authority = mode === "demo" || mode === "ai" || mode === "local" || mode === "online" && side === 1 && link === "live";
	wLive.broadcast = broadcast;
	wLive.send = send;
	const [hud, setHud] = (0, import_react.useState)(() => readHud(wLive));
	(0, import_react.useEffect)(() => {
		if (!onMessage) return;
		return onMessage((_from, data, channel) => {
			const w = worldRef.current;
			if (!w || !data || typeof data !== "object") return;
			const msg = data;
			if (channel === "state" && msg.t === "pad" && typeof msg.y === "number" && w.mode === "online" && w.side === 1) {
				w.remoteY = clamp(msg.y, 0, 366);
				return;
			}
			if (channel === "state" && msg.t === "snap") {
				if (w.mode !== "online" || w.side !== 2) return;
				const snap = finiteSnap(msg);
				if (!snap || snap.seq <= w.lastSeq) return;
				w.lastSeq = snap.seq;
				const sim = w.sim;
				const prev = {
					s1: sim.s1,
					s2: sim.s2,
					vx: sim.vx,
					vy: sim.vy,
					phase: sim.phase,
					epoch: sim.epoch
				};
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
						spawnSparks(w.sparks, sim.bx + 6, sim.by + 6);
						w.flash = .12;
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
				if (phase === "play" || phase === "countdown" || phase === "point" || w.sim.paused) w.sim.paused = !w.sim.paused;
			}
		});
	}, [onMessage]);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		let raf = 0;
		let last = performance.now();
		let accum = 0;
		let sig = "";
		const onKeyDown = (e) => {
			const w = worldRef.current;
			if (!w || w.mode === "demo") return;
			const target = e.target;
			if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
			if (e.code === "Space") {
				e.preventDefault();
				if (e.repeat) return;
				unlockAudio();
				togglePause(w);
				return;
			}
			if ([
				"ArrowUp",
				"ArrowDown",
				"ArrowLeft",
				"ArrowRight"
			].includes(e.code)) e.preventDefault();
			w.keys.add(e.code);
		};
		const onKeyUp = (e) => {
			worldRef.current?.keys.delete(e.code);
		};
		const onBlur = () => {
			worldRef.current?.keys.clear();
			worldRef.current?.pointers.clear();
		};
		const frame = (now) => {
			const w = worldRef.current;
			const dt = Math.min(.05, (now - last) / 1e3);
			last = now;
			const sim = w.sim;
			if (w.notice && now > w.noticeUntil) w.notice = "";
			if (w.mode === "online" && w.link === "waiting" && w.prevLink !== "waiting" && sim.phase !== "lobby") {
				toLobby(sim);
				w.localReady = false;
				w.remoteReady = false;
				w.notice = "OPPONENT DISCONNECTED";
				w.noticeUntil = now + 4e3;
			}
			w.prevLink = w.link;
			if (w.mode === "online" && w.link === "live" && sim.phase !== "lobby") w.notice = "";
			if (w.mode !== "demo" && !sim.paused) {
				if (w.mode === "local") {
					applyHuman(w, 1, dt);
					applyHuman(w, 2, dt);
				} else if (w.mode === "ai") applyHuman(w, 1, dt);
				else if (w.mode === "online") {
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
			if (w.mode === "online" && w.side === 1 && w.link === "live" && w.localReady && w.remoteReady && (sim.phase === "lobby" || sim.phase === "over")) {
				resetMatch(sim);
				w.localReady = false;
				w.remoteReady = false;
			}
			if (w.authority) {
				accum += dt;
				let guard = 0;
				while (accum >= .008333333333333333 && guard++ < 8) {
					const events = tick(sim, STEP);
					accum -= STEP;
					if (!w.silent) for (const ev of events) {
						playSfx(ev);
						if (ev === "paddle") {
							spawnSparks(w.sparks, sim.bx + 6, sim.by + 6);
							w.flash = .12;
						}
					}
					if (w.mode === "demo" && sim.phase !== "play") {
						sim.s1 = 0;
						sim.s2 = 0;
						sim.winner = 0;
						sim.paused = false;
						sim.phase = "play";
						sim.hits = 0;
						sim.bx = 394;
						sim.by = 219;
						sim.vx = (Math.random() < .5 ? 1 : -1) * 300;
						sim.vy = (Math.random() * 2 - 1) * 180;
					}
				}
			} else if (w.mode === "online" && sim.phase === "countdown" && !sim.paused) sim.countdown = Math.max(0, sim.countdown - dt);
			if (w.mode === "online" && w.link === "live" && now - w.lastSend > 50) {
				w.lastSend = now;
				if (w.side === 1) w.broadcast?.({
					t: "snap",
					s: makeSnap(sim, w.seq++)
				});
				else w.broadcast?.({
					t: "pad",
					y: sim.p2
				});
			}
			w.flash = Math.max(0, w.flash - dt);
			stepSparks(w.sparks, dt);
			const ctx = resizeCanvas(canvas);
			if (ctx) {
				let bx = sim.bx;
				let by = sim.by;
				if (w.mode === "online" && w.side === 2 && sim.phase === "play" && !sim.paused && w.snapAt > 0) {
					const age = Math.min(.1, (now - w.snapAt) / 1e3);
					bx = w.snapBx + w.snapVx * age;
					by = clamp(w.snapBy + w.snapVy * age, 0, 438);
				}
				drawCourt(ctx, {
					p1: sim.p1,
					p2: sim.p2,
					bx,
					by,
					phase: sim.phase
				}, w.sparks, w.flash);
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
					link: w.link
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
	const onPointer = (e) => {
		if (!interactive) return;
		unlockAudio();
		const canvas = canvasRef.current;
		const w = worldRef.current;
		if (!canvas || !w || w.sim.paused) return;
		const pt = courtPoint(canvas, e.clientX, e.clientY);
		const which = mode === "local" ? pt.x < .5 ? 1 : 2 : side;
		w.pointers.set(e.pointerId, {
			side: which,
			y: pt.y
		});
		canvas.setPointerCapture(e.pointerId);
	};
	const onPointerEnd = (e) => {
		worldRef.current?.pointers.delete(e.pointerId);
	};
	const pressReady = () => {
		const w = worldRef.current;
		if (!w) return;
		unlockAudio();
		w.localReady = true;
		w.send?.({
			t: "ready",
			v: true,
			epoch: w.sim.epoch
		});
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
	let banner = null;
	if (mode === "online" && !roomJoined) banner = "JOINING ROOM";
	else if (mode === "online" && link === "waiting") banner = hud.notice || "WAITING FOR OPPONENT";
	else if (mode === "online" && link === "connecting") banner = "CONNECTING";
	else if (mode === "online" && link === "reconnecting") banner = "OPPONENT RECONNECTING";
	else if (mode === "online" && link === "failed") banner = "LINK FAILED";
	else if (hud.paused) banner = "PAUSED";
	else if (hud.phase === "over") banner = hud.winner === 1 ? `${names.p1} WINS` : `${names.p2} WINS`;
	const youAre = mode === "online" && link !== "waiting" ? side : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: interactive ? "w-full" : "pointer-events-none absolute inset-0",
		"aria-hidden": interactive ? void 0 : true,
		children: [
			interactive && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 grid grid-cols-[1fr_auto_1fr] items-end gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "truncate font-term text-2xl uppercase leading-none",
							children: names.p1
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-term text-lg uppercase text-dim",
							children: mode === "local" ? "W / S" : youAre === 1 ? "You · P1 · left" : "P1 · left"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "font-pixel text-xl text-fg sm:text-3xl",
						"aria-live": "polite",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								"data-testid": "score-p1",
								children: hud.s1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "px-2 text-dim",
								children: ":"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								"data-testid": "score-p2",
								children: hud.s2
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 text-right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "truncate font-term text-2xl uppercase leading-none",
							children: names.p2
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-term text-lg uppercase text-dim",
							children: mode === "local" ? "Arrows" : youAre === 2 ? "You · P2 · right" : mode === "ai" ? difficulty : "P2 · right"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: interactive ? "court-frame" : "h-full w-full",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative border-2 border-dim bg-bg shadow-glow",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
						ref: canvasRef,
						className: "aspect-video w-full touch-none",
						role: "img",
						"aria-label": "Pong court",
						onPointerDown: onPointer,
						onPointerMove: onPointer,
						onPointerUp: onPointerEnd,
						onPointerCancel: onPointerEnd
					}), interactive && (banner || showCount || showReady) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg/75 px-4 text-center",
						children: [
							banner && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "glow max-w-full font-pixel text-xs uppercase leading-relaxed sm:text-sm",
								children: banner
							}),
							showCount && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "glow font-pixel text-4xl",
								children: countLabel
							}),
							mode === "online" && link === "failed" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pointer-events-auto w-full max-w-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mb-3 font-term text-xl text-dim",
									children: "A strict network can block the direct link. Retry, or switch Wi-Fi."
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn-line",
									onClick: onRetry,
									children: "Retry link"
								})]
							}),
							showReady && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pointer-events-auto w-full max-w-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mb-3 font-term text-xl text-dim",
									children: hud.ready && !hud.oppReady ? "Waiting for opponent" : !hud.ready && hud.oppReady ? "Opponent is ready" : hud.phase === "over" ? "First to 7. Rematch?" : "Both players ready up"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn-fill",
									onClick: pressReady,
									disabled: hud.ready,
									children: hud.phase === "over" ? "Rematch" : "Ready"
								})]
							}),
							hud.paused && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "pointer-events-auto w-full max-w-xs",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn-fill",
									onClick: pressPause,
									children: "Resume"
								})
							})
						]
					})]
				})
			}),
			interactive && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto mt-3 flex w-full max-w-xl flex-col gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-center font-term text-xl uppercase text-dim",
						children: mode === "local" ? "Left drag or W/S · right drag or arrows · space pauses" : mode === "online" ? rtt != null ? `Drag or W/S/arrows · space pauses · ${rtt} ms` : "Drag or W/S/arrows · space pauses" : `Drag or W/S/arrows · space pauses · first to 7`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn-line",
							onClick: pressPause,
							children: hud.paused ? "Resume" : "Pause"
						}), mode === "online" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn-line",
							onClick: onExit,
							children: "Leave"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn-line",
							onClick: pressRestart,
							children: "Restart"
						})]
					}),
					mode !== "online" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-line",
						onClick: onExit,
						children: "Menu"
					}),
					mode === "online" && hud.phase === "over" && !showReady && null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "sr-only",
						"data-testid": "phase",
						children: [
							hud.phase,
							" ",
							sim.winner
						]
					})
				]
			})
		]
	});
}
function togglePause(w) {
	const phase = w.sim.phase;
	if (!(phase === "play" || phase === "countdown" || phase === "point" || w.sim.paused)) return;
	if (w.mode === "online" && w.side !== 1) {
		w.sim.paused = !w.sim.paused;
		w.send?.({ t: "pause" });
		return;
	}
	w.sim.paused = !w.sim.paused;
}
var ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeRoomCode() {
	const bytes = /* @__PURE__ */ new Uint8Array(5);
	crypto.getRandomValues(bytes);
	let code = "";
	for (const b of bytes) code += ALPHABET[b % 32];
	return code;
}
function cleanName(raw) {
	const cleaned = raw.replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 14);
	return cleaned.length > 0 ? cleaned : "PLAYER";
}
function loadName() {
	try {
		return cleanName(localStorage.getItem("pong-name") || "PLAYER");
	} catch {
		return "PLAYER";
	}
}
function saveName(name) {
	try {
		localStorage.setItem("pong-name", cleanName(name));
	} catch {}
}
function inviteUrl(code) {
	const url = new URL(window.location.href);
	url.searchParams.set("room", code);
	url.hash = "";
	return url.toString();
}
function challengeText(url) {
	return `Think you can beat me at PONG.exe? 🏓 Challenge me here: ${url}`;
}
function openShareOnX(url) {
	const href = `https://x.com/intent/tweet?text=${encodeURIComponent(challengeText(url))}`;
	window.open(href, "_blank", "noopener,noreferrer");
}
async function copyText(text) {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		try {
			const el = document.createElement("textarea");
			el.value = text;
			el.setAttribute("readonly", "true");
			el.style.position = "fixed";
			el.style.left = "-9999px";
			document.body.appendChild(el);
			el.select();
			const ok = document.execCommand("copy");
			el.remove();
			return ok;
		} catch {
			return false;
		}
	}
}
function selfId() {
	const key = "pong-self";
	try {
		const existing = sessionStorage.getItem(key);
		if (existing && /^p-[a-z0-9]{6,16}$/.test(existing)) return existing;
		const id = `p-${Math.random().toString(36).slice(2, 10)}`;
		sessionStorage.setItem(key, id);
		return id;
	} catch {
		return `p-${Math.random().toString(36).slice(2, 10)}`;
	}
}
function isHostFlag(code) {
	try {
		return sessionStorage.getItem(`pong-host-${code}`) === "1";
	} catch {
		return false;
	}
}
function markHost(code) {
	try {
		sessionStorage.setItem(`pong-host-${code}`, "1");
	} catch {}
}
/**
* Full-mesh WebRTC rooms: one RTCPeerConnection per remote peer, signaled
* through /api/rtc (see signaling.server.ts), game data flowing directly
* browser-to-browser afterwards. Client-authoritative by construction — see
* the multiplayer-p2p skill for when NOT to use this.
*
* Negotiation follows the "perfect negotiation" pattern: on a glare (both
* sides offering at once) the polite peer — the lexicographically smaller id —
* rolls back and accepts, so pairs converge without wedging.
*/
var FAST_POLL_MS = 400;
var IDLE_POLL_MS = 2e3;
var PING_INTERVAL_MS = 2e3;
var STALL_MS = 1e4;
var MAX_RECOVERY_ATTEMPTS = 3;
var SIGNAL_RETRY_DELAYS_MS = [250, 750];
/** Honor path-based preview hosts so signaling hits this app, not the bare origin. */
function rtcUrl(query) {
	const path = `${typeof window === "undefined" ? "" : previewPathPrefix(window.location.hostname, window.location.pathname) ?? ""}/api/rtc`;
	return query ? `${path}?${query.toString()}` : path;
}
function defaultIceServers() {
	return [{ urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }];
}
var P2PRoom = class {
	opts;
	peers = /* @__PURE__ */ new Map();
	/** Per-remote-peer signal delivery chains (order-preserving). */
	signalQueues = /* @__PURE__ */ new Map();
	cursor = 0;
	pollTimer = null;
	pingTimer = null;
	closed = false;
	everPolled = false;
	lastPeersFingerprint = "";
	constructor(opts) {
		this.opts = opts;
	}
	/**
	* The first poll IS the join: it registers this peer and returns the
	* roster. A failed first poll (cold DB, offline tab) must not strand the
	* room: the loop and timers start regardless and the next poll retries.
	*/
	async join() {
		try {
			await this.pollOnce();
		} catch {}
		if (this.closed) return;
		this.schedulePoll(this.anyPairConnecting() ? FAST_POLL_MS : IDLE_POLL_MS);
		this.pingTimer = setInterval(() => {
			this.pingAll();
			this.watchdog();
		}, PING_INTERVAL_MS);
	}
	close() {
		this.closed = true;
		if (this.pollTimer) clearTimeout(this.pollTimer);
		if (this.pingTimer) clearInterval(this.pingTimer);
		for (const slot of this.peers.values()) slot.pc.close();
		this.peers.clear();
		fetch(rtcUrl(), {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				op: "leave",
				room: this.opts.room,
				peer: this.opts.selfId
			}),
			keepalive: true
		}).catch(() => {});
	}
	/** Send on the unreliable game-state channel (drops stale packets). */
	broadcast(data) {
		const wire = JSON.stringify({
			t: "d",
			d: data
		});
		for (const slot of this.peers.values()) if (slot.state?.readyState === "open") slot.state.send(wire);
	}
	/** Send reliably (ordered) to one peer, or to all when peerId is omitted. */
	send(data, peerId) {
		const wire = JSON.stringify({
			t: "d",
			d: data
		});
		const targets = peerId ? [this.peers.get(peerId)] : [...this.peers.values()];
		for (const slot of targets) if (slot?.reliable?.readyState === "open") slot.reliable.send(wire);
	}
	peerList() {
		return [...this.peers.values()].map((s) => ({ ...s.info }));
	}
	schedulePoll(delay) {
		if (this.closed) return;
		if (this.pollTimer) clearTimeout(this.pollTimer);
		this.pollTimer = setTimeout(() => void this.poll(), delay);
	}
	anyPairConnecting() {
		for (const s of this.peers.values()) {
			if (s.terminal) continue;
			if (s.info.connectionState !== "connected") return true;
		}
		return false;
	}
	async pollOnce() {
		const params = new URLSearchParams({
			room: this.opts.room,
			peer: this.opts.selfId,
			name: this.opts.name ?? "",
			since: String(this.cursor)
		});
		const res = await fetch(rtcUrl(params));
		if (this.closed) return;
		if (!res.ok) throw new Error(`signaling poll failed: ${res.status}`);
		const body = await res.json();
		if (this.closed) return;
		if (!this.everPolled) {
			this.everPolled = true;
			this.opts.onConnected?.();
		}
		this.reconcileRoster(body.peers);
		const roster = new Set(body.peers.map((p) => p.id));
		for (const sig of body.signals) {
			this.cursor = Math.max(this.cursor, sig.id);
			await this.onSignal(sig.from, sig.kind, sig.payload, roster);
			if (this.closed) return;
		}
	}
	async poll() {
		if (this.closed) return;
		try {
			await this.pollOnce();
		} catch {}
		this.schedulePoll(this.anyPairConnecting() ? FAST_POLL_MS : IDLE_POLL_MS);
	}
	reconcileRoster(peers) {
		const alive = new Set(peers.map((p) => p.id));
		for (const p of peers) {
			if (p.id === this.opts.selfId) continue;
			const existing = this.peers.get(p.id);
			if (existing) existing.info.name = p.name;
			else this.connectTo(p.id, p.name, this.opts.selfId > p.id);
		}
		for (const [id, slot] of this.peers) if (!alive.has(id)) {
			slot.pc.close();
			this.peers.delete(id);
		}
		this.emitPeers();
	}
	connectTo(peerId, name, initiator) {
		if (this.closed) return null;
		const pc = new RTCPeerConnection({ iceServers: this.opts.iceServers ?? defaultIceServers() });
		const slot = {
			pc,
			makingOffer: false,
			ignoreOffer: false,
			pendingCandidates: [],
			lastProgressAt: Date.now(),
			recoveryAttempts: 0,
			info: {
				id: peerId,
				name,
				connectionState: pc.connectionState,
				candidateType: null,
				rttMs: null
			}
		};
		this.peers.set(peerId, slot);
		pc.onicecandidate = (e) => {
			if (e.candidate) this.sendSignal(peerId, "ice", e.candidate.toJSON());
		};
		pc.onconnectionstatechange = () => {
			slot.info.connectionState = pc.connectionState;
			if (pc.connectionState === "connecting" || pc.connectionState === "connected") slot.lastProgressAt = Date.now();
			if (pc.connectionState === "connected") {
				slot.recoveryAttempts = 0;
				slot.terminal = false;
				this.readCandidateType(slot);
			}
			this.emitPeers();
			if (pc.connectionState === "failed") pc.restartIce();
			if (pc.connectionState === "failed" || pc.connectionState === "disconnected") this.schedulePoll(FAST_POLL_MS);
		};
		pc.onnegotiationneeded = async () => {
			try {
				slot.makingOffer = true;
				await pc.setLocalDescription();
				await this.sendSignal(peerId, "offer", pc.localDescription.toJSON());
			} catch {} finally {
				slot.makingOffer = false;
			}
		};
		pc.ondatachannel = (e) => this.attachChannel(slot, e.channel);
		if (initiator) {
			this.attachChannel(slot, pc.createDataChannel("state", {
				ordered: false,
				maxRetransmits: 0
			}));
			this.attachChannel(slot, pc.createDataChannel("reliable", { ordered: true }));
		}
		return slot;
	}
	attachChannel(slot, channel) {
		if (channel.label === "state") slot.state = channel;
		else slot.reliable = channel;
		channel.onopen = () => {
			slot.lastProgressAt = Date.now();
		};
		channel.onmessage = (e) => {
			let msg;
			try {
				msg = JSON.parse(e.data);
			} catch {
				return;
			}
			if (msg.t === "ping") {
				if (slot.state?.readyState === "open") slot.state.send(JSON.stringify({ t: "pong" }));
			} else if (msg.t === "pong") {
				if (slot.pingSentAt) {
					slot.info.rttMs = Math.round(performance.now() - slot.pingSentAt);
					slot.pingSentAt = void 0;
					this.emitPeers();
				}
			} else this.opts.onMessage?.(slot.info.id, msg.d, channel.label === "state" ? "state" : "reliable");
		};
	}
	/** Apply buffered ICE candidates once a remote description is in place. */
	async flushPendingCandidates(slot) {
		while (slot.pendingCandidates.length > 0) {
			const candidate = slot.pendingCandidates.shift();
			try {
				await slot.pc.addIceCandidate(candidate);
			} catch (err) {
				if (!slot.ignoreOffer) console.warn("[p2p] addIceCandidate failed:", err);
			}
			if (this.closed) return;
		}
	}
	async onSignal(from, kind, payload, roster) {
		if (this.closed) return;
		let slot = this.peers.get(from);
		if (!slot) {
			if (!roster.has(from)) return;
			const created = this.connectTo(from, "", false);
			if (!created) return;
			slot = created;
		}
		const polite = this.opts.selfId < from;
		try {
			if (kind === "offer" || kind === "answer") {
				const description = payload;
				const collision = kind === "offer" && (slot.makingOffer || slot.pc.signalingState !== "stable");
				slot.ignoreOffer = !polite && collision;
				if (slot.ignoreOffer) return;
				try {
					await slot.pc.setRemoteDescription(description);
				} catch (err) {
					if (kind !== "offer" || slot.recreatedForOffer) throw err;
					const attempts = slot.recoveryAttempts;
					const name = slot.info.name;
					slot.pc.close();
					this.peers.delete(from);
					const fresh = this.connectTo(from, name, false);
					if (!fresh) return;
					fresh.recoveryAttempts = attempts;
					fresh.recreatedForOffer = true;
					slot = fresh;
					await slot.pc.setRemoteDescription(description);
				}
				if (this.closed) return;
				await this.flushPendingCandidates(slot);
				if (this.closed) return;
				if (kind === "offer") {
					await slot.pc.setLocalDescription();
					if (this.closed) return;
					await this.sendSignal(from, "answer", slot.pc.localDescription.toJSON());
				}
			} else if (kind === "ice") {
				const candidate = payload;
				if (!slot.pc.remoteDescription) {
					slot.pendingCandidates.push(candidate);
					return;
				}
				try {
					await slot.pc.addIceCandidate(candidate);
				} catch (err) {
					if (!slot.ignoreOffer) console.warn("[p2p] addIceCandidate failed:", err);
				}
			}
		} catch {}
	}
	/**
	* Signals are serialized per remote peer (a candidate must never overtake
	* its SDP into the DB) and retried on failure with short backoff.
	*/
	sendSignal(to, kind, payload) {
		const next = (this.signalQueues.get(to) ?? Promise.resolve()).then(() => this.postSignal(to, kind, payload));
		this.signalQueues.set(to, next.catch(() => {}));
		return next;
	}
	async postSignal(to, kind, payload) {
		for (let attempt = 0;; attempt++) {
			if (this.closed) return;
			try {
				const res = await fetch(rtcUrl(), {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						op: "signal",
						room: this.opts.room,
						from: this.opts.selfId,
						to,
						kind,
						payload
					})
				});
				if (res.ok) return;
				throw new Error(`signal POST failed: ${res.status}`);
			} catch (err) {
				if (attempt >= SIGNAL_RETRY_DELAYS_MS.length) {
					console.warn(`[p2p] signal ${kind} to ${to} failed after retries`, err);
					return;
				}
				await new Promise((r) => setTimeout(r, SIGNAL_RETRY_DELAYS_MS[attempt]));
			}
		}
	}
	pingAll() {
		const wire = JSON.stringify({ t: "ping" });
		for (const slot of this.peers.values()) {
			if (slot.state?.readyState !== "open") continue;
			const stale = slot.pingSentAt !== void 0 && performance.now() - slot.pingSentAt > 2 * PING_INTERVAL_MS;
			if (slot.pingSentAt === void 0 || stale) {
				slot.pingSentAt = performance.now();
				slot.state.send(wire);
			}
		}
	}
	/**
	* Stuck-pair recovery, piggybacked on the ping interval. A pair that has
	* made no progress for STALL_MS gets rebuilt by the dialer with a FRESH
	* RTCPeerConnection (new DTLS identity — fixes the suspend/resume
	* fingerprint wedge). After MAX_RECOVERY_ATTEMPTS the pair is terminal:
	* visible to the app as its last connectionState, ignored by fast-poll.
	*/
	watchdog() {
		if (this.closed) return;
		const now = Date.now();
		for (const [peerId, slot] of this.peers) {
			const live = slot.pc.connectionState;
			if (live !== slot.info.connectionState) {
				slot.info.connectionState = live;
				if (live === "connecting" || live === "connected") slot.lastProgressAt = now;
				this.emitPeers();
			}
			if (slot.terminal || live === "connected") continue;
			if (now - slot.lastProgressAt <= STALL_MS) continue;
			if (slot.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
				slot.terminal = true;
				this.emitPeers();
				continue;
			}
			slot.recoveryAttempts += 1;
			slot.lastProgressAt = now;
			if (this.opts.selfId > peerId) {
				const { name } = slot.info;
				const attempts = slot.recoveryAttempts;
				slot.pc.close();
				this.peers.delete(peerId);
				const fresh = this.connectTo(peerId, name, true);
				if (fresh) fresh.recoveryAttempts = attempts;
				this.schedulePoll(FAST_POLL_MS);
			}
		}
	}
	async readCandidateType(slot) {
		try {
			const stats = await slot.pc.getStats();
			let selected;
			stats.forEach((s) => {
				if (s.type === "candidate-pair" && s.nominated) selected = s;
			});
			const localId = selected?.localCandidateId;
			if (localId) {
				const local = stats.get(localId);
				slot.info.candidateType = local?.candidateType ?? null;
				this.emitPeers();
			}
		} catch {}
	}
	emitPeers() {
		const list = this.peerList();
		const fingerprint = JSON.stringify(list.map((p) => [
			p.id,
			p.name,
			p.connectionState,
			p.candidateType,
			p.rttMs
		]));
		if (fingerprint === this.lastPeersFingerprint) return;
		this.lastPeersFingerprint = fingerprint;
		this.opts.onPeersChanged?.(list);
	}
};
/**
* React binding for a single Pong room. Identity and room id are captured once
* on mount — remount (key on the room code) to change them.
*/
function usePongRoom(options) {
	const [selfId$1] = (0, import_react.useState)(selfId);
	const [room] = (0, import_react.useState)(options.room);
	const [name] = (0, import_react.useState)(options.name);
	const [peers, setPeers] = (0, import_react.useState)([]);
	const [joined, setJoined] = (0, import_react.useState)(false);
	const roomRef = (0, import_react.useRef)(null);
	const listeners = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	(0, import_react.useEffect)(() => {
		const p2p = new P2PRoom({
			room,
			selfId: selfId$1,
			name,
			onPeersChanged: setPeers,
			onMessage: (from, data, channel) => {
				for (const fn of listeners.current) fn(from, data, channel);
			},
			onConnected: () => setJoined(true)
		});
		roomRef.current = p2p;
		p2p.join();
		return () => {
			roomRef.current = null;
			p2p.close();
		};
	}, [
		room,
		selfId$1,
		name
	]);
	return {
		selfId: selfId$1,
		room,
		peers,
		joined,
		broadcast: (0, import_react.useCallback)((data) => roomRef.current?.broadcast(data), []),
		send: (0, import_react.useCallback)((data, peerId) => roomRef.current?.send(data, peerId), []),
		onMessage: (0, import_react.useCallback)((fn) => {
			listeners.current.add(fn);
			return () => {
				listeners.current.delete(fn);
			};
		}, [])
	};
}
var homeRoute = getRouteApi("/");
function PongApp() {
	const search = homeRoute.useSearch();
	const navigate = useNavigate();
	const [screen, setScreen] = (0, import_react.useState)(() => search.room ? {
		kind: "join",
		code: search.room
	} : { kind: "menu" });
	const [name, setName] = (0, import_react.useState)("PLAYER");
	const [muted, setMutedUi] = (0, import_react.useState)(false);
	const [joinCode, setJoinCode] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		setName(loadName());
		loadMutePref();
		setMutedUi(getMuted());
		const unlock = () => unlockAudio();
		window.addEventListener("pointerdown", unlock);
		window.addEventListener("keydown", unlock);
		const onVis = () => {
			if (document.visibilityState === "visible") resumeAudio();
		};
		document.addEventListener("visibilitychange", onVis);
		return () => {
			window.removeEventListener("pointerdown", unlock);
			window.removeEventListener("keydown", unlock);
			document.removeEventListener("visibilitychange", onVis);
		};
	}, []);
	const goMenu = () => {
		navigate({
			to: "/",
			search: {}
		});
		setScreen({ kind: "menu" });
	};
	const enterOnline = (code, who) => {
		const cleaned = cleanName(who);
		saveName(cleaned);
		setName(cleaned);
		navigate({
			to: "/",
			search: { room: code }
		});
		setScreen({
			kind: "online",
			code,
			name: cleaned,
			attempt: 0
		});
	};
	const challenge = () => {
		unlockAudio();
		const code = makeRoomCode();
		markHost(code);
		enterOnline(code, name);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "shell relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "crt-scan",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "crt-vignette",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-3 flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "text-left",
					onClick: goMenu,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "glow block font-pixel text-xs sm:text-sm",
						children: "PONG.exe"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-term text-xl uppercase tracking-widest text-dim",
						children: "The retro duel"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn-compact",
					"aria-pressed": muted,
					onClick: () => {
						unlockAudio();
						const next = !getMuted();
						setMuted(next);
						setMutedUi(next);
					},
					children: muted ? "Sound off" : "Sound on"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-1 flex-col justify-center",
				children: [
					screen.kind === "menu" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {
						name,
						invalid: search.invalid === true,
						onName: (v) => {
							setName(v);
							saveName(v);
						},
						onChallenge: challenge,
						onOnline: () => {
							unlockAudio();
							setScreen({ kind: "online-setup" });
						},
						onAi: () => {
							unlockAudio();
							setScreen({ kind: "ai" });
						},
						onLocal: () => {
							unlockAudio();
							saveName(name);
							setScreen({ kind: "match-local" });
						},
						onHow: () => setScreen({ kind: "how" })
					}),
					screen.kind === "how" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HowTo, { onBack: () => setScreen({ kind: "menu" }) }),
					screen.kind === "ai" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Picker, {
						title: "Play vs AI",
						onBack: () => setScreen({ kind: "menu" }),
						onPick: (difficulty) => setScreen({
							kind: "match-ai",
							difficulty
						})
					}),
					screen.kind === "online-setup" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OnlineSetup, {
						name,
						code: joinCode,
						onName: (v) => {
							setName(v);
							saveName(v);
						},
						onCode: setJoinCode,
						onCreate: challenge,
						onJoin: () => {
							const code = joinCode.trim().toUpperCase();
							if (!/^[A-Z0-9_-]{4,16}$/.test(code)) return;
							unlockAudio();
							enterOnline(code, name);
						},
						onBack: () => setScreen({ kind: "menu" })
					}),
					screen.kind === "join" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(JoinGate, {
						code: screen.code,
						name,
						onName: (v) => {
							setName(v);
							saveName(v);
						},
						onEnter: () => enterOnline(screen.code, name),
						onBack: goMenu
					}),
					screen.kind === "match-ai" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Court, {
						mode: "ai",
						difficulty: screen.difficulty,
						names: {
							p1: cleanName(name),
							p2: `CPU ${screen.difficulty}`
						},
						onExit: goMenu
					}),
					screen.kind === "match-local" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Court, {
						mode: "local",
						names: {
							p1: cleanName(name),
							p2: "Player 2"
						},
						onExit: goMenu
					}),
					screen.kind === "online" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OnlineMatch, {
						code: screen.code,
						name: screen.name,
						onExit: goMenu,
						onRetry: () => setScreen({
							...screen,
							attempt: screen.attempt + 1
						})
					}, `${screen.code}:${screen.name}:${screen.attempt}`)
				]
			})
		]
	});
}
function Menu({ name, invalid, onName, onChallenge, onOnline, onAi, onLocal, onHow }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "overflow-hidden border-2 border-dim shadow-glow",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative h-44 overflow-hidden sm:h-56",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Court, {
				mode: "demo",
				names: {
					p1: "Demo",
					p2: "Demo"
				}
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-3 px-4 py-5 sm:px-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "glow text-center font-pixel text-lg leading-relaxed sm:text-2xl",
					children: "PONG.exe"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center font-term text-2xl uppercase tracking-widest text-dim",
					children: "Challenge a friend"
				}),
				invalid && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center font-term text-xl uppercase text-fg",
					role: "alert",
					children: "That room link is not valid"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "font-term text-xl uppercase text-dim",
					htmlFor: "player-name",
					children: "Your name"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					id: "player-name",
					value: name,
					maxLength: 14,
					autoComplete: "nickname",
					onChange: (e) => onName(e.target.value),
					className: "field"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn-fill",
					onClick: onChallenge,
					children: "Challenge a friend"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn-line",
					onClick: onOnline,
					children: "Play online"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn-line",
					onClick: onAi,
					children: "Play vs AI"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn-line",
					onClick: onLocal,
					children: "Local 2 player"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn-line",
					onClick: onHow,
					children: "How to play"
				})
			]
		})]
	});
}
function HowTo({ onBack }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-auto flex w-full max-w-xl flex-col gap-4 border-2 border-dim p-4 shadow-glow sm:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "glow font-pixel text-xs sm:text-sm",
				children: "How to play"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "flex flex-col gap-2 font-term text-2xl leading-snug text-fg",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "First player to 7 points wins the duel." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The ball speeds up as a rally goes on. Catch it near the edge of your paddle to bend the angle." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Desktop: W / S or arrow keys. Local two player: W / S on the left, arrows on the right. Space pauses." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Phone: drag on the court. In local play, the left half is player 1 and the right half is player 2." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Online: create a room and share the link. No account. You are player 1 or 2 automatically. Both press Ready. The match runs live between your two browsers." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "If connecting hangs, a locked-down network may be blocking the direct path. Retry or switch networks." })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-line",
				onClick: onBack,
				children: "Back"
			})
		]
	});
}
function Picker({ title, onBack, onPick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-auto flex w-full max-w-md flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "glow text-center font-pixel text-xs sm:text-sm",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-line",
				onClick: () => onPick("easy"),
				children: "Easy"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-line",
				onClick: () => onPick("normal"),
				children: "Normal"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-fill",
				onClick: () => onPick("hard"),
				children: "Hard"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center font-term text-xl uppercase text-dim",
				children: "Hard tracks the ball early and barely misses"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-line",
				onClick: onBack,
				children: "Back"
			})
		]
	});
}
function OnlineSetup({ name, code, onName, onCode, onCreate, onJoin, onBack }) {
	const valid = /^[A-Za-z0-9_-]{4,16}$/.test(code.trim());
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-auto flex w-full max-w-md flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "glow text-center font-pixel text-xs sm:text-sm",
				children: "Play online"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "font-term text-xl uppercase text-dim",
				htmlFor: "online-name",
				children: "Your name"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				id: "online-name",
				value: name,
				maxLength: 14,
				onChange: (e) => onName(e.target.value),
				className: "field"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-fill",
				onClick: onCreate,
				children: "Create room"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "font-term text-xl uppercase text-dim",
				htmlFor: "room-code",
				children: "Or enter a room code"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				id: "room-code",
				value: code,
				maxLength: 16,
				autoCapitalize: "characters",
				autoCorrect: "off",
				spellCheck: false,
				onChange: (e) => onCode(e.target.value.toUpperCase()),
				className: "field",
				placeholder: "ABCDE"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-line",
				disabled: !valid,
				onClick: onJoin,
				children: "Join room"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-line",
				onClick: onBack,
				children: "Back"
			})
		]
	});
}
function JoinGate({ code, name, onName, onEnter, onBack }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-auto flex w-full max-w-md flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center font-term text-2xl uppercase tracking-widest text-dim",
				children: "Incoming challenge"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "glow text-center font-pixel text-lg",
				children: code
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "font-term text-xl uppercase text-dim",
				htmlFor: "join-name",
				children: "Your name"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				id: "join-name",
				value: name,
				maxLength: 14,
				onChange: (e) => onName(e.target.value),
				className: "field"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-fill",
				onClick: onEnter,
				children: "Enter match"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-line",
				onClick: onBack,
				children: "Back"
			})
		]
	});
}
function OnlineMatch({ code, name, onExit, onRetry }) {
	const net = usePongRoom({
		room: code,
		name
	});
	const [seat, setSeat] = (0, import_react.useState)(null);
	const [full, setFull] = (0, import_react.useState)(false);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const seatRef = (0, import_react.useRef)(null);
	seatRef.current = seat;
	(0, import_react.useEffect)(() => {
		return net.onMessage((from, data) => {
			if (!data || typeof data !== "object") return;
			if (data.t !== "full") return;
			if (!seatRef.current || seatRef.current === from) setFull(true);
		});
	}, [net.onMessage, seatRef]);
	(0, import_react.useEffect)(() => {
		if (full) return;
		if (seat && !net.peers.some((p) => p.id === seat)) {
			setSeat(null);
			return;
		}
		if (!seat && net.peers.length > 0) {
			const pick = net.peers.find((p) => p.connectionState === "connected") ?? net.peers[0];
			if (pick) setSeat(pick.id);
		}
		if (seat) {
			for (const p of net.peers) if (p.id !== seat && p.connectionState === "connected") net.send({ t: "full" }, p.id);
		}
	}, [
		full,
		net.peers,
		net.send,
		seat
	]);
	const opp = net.peers.find((p) => p.id === seat) ?? null;
	const side = seat ? net.selfId < seat ? 1 : 2 : 1;
	let link = "waiting";
	if (!net.joined) link = "connecting";
	else if (seat && opp) {
		if (opp.connectionState === "connected") link = "live";
		else if (opp.connectionState === "failed") link = "failed";
		else if (opp.connectionState === "disconnected") link = "reconnecting";
		else link = "connecting";
	} else if (seat) link = "connecting";
	const url = typeof window !== "undefined" ? inviteUrl(code) : "";
	const p1 = side === 1 ? name : opp?.name || "Player 2";
	const p2 = side === 2 ? name : opp?.name || "Player 2";
	const share = async () => {
		unlockAudio();
		const ok = await copyText(inviteUrl(code));
		setCopied(ok);
		window.setTimeout(() => setCopied(false), 1600);
	};
	if (full) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-auto flex w-full max-w-md flex-col gap-3 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "glow font-pixel text-xs",
				children: "Room full"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-term text-2xl text-dim",
				children: "This duel already has two players."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-line",
				onClick: onExit,
				children: "Menu"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-2 border-2 border-dim p-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-pixel text-xs",
						children: ["Room ", code]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-term text-xl uppercase text-dim",
						children: [isHostFlag(code) ? "You opened this room" : "Joined by link", seat ? side === 1 ? " · You are P1" : " · You are P2" : ""]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					readOnly: true,
					value: url,
					"aria-label": "Invite link",
					className: "field text-lg",
					onFocus: (e) => e.currentTarget.select()
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-line",
						onClick: () => void share(),
						children: copied ? "Copied" : "Copy link"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-fill",
						onClick: () => {
							unlockAudio();
							openShareOnX(inviteUrl(code));
						},
						children: "Share on X"
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Court, {
			mode: "online",
			side,
			link: net.joined ? link : "connecting",
			roomJoined: net.joined,
			names: {
				p1,
				p2
			},
			rtt: opp?.rttMs ?? null,
			broadcast: net.broadcast,
			send: net.send,
			onMessage: net.onMessage,
			onExit,
			onRetry
		})]
	});
}
var SplitComponent = PongApp;
//#endregion
export { SplitComponent as component };
