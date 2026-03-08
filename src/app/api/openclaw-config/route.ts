import { NextResponse } from 'next/server';

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';

export async function HEAD() {
  try {
    const res = await fetch(GATEWAY_URL, { method: 'GET', signal: AbortSignal.timeout(2000) });
    if (res.ok) return new NextResponse(null, { status: 200 });
    return new NextResponse(null, { status: 503 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}

export async function GET() {
  try {
    const res = await fetch(GATEWAY_URL, { method: 'GET', signal: AbortSignal.timeout(2000) });
    if (res.ok) return NextResponse.json({ connected: true });
    return NextResponse.json({ connected: false }, { status: 503 });
  } catch {
    return NextResponse.json({ connected: false }, { status: 503 });
  }
}
