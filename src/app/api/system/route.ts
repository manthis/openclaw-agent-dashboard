import { NextResponse } from 'next/server';
import os from 'os';
import { execSync } from 'child_process';
import { getSystemSnapshot } from '@/lib/systemSnapshot';

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';

export async function GET() {
  // “Connected” should reflect that the OpenClaw gateway is not only reachable,
  // but that the RPC probe succeeds (i.e. WS handshake + auth works).
  // Prefer `openclaw gateway status --json` (authoritative on the host) and
  // fall back to a simple HTTP reachability check.
  let gatewayConnected = false;
  try {
    const out = execSync('openclaw gateway status --json 2>/dev/null', { timeout: 5000 }).toString();
    const parsed = JSON.parse(out.trim()) as { rpc?: { ok?: boolean } };
    gatewayConnected = Boolean(parsed?.rpc?.ok);
  } catch {
    try {
      const res = await fetch(GATEWAY_URL, { method: 'GET', signal: AbortSignal.timeout(2000) });
      gatewayConnected = res.ok;
    } catch {}
  }

  let sessions = 0;
  try {
    const output = execSync('openclaw sessions --active 5 --json 2>/dev/null || echo "[]"', { timeout: 5000 }).toString();
    const parsed = JSON.parse(output.trim());
    if (Array.isArray(parsed)) sessions = parsed.length;
    else if (parsed && typeof parsed === "object" && typeof parsed.count === "number") sessions = parsed.count;
    else if (parsed && Array.isArray(parsed.sessions)) sessions = parsed.sessions.length;
    else sessions = 0;
  } catch {
    sessions = 0;
  }

  const snapshot = getSystemSnapshot();
  const cpuCores = os.cpus().length;

  return NextResponse.json({
    gateway: { connected: gatewayConnected },
    sessions,
    cpu: snapshot.cpu,
    memory: snapshot.memory,
    system: {
      hostname: os.hostname(),
      cpuCores,
      platform: `${os.platform()} (${os.arch()})`,
      uptime: Math.floor(process.uptime()),
      nodeVersion: process.version,
    },
  });
}
