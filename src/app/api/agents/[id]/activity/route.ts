import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const logPath = path.join(os.homedir(), '.openclaw', 'agent-activity-log.json');

  let allData: Record<string, Record<string, number>> = {};
  try {
    const raw = fs.readFileSync(logPath, 'utf-8');
    allData = JSON.parse(raw) as Record<string, Record<string, number>>;
  } catch {
    // file does not exist or invalid JSON
  }

  const agentData = allData[id] ?? {};

  const result: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    result.push({ date: dateStr, count: agentData[dateStr] ?? 0 });
  }

  return NextResponse.json(result);
}
