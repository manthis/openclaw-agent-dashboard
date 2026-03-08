"use client";

import { useEffect, useState, useRef } from "react";

export interface GatewayEvent {
  id: string;
  type: string;
  timestamp: string;
  summary: string;
  raw: unknown;
}

type GatewayFrame =
  | { type: "event"; event?: string; payload?: unknown; seq?: number }
  | { type: "res"; id?: string; ok?: boolean; payload?: unknown; error?: unknown }
  | { type: "req"; id: string; method: string; params?: unknown };

function makeSummary(type: string, data: unknown): string {
  const d = data as Record<string, unknown> | null;
  switch (type) {
    case "session_created":
      return `Session created: ${d?.agent || d?.id || "unknown"}`;
    case "session_closed":
      return `Session closed: ${d?.agent || d?.id || "unknown"}`;
    case "message_in":
      return `Message in from ${d?.channel || d?.from || "unknown"}`;
    case "message_out":
      return `Message out to ${d?.channel || d?.to || "unknown"}`;
    case "status":
      return `Status update`;
    case "pong":
      return "Pong";
    default:
      return `${type}: ${JSON.stringify(data).slice(0, 80)}`;
  }
}

function uuid(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useGatewayActivity() {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<GatewayEvent[]>([]);
  const mountedRef = useRef(true);

  // Seed from history on mount
  useEffect(() => {
    fetch('/api/gateway/events/history?limit=100')
      .then((r) => r.ok ? r.json() : null)
      .then((data: { events?: Array<{ id: number; ts: number; type: string; summary: string; raw: string }> } | null) => {
        if (!mountedRef.current || !data?.events?.length) return;
        const seeded: GatewayEvent[] = data.events.map((e) => ({
          id: `hist-${e.id}`,
          type: e.type,
          timestamp: new Date(e.ts).toISOString(),
          summary: e.summary,
          raw: (() => { try { return JSON.parse(e.raw); } catch { return e.raw; } })(),
        }));
        // history comes newest-first from DB
        setEvents(seeded);
      })
      .catch(() => { /* non-fatal */ });
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // same-origin SSE proxy so mobile clients don't need direct access
    const es = new EventSource("/api/gateway/activity");

    es.addEventListener("connected", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as { ok?: boolean };
        if (!mountedRef.current) return;
        setConnected(Boolean(data?.ok));
      } catch {
        if (!mountedRef.current) return;
        setConnected(false);
      }
    });

    es.addEventListener("gateway_event", (e) => {
      if (!mountedRef.current) return;
      try {
        const frame = JSON.parse((e as MessageEvent).data) as GatewayFrame;
        if (frame.type !== "event") return;
        const ge: GatewayEvent = {
          id: uuid(),
          type: frame.event || "event",
          timestamp: new Date().toISOString(),
          summary: makeSummary(frame.event || "event", frame.payload),
          raw: frame,
        };
        // newest first, cap at 200
        setEvents((prev) => [ge, ...prev].slice(0, 200));
      } catch {
        // ignore
      }
    });

    es.onerror = () => {
      if (!mountedRef.current) return;
      setConnected(false);
    };

    return () => {
      mountedRef.current = false;
      es.close();
    };
  }, []);

  return { connected, events };
}
