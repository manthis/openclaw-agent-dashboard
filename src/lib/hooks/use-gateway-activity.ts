"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export interface GatewayEvent {
  id: string;
  type: string;
  timestamp: string;
  summary: string;
  raw: unknown;
}

const WS_URL =
  process.env.NEXT_PUBLIC_GATEWAY_WS_URL || "ws://10.0.10.22:18789";
const TOKEN =
  process.env.NEXT_PUBLIC_GATEWAY_TOKEN ||
  "af16f36671aa87373c4e5bba68564ae14ce27e72125bdc71";

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

export function useGatewayActivity() {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<GatewayEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const backoffRef = useRef(1000);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setConnected(true);
        backoffRef.current = 1000;
        ws.send(JSON.stringify({ type: "auth", token: TOKEN }));
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "pong") return;
          const ge: GatewayEvent = {
            id: `${Date.now()}-${Math.random()}`,
            type: msg.type || "unknown",
            timestamp: new Date().toISOString(),
            summary: makeSummary(msg.type, msg.data),
            raw: msg,
          };
          setEvents((prev) => [...prev.slice(-49), ge]);
        } catch {
          /* ignore */
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        wsRef.current = null;
        const delay = backoffRef.current;
        backoffRef.current = Math.min(delay * 2, 30000);
        reconnectTimer.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      const delay = backoffRef.current;
      backoffRef.current = Math.min(delay * 2, 30000);
      reconnectTimer.current = setTimeout(connect, delay);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected, events };
}
