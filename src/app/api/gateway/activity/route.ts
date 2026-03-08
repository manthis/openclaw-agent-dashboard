import WebSocket from 'ws';

export const runtime = 'nodejs';

type GatewayFrame =
  | { type: 'event'; event?: string; payload?: unknown; seq?: number }
  | { type: 'res'; id?: string; ok?: boolean; payload?: unknown; error?: unknown }
  | { type: 'req'; id: string; method: string; params?: unknown };

const GATEWAY_WS_URL =
  process.env.GATEWAY_WS_URL ||
  process.env.NEXT_PUBLIC_GATEWAY_WS_URL ||
  'ws://127.0.0.1:18789';

const TOKEN = process.env.GATEWAY_TOKEN || process.env.NEXT_PUBLIC_GATEWAY_TOKEN || '';

function uuid(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function GET() {
  const encoder = new TextEncoder();

  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const safeClose = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // If the controller is already closed, stop writing.
          closed = true;
        }
      };

      const ws = new WebSocket(GATEWAY_WS_URL);

      const connectReqId = uuid();
      const connectFrame: GatewayFrame = {
        type: 'req',
        id: connectReqId,
        method: 'connect',
        params: {
          minProtocol: 3,
          maxProtocol: 3,
          client: {
            id: 'openclaw-control-ui',
            version: 'dev',
            platform: 'server',
            mode: 'webchat',
            instanceId: uuid(),
          },
          role: 'operator',
          scopes: ['operator.admin', 'operator.approvals', 'operator.pairing'],
          caps: [],
          auth: TOKEN ? { token: TOKEN } : undefined,
          userAgent: 'openclaw-agent-dashboard (sse-proxy)',
          locale: 'en',
        },
      };

      const heartbeat = setInterval(() => {
        send('ping', { ts: Date.now() });
      }, 15000);

      ws.on('open', () => {
        send('status', { phase: 'ws_open' });
        ws.send(JSON.stringify(connectFrame));
      });

      ws.on('message', (buf) => {
        const raw = buf.toString();
        let msg: GatewayFrame | null = null;
        try {
          msg = JSON.parse(raw) as GatewayFrame;
        } catch {
          send('error', { message: 'invalid json from gateway' });
          return;
        }

        if (msg.type === 'res' && msg.id === connectReqId) {
          if (msg.ok) send('connected', { ok: true });
          else send('connected', { ok: false, error: msg.error ?? 'connect failed' });
          return;
        }

        if (msg.type === 'event') {
          send('gateway_event', msg);
        }
      });

      ws.on('close', (code, reason) => {
        send('status', { phase: 'ws_close', code, reason: reason?.toString?.() });
        clearInterval(heartbeat);
        safeClose();
      });

      ws.on('error', (err) => {
        send('error', { message: String(err) });
        try {
          ws.close();
        } catch {
          // ignore
        }
      });

      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        try {
          ws.close();
        } catch {
          // ignore
        }
        safeClose();
      };
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
