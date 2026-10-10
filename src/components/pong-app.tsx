import { useEffect, useRef, useState } from "react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { Court, type LinkState } from "@/components/court";
import { loadMutePref, resumeAudio, setMuted, unlockAudio, getMuted } from "@/game/audio";
import type { Difficulty } from "@/game/ai";
import {
  cleanName,
  copyText,
  inviteUrl,
  isHostFlag,
  loadName,
  makeRoomCode,
  markHost,
  openShareOnX,
  saveName,
} from "@/game/share";
import { usePongRoom } from "@/lib/multiplayer/use-pong-room";

const homeRoute = getRouteApi("/");

type Screen =
  | { kind: "menu" }
  | { kind: "how" }
  | { kind: "ai" }
  | { kind: "online-setup" }
  | { kind: "join"; code: string }
  | { kind: "match-ai"; difficulty: Difficulty }
  | { kind: "match-local" }
  | { kind: "online"; code: string; name: string; attempt: number };

export function PongApp() {
  const search = homeRoute.useSearch();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>(() =>
    search.room ? { kind: "join", code: search.room } : { kind: "menu" },
  );
  const [name, setName] = useState("PLAYER");
  const [muted, setMutedUi] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
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
    void navigate({ to: "/", search: {} });
    setScreen({ kind: "menu" });
  };

  const enterOnline = (code: string, who: string) => {
    const cleaned = cleanName(who);
    saveName(cleaned);
    setName(cleaned);
    void navigate({ to: "/", search: { room: code } });
    setScreen({ kind: "online", code, name: cleaned, attempt: 0 });
  };

  const challenge = () => {
    unlockAudio();
    const code = makeRoomCode();
    markHost(code);
    enterOnline(code, name);
  };

  return (
    <div className="shell relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col">
      <div className="crt-scan" aria-hidden="true" />
      <div className="crt-vignette" aria-hidden="true" />
      <header className="mb-3 flex items-center justify-between gap-3">
        <button type="button" className="text-left" onClick={goMenu}>
          <span className="glow block font-pixel text-xs sm:text-sm">PONG.exe</span>
          <span className="font-term text-xl uppercase tracking-widest text-dim">The retro duel</span>
        </button>
        <button
          type="button"
          className="btn-compact"
          aria-pressed={muted}
          onClick={() => {
            unlockAudio();
            const next = !getMuted();
            setMuted(next);
            setMutedUi(next);
          }}
        >
          {muted ? "Sound off" : "Sound on"}
        </button>
      </header>

      <div className="flex flex-1 flex-col justify-center">
        {screen.kind === "menu" && (
          <Menu
            name={name}
            invalid={search.invalid === true}
            onName={(v) => {
              setName(v);
              saveName(v);
            }}
            onChallenge={challenge}
            onOnline={() => {
              unlockAudio();
              setScreen({ kind: "online-setup" });
            }}
            onAi={() => {
              unlockAudio();
              setScreen({ kind: "ai" });
            }}
            onLocal={() => {
              unlockAudio();
              saveName(name);
              setScreen({ kind: "match-local" });
            }}
            onHow={() => setScreen({ kind: "how" })}
          />
        )}

        {screen.kind === "how" && <HowTo onBack={() => setScreen({ kind: "menu" })} />}

        {screen.kind === "ai" && (
          <Picker
            title="Play vs AI"
            onBack={() => setScreen({ kind: "menu" })}
            onPick={(difficulty) => setScreen({ kind: "match-ai", difficulty })}
          />
        )}

        {screen.kind === "online-setup" && (
          <OnlineSetup
            name={name}
            code={joinCode}
            onName={(v) => {
              setName(v);
              saveName(v);
            }}
            onCode={setJoinCode}
            onCreate={challenge}
            onJoin={() => {
              const code = joinCode.trim().toUpperCase();
              if (!/^[A-Z0-9_-]{4,16}$/.test(code)) return;
              unlockAudio();
              enterOnline(code, name);
            }}
            onBack={() => setScreen({ kind: "menu" })}
          />
        )}

        {screen.kind === "join" && (
          <JoinGate
            code={screen.code}
            name={name}
            onName={(v) => {
              setName(v);
              saveName(v);
            }}
            onEnter={() => enterOnline(screen.code, name)}
            onBack={goMenu}
          />
        )}

        {screen.kind === "match-ai" && (
          <Court
            mode="ai"
            difficulty={screen.difficulty}
            names={{ p1: cleanName(name), p2: `CPU ${screen.difficulty}` }}
            onExit={goMenu}
          />
        )}

        {screen.kind === "match-local" && (
          <Court
            mode="local"
            names={{ p1: cleanName(name), p2: "Player 2" }}
            onExit={goMenu}
          />
        )}

        {screen.kind === "online" && (
          <OnlineMatch
            key={`${screen.code}:${screen.name}:${screen.attempt}`}
            code={screen.code}
            name={screen.name}
            onExit={goMenu}
            onRetry={() =>
              setScreen({ ...screen, attempt: screen.attempt + 1 })
            }
          />
        )}
      </div>
    </div>
  );
}

function Menu({
  name,
  invalid,
  onName,
  onChallenge,
  onOnline,
  onAi,
  onLocal,
  onHow,
}: {
  name: string;
  invalid: boolean;
  onName: (v: string) => void;
  onChallenge: () => void;
  onOnline: () => void;
  onAi: () => void;
  onLocal: () => void;
  onHow: () => void;
}) {
  return (
    <div className="overflow-hidden border-2 border-dim shadow-glow">
      <div className="relative h-44 overflow-hidden sm:h-56">
        <Court mode="demo" names={{ p1: "Demo", p2: "Demo" }} />
      </div>
      <div className="flex flex-col gap-3 px-4 py-5 sm:px-8">
          <h1 className="glow text-center font-pixel text-lg leading-relaxed sm:text-2xl">PONG.exe</h1>
          <p className="text-center font-term text-2xl uppercase tracking-widest text-dim">Challenge a friend</p>
          {invalid && (
            <p className="text-center font-term text-xl uppercase text-fg" role="alert">
              That room link is not valid
            </p>
          )}
          <label className="font-term text-xl uppercase text-dim" htmlFor="player-name">
            Your name
          </label>
          <input
            id="player-name"
            value={name}
            maxLength={14}
            autoComplete="nickname"
            onChange={(e) => onName(e.target.value)}
            className="field"
          />
          <button type="button" className="btn-fill" onClick={onChallenge}>
            Challenge a friend
          </button>
          <button type="button" className="btn-line" onClick={onOnline}>
            Play online
          </button>
          <button type="button" className="btn-line" onClick={onAi}>
            Play vs AI
          </button>
          <button type="button" className="btn-line" onClick={onLocal}>
            Local 2 player
          </button>
          <button type="button" className="btn-line" onClick={onHow}>
            How to play
          </button>
      </div>
    </div>
  );
}

function HowTo({ onBack }: { onBack: () => void }) {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-4 border-2 border-dim p-4 shadow-glow sm:p-6">
      <h2 className="glow font-pixel text-xs sm:text-sm">How to play</h2>
      <ul className="flex flex-col gap-2 font-term text-2xl leading-snug text-fg">
        <li>First player to 7 points wins the duel.</li>
        <li>The ball speeds up as a rally goes on. Catch it near the edge of your paddle to bend the angle.</li>
        <li>Desktop: W / S or arrow keys. Local two player: W / S on the left, arrows on the right. Space pauses.</li>
        <li>Phone: drag on the court. In local play, the left half is player 1 and the right half is player 2.</li>
        <li>Online: create a room and share the link. No account. You are player 1 or 2 automatically. Both press Ready. The match runs live between your two browsers.</li>
        <li>If connecting hangs, a locked-down network may be blocking the direct path. Retry or switch networks.</li>
      </ul>
      <button type="button" className="btn-line" onClick={onBack}>
        Back
      </button>
    </section>
  );
}

function Picker({
  title,
  onBack,
  onPick,
}: {
  title: string;
  onBack: () => void;
  onPick: (d: Difficulty) => void;
}) {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-3">
      <h2 className="glow text-center font-pixel text-xs sm:text-sm">{title}</h2>
      <button type="button" className="btn-line" onClick={() => onPick("easy")}>
        Easy
      </button>
      <button type="button" className="btn-line" onClick={() => onPick("normal")}>
        Normal
      </button>
      <button type="button" className="btn-fill" onClick={() => onPick("hard")}>
        Hard
      </button>
      <p className="text-center font-term text-xl uppercase text-dim">Hard tracks the ball early and barely misses</p>
      <button type="button" className="btn-line" onClick={onBack}>
        Back
      </button>
    </section>
  );
}

function OnlineSetup({
  name,
  code,
  onName,
  onCode,
  onCreate,
  onJoin,
  onBack,
}: {
  name: string;
  code: string;
  onName: (v: string) => void;
  onCode: (v: string) => void;
  onCreate: () => void;
  onJoin: () => void;
  onBack: () => void;
}) {
  const valid = /^[A-Za-z0-9_-]{4,16}$/.test(code.trim());
  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-3">
      <h2 className="glow text-center font-pixel text-xs sm:text-sm">Play online</h2>
      <label className="font-term text-xl uppercase text-dim" htmlFor="online-name">
        Your name
      </label>
      <input id="online-name" value={name} maxLength={14} onChange={(e) => onName(e.target.value)} className="field" />
      <button type="button" className="btn-fill" onClick={onCreate}>
        Create room
      </button>
      <label className="font-term text-xl uppercase text-dim" htmlFor="room-code">
        Or enter a room code
      </label>
      <input
        id="room-code"
        value={code}
        maxLength={16}
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        onChange={(e) => onCode(e.target.value.toUpperCase())}
        className="field"
        placeholder="ABCDE"
      />
      <button type="button" className="btn-line" disabled={!valid} onClick={onJoin}>
        Join room
      </button>
      <button type="button" className="btn-line" onClick={onBack}>
        Back
      </button>
    </section>
  );
}

function JoinGate({
  code,
  name,
  onName,
  onEnter,
  onBack,
}: {
  code: string;
  name: string;
  onName: (v: string) => void;
  onEnter: () => void;
  onBack: () => void;
}) {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-3">
      <p className="text-center font-term text-2xl uppercase tracking-widest text-dim">Incoming challenge</p>
      <h2 className="glow text-center font-pixel text-lg">{code}</h2>
      <label className="font-term text-xl uppercase text-dim" htmlFor="join-name">
        Your name
      </label>
      <input id="join-name" value={name} maxLength={14} onChange={(e) => onName(e.target.value)} className="field" />
      <button type="button" className="btn-fill" onClick={onEnter}>
        Enter match
      </button>
      <button type="button" className="btn-line" onClick={onBack}>
        Back
      </button>
    </section>
  );
}

function OnlineMatch({
  code,
  name,
  onExit,
  onRetry,
}: {
  code: string;
  name: string;
  onExit: () => void;
  onRetry: () => void;
}) {
  const net = usePongRoom({ room: code, name });
  const [seat, setSeat] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const [copied, setCopied] = useState(false);
  const seatRef = useRef<string | null>(null);
  seatRef.current = seat;

  useEffect(() => {
    return net.onMessage((from, data) => {
      if (!data || typeof data !== "object") return;
      if ((data as { t?: string }).t !== "full") return;
      if (!seatRef.current || seatRef.current === from) setFull(true);
    });
  }, [net.onMessage, seatRef]);

  useEffect(() => {
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
      for (const p of net.peers) {
        if (p.id !== seat && p.connectionState === "connected") net.send({ t: "full" }, p.id);
      }
    }
  }, [full, net.peers, net.send, seat]);

  const opp = net.peers.find((p) => p.id === seat) ?? null;
  const side: 1 | 2 = seat ? (net.selfId < seat ? 1 : 2) : 1;
  let link: LinkState = "waiting";
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
    const href = inviteUrl(code);
    const ok = await copyText(href);
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 1600);
  };

  if (full) {
    return (
      <section className="mx-auto flex w-full max-w-md flex-col gap-3 text-center">
        <h2 className="glow font-pixel text-xs">Room full</h2>
        <p className="font-term text-2xl text-dim">This duel already has two players.</p>
        <button type="button" className="btn-line" onClick={onExit}>
          Menu
        </button>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 border-2 border-dim p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-pixel text-xs">
            Room {code}
          </p>
          <p className="font-term text-xl uppercase text-dim">
            {isHostFlag(code) ? "You opened this room" : "Joined by link"}
            {seat ? (side === 1 ? " · You are P1" : " · You are P2") : ""}
          </p>
        </div>
        <input readOnly value={url} aria-label="Invite link" className="field text-lg" onFocus={(e) => e.currentTarget.select()} />
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-line" onClick={() => void share()}>
            {copied ? "Copied" : "Copy link"}
          </button>
          <button
            type="button"
            className="btn-fill"
            onClick={() => {
              unlockAudio();
              openShareOnX(inviteUrl(code));
            }}
          >
            Share on X
          </button>
        </div>
      </div>
      <Court
        mode="online"
        side={side}
        link={net.joined ? link : "connecting"}
        roomJoined={net.joined}
        names={{ p1, p2 }}
        rtt={opp?.rttMs ?? null}
        broadcast={net.broadcast}
        send={net.send}
        onMessage={net.onMessage}
        onExit={onExit}
        onRetry={onRetry}
      />
    </div>
  );
}
