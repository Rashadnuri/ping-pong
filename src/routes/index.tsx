import { createFileRoute } from "@tanstack/react-router";
import { PongApp } from "@/components/pong-app";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = search.room;
    if (typeof raw !== "string" || raw.length === 0) return {};
    if (/^[A-Za-z0-9_-]{1,16}$/.test(raw)) return { room: raw.toUpperCase() };
    return { invalid: true as const };
  },
  component: PongApp,
});
