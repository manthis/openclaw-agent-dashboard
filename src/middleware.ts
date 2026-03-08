import { NextRequest, NextResponse } from 'next/server';

// SKYNET patch: restrict /api/config to localhost + LAN only
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/config')) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      '127.0.0.1';

    const isLocal =
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip.startsWith('::ffff:127.') ||
      ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[01])\./.test(ip);

    if (!isLocal) {
      return NextResponse.json(
        { error: 'Forbidden: config API is restricted to localhost and LAN' },
        { status: 403 }
      );
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/config', '/api/config/:path*'],
};
