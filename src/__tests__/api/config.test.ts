import { NextResponse } from 'next/server';

// Mock fs before importing route
jest.mock('fs');
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data: unknown, init?: ResponseInit) => ({ data, status: init?.status ?? 200 })),
  },
}));

import fs from 'fs';
import { GET, PUT } from '@/app/api/config/route';

const mockFs = fs as jest.Mocked<typeof fs>;

describe('GET /api/config', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns config JSON when file exists', async () => {
    (mockFs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ key: 'value' }));
    const res = await GET();
    expect((res as any).data).toEqual({ data: { key: 'value' } });
    expect((res as any).status).toBe(200);
  });

  it('returns 500 if file read fails', async () => {
    (mockFs.readFileSync as jest.Mock).mockImplementation(() => { throw new Error('not found'); });
    const res = await GET();
    expect((res as any).status).toBe(500);
    expect((res as any).data.error).toMatch('not found');
  });
});

describe('PUT /api/config', () => {
  beforeEach(() => jest.clearAllMocks());

  const makeRequest = (body: unknown, headers: Record<string, string> = {}) => ({
    headers: { get: (k: string) => headers[k] ?? null },
    json: async () => body,
  } as unknown as Request);

  it('returns 413 if content-length exceeds limit', async () => {
    const req = makeRequest({}, { 'content-length': String(600 * 1024) });
    const res = await PUT(req);
    expect((res as any).status).toBe(413);
  });

  it('returns 400 if body has no data field', async () => {
    const req = makeRequest({ notdata: {} });
    const res = await PUT(req);
    expect((res as any).status).toBe(400);
  });

  it('returns 400 if data is null', async () => {
    const req = makeRequest({ data: null });
    const res = await PUT(req);
    expect((res as any).status).toBe(400);
  });

  it('returns 400 if data is an array', async () => {
    const req = makeRequest({ data: [1, 2, 3] });
    const res = await PUT(req);
    expect((res as any).status).toBe(400);
  });

  it('creates backup and writes file on success', async () => {
    (mockFs.existsSync as jest.Mock).mockReturnValue(true);
    (mockFs.copyFileSync as jest.Mock).mockImplementation(() => {});
    (mockFs.writeFileSync as jest.Mock).mockImplementation(() => {});
    const req = makeRequest({ data: { foo: 'bar' } });
    const res = await PUT(req);
    expect((res as any).status).toBe(200);
    expect((res as any).data).toEqual({ success: true });
    expect(mockFs.copyFileSync).toHaveBeenCalled();
    expect(mockFs.writeFileSync).toHaveBeenCalled();
  });

  it('does not create backup if file does not exist', async () => {
    (mockFs.existsSync as jest.Mock).mockReturnValue(false);
    (mockFs.writeFileSync as jest.Mock).mockImplementation(() => {});
    const req = makeRequest({ data: { a: 1 } });
    await PUT(req);
    expect(mockFs.copyFileSync).not.toHaveBeenCalled();
  });
});
