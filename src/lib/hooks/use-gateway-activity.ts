"use client";

import { useEffect, useState, useCallback, useRef } from "react";

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

const WS_URL =
  process.env.NEXT_PUBLIC_GATEWAY_WS_URL || "ws://10.0.10.22:18789";
const TOKEN =
  process.env.NEXT_PUBLIC_GATEWAY_TOKEN ||
  "";

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
  // good-enough client id (no crypto dependency)
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useGatewayActivity() {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<GatewayEvent[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const backoffRef = useRef(1000);
  const mountedRef = useRef(true);

  const connectReqIdRef = useRef<string | null>(null);
  const connectSentRef = useRef(false);

  const sendConnect = useCallback((nonce: string | null) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (connectSentRef.current) return;

    connectSentRef.current = true;
    const reqId = uuid();
    connectReqIdRef.current = reqId;

    // Minimal gateway "connect" request.
    // Device auth is currently disabled on the gateway (break-glass), so we omit
    // `device` signing and just provide the gateway token.
    const params = {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: "openclaw-agent-dashboard",
        version: "dev",
        platform: typeof navigator !== "undefined" ? navigator.platform : "web",
        mode: "ui",
        instanceId: uuid(),
      },
      role: "operator",
      scopes: ["operator.admin"],
      caps: [],
      auth: TOKEN ? { token: TOKEN } : undefined,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      locale: typeof navigator !== "undefined" ? navigator.language : "en",
      // nonce is carried via the challenge event + device signing in the full protocol.
      // We keep it here for traceability even if device auth is disabled.
      nonce: nonce || undefined,
    };

    const frame: GatewayFrame = { type: "req", id: reqId, method: "connect", params };
    ws.send(JSON.stringify(frame));
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // reset handshake state
    connectReqIdRef.current = null;
    connectSentRef.current = false;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        // wait for connect.challenge; if it doesn't arrive, we'll still attempt
        // connect after a short delay.
        window.setTimeout(() => sendConnect(null), 750);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data) as GatewayFrame;

          if (msg.type === "event") {
            // Handshake challenge
            if (msg.event === "connect.challenge") {
              const nonce = (msg.payload as { nonce?: unknown } | undefined)?.nonce;
              sendConnect(typeof nonce === "string" ? nonce : null);
              return;
            }

            // Normal gateway events
            const ge: GatewayEvent = {
              id: uuid(),
              type: msg.event || "event",
              timestamp: new Date().toISOString(),
              summary: makeSummary(msg.event || "event", msg.payload),
              raw: msg,
            };
            setEvents((prev) => [...prev.slice(-49), ge]);
            return;
          }

          if (msg.type === "res") {
            const isConnectRes =
              !!connectReqIdRef.current && msg.id === connectReqIdRef.current;

            if (isConnectRes) {
              setConnected(Boolean(msg.ok));
              return;
            }

            return;
          }
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
  }, [sendConnect]);

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
