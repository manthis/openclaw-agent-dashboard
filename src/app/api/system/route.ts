import { NextResponse } from 'next/server';
import os from 'os';
import { execSync } from 'child_process';

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
    sessions = Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    sessions = 0;
  }

  const loadAvg = os.loadavg()[0];
  const cpuCores = os.cpus().length;
  const cpuPercent = Math.min(100, Math.round((loadAvg / cpuCores) * 100));

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return NextResponse.json({
    gateway: { connected: gatewayConnected },
    sessions,
    cpu: { percent: cpuPercent, loadAvg: loadAvg.toFixed(2) },
    memory: {
      used: usedMem,
      total: totalMem,
      percent: Math.round((usedMem / totalMem) * 100),
    },
    system: {
      hostname: os.hostname(),
      cpuCores,
      platform: `${os.platform()} (${os.arch()})`,
      uptime: Math.floor(process.uptime()),
      nodeVersion: process.version,
    },
  });
}
