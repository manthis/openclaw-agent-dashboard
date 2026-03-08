import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface ModelOption {
  id: string;
  alias?: string;
}

function readModels(): ModelOption[] {
  try {
    const configPath = path.join(process.env.HOME ?? '/Users/manthis', '.openclaw', 'openclaw.json');
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as {
      agents?: {
        defaults?: {
          models?: Record<string, { alias?: string }>;
        };
      };
    };
    const models = raw.agents?.defaults?.models ?? {};
    return Object.entries(models).map(([id, v]) => ({
      id,
      alias: v.alias,
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  return NextResponse.json(readModels());
}
