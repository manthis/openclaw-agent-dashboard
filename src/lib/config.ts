import 'server-only';
import fs from 'fs';
import path from 'path';

const OPENCLAW_CONFIG = path.join(process.env.HOME ?? '/Users/manthis', '.openclaw', 'openclaw.json');

interface AgentConfig {
  id: string; workspace: string;
  model: { primary: string };
  identity: { name: string; emoji: string; theme: string; avatar: string };
}
export interface OpenClawConfig { agents: { list: AgentConfig[] } }

export function readOpenClawConfig(): OpenClawConfig {
  try { return JSON.parse(fs.readFileSync(OPENCLAW_CONFIG, 'utf-8')) as OpenClawConfig; }
  catch { return { agents: { list: [] } }; }
}
export function fileExists(p: string): boolean {
  try { fs.accessSync(p); return true; } catch { return false; }
}
