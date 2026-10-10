const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeRoomCode(): string {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return code;
}

export function cleanName(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 14);
  return cleaned.length > 0 ? cleaned : "PLAYER";
}

export function loadName(): string {
  try {
    return cleanName(localStorage.getItem("pong-name") || "PLAYER");
  } catch {
    return "PLAYER";
  }
}

export function saveName(name: string) {
  try {
    localStorage.setItem("pong-name", cleanName(name));
  } catch {
    /* ignore */
  }
}

export function inviteUrl(code: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set("room", code);
  url.hash = "";
  return url.toString();
}

export function challengeText(url: string): string {
  return `Think you can beat me at PONG.exe? 🏓 Challenge me here: ${url}`;
}

export function openShareOnX(url: string) {
  const href = `https://x.com/intent/tweet?text=${encodeURIComponent(challengeText(url))}`;
  window.open(href, "_blank", "noopener,noreferrer");
}

export async function copyText(text: string): Promise<boolean> {
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

export function selfId(): string {
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

export function isHostFlag(code: string): boolean {
  try {
    return sessionStorage.getItem(`pong-host-${code}`) === "1";
  } catch {
    return false;
  }
}

export function markHost(code: string) {
  try {
    sessionStorage.setItem(`pong-host-${code}`, "1");
  } catch {
    /* ignore */
  }
}
