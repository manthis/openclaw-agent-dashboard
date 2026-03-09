import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const ACTIVITY_FILE = path.join(os.homedir(), '.openclaw', 'agent-activity.json');

function readActivity(): Record<string, 'active' | 'idle'> {
  try {
    const raw = fs.readFileSync(ACTIVITY_FILE, 'utf-8');
    return JSON.parse(raw) as Record<string, 'active' | 'idle'>;
  } catch {
    return {};
  }
}

function writeActivity(data: Record<string, 'active' | 'idle'>): void {
  const dir = path.dirname(ACTIVITY_FILE);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function setAgentActivity(agentId: string, status: 'active' | 'idle'): void {
  const data = readActivity();
  data[agentId] = status;
  writeActivity(data);
}

export function clearAllAgentActivity(): void {
  writeActivity({});
}
