'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Save, Loader2, AlertCircle,
  FileText, Shield, Box, Cpu, Settings2,
  Wrench, Server, MessageSquare, Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionCard } from './SectionCard';
import { StringArrayEditor } from './StringArrayEditor';
import { KeyValueEditor } from './KeyValueEditor';
import { DynamicMapEditor } from './DynamicMapEditor';
import { PasswordField } from './PasswordField';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type JsonObject = Record<string, unknown>;

function getPath(obj: JsonObject, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as JsonObject)[key];
    }
    return undefined;
  }, obj);
}

function setPath(obj: JsonObject, path: string, value: unknown): JsonObject {
  const clone = structuredClone(obj);
  const keys = path.split('.');
  let cur: JsonObject = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in cur) || typeof cur[k] !== 'object' || cur[k] === null || Array.isArray(cur[k])) {
      cur[k] = {};
    }
    cur = cur[k] as JsonObject;
  }
  cur[keys[keys.length - 1]] = value;
  return clone;
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' ? v : fallback;
}

function asBool(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  return [];
}

function asStringRecord(v: unknown): Record<string, string> {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const out: Record<string, string> = {};
    for (const [k, val] of Object.entries(v as JsonObject)) {
      out[k] = String(val ?? '');
    }
    return out;
  }
  return {};
}

function asObjectRecord(v: unknown): Record<string, Record<string, unknown>> {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const out: Record<string, Record<string, unknown>> = {};
    for (const [k, val] of Object.entries(v as JsonObject)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        out[k] = val as Record<string, unknown>;
      }
    }
    return out;
  }
  return {};
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------
function TextField({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
      />
    </div>
  );
}

function NumberField({ label, value, onChange, min, max, step }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-slate-400">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({ label, value, onChange }: {
  label: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-slate-400">{label}</label>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-indigo-500' : 'bg-slate-700'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function LoggingSection({ config, update }: { config: JsonObject; update: (path: string, v: unknown) => void }) {
  return (
    <SectionCard title="Logging" icon={<FileText className="w-4 h-4 text-indigo-400" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField label="Level" value={asString(getPath(config, 'logging.level'), 'info')} onChange={(v) => update('logging.level', v)} options={['trace', 'debug', 'info', 'warn', 'error', 'fatal']} />
        <TextField label="Log File" value={asString(getPath(config, 'logging.file'))} onChange={(v) => update('logging.file', v)} />
        <SelectField label="Console Level" value={asString(getPath(config, 'logging.consoleLevel'), 'info')} onChange={(v) => update('logging.consoleLevel', v)} options={['trace', 'debug', 'info', 'warn', 'error', 'fatal']} />
        <SelectField label="Console Style" value={asString(getPath(config, 'logging.consoleStyle'), 'pretty')} onChange={(v) => update('logging.consoleStyle', v)} options={['pretty', 'json', 'compact']} />
        <SelectField label="Redact Sensitive" value={asString(getPath(config, 'logging.redactSensitive'), 'tools')} onChange={(v) => update('logging.redactSensitive', v)} options={['off', 'tools', 'all']} />
      </div>
      <StringArrayEditor label="Redact Patterns" value={asStringArray(getPath(config, 'logging.redactPatterns'))} onChange={(v) => update('logging.redactPatterns', v)} />
    </SectionCard>
  );
}

function AuthSection({ config, update }: { config: JsonObject; update: (path: string, v: unknown) => void }) {
  return (
    <SectionCard title="Auth Profiles" icon={<Shield className="w-4 h-4 text-indigo-400" />}>
      <DynamicMapEditor label="Profiles" value={asObjectRecord(getPath(config, 'auth.profiles'))} onChange={(v) => update('auth.profiles', v)} />
    </SectionCard>
  );
}

function EnvironmentSection({ config, update }: { config: JsonObject; update: (path: string, v: unknown) => void }) {
  return (
    <SectionCard title="Environment" icon={<Box className="w-4 h-4 text-indigo-400" />}>
      <KeyValueEditor label="Environment Variables" value={asStringRecord(getPath(config, 'env.vars'))} onChange={(v) => update('env.vars', v)} keyPlaceholder="VAR_NAME" valuePlaceholder="value" />
      <ToggleField label="Shell Env Enabled" value={asBool(getPath(config, 'env.shellEnv.enabled'))} onChange={(v) => update('env.shellEnv.enabled', v)} />
      <NumberField label="Shell Env Timeout (ms)" value={asNumber(getPath(config, 'env.shellEnv.timeoutMs'), 5000)} onChange={(v) => update('env.shellEnv.timeoutMs', v)} min={0} />
    </SectionCard>
  );
}

function ModelsSection({ config, update }: { config: JsonObject; update: (path: string, v: unknown) => void }) {
  return (
    <SectionCard title="Models" icon={<Cpu className="w-4 h-4 text-indigo-400" />}>
      <DynamicMapEditor label="Providers" value={asObjectRecord(getPath(config, 'models.providers'))} onChange={(v) => update('models.providers', v)} />
    </SectionCard>
  );
}

function AgentDefaultsSection({ config, update }: { config: JsonObject; update: (path: string, v: unknown) => void }) {
  const base = 'agents.defaults';
  return (
    <SectionCard title="Agent Defaults" icon={<Settings2 className="w-4 h-4 text-indigo-400" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="Workspace" value={asString(getPath(config, `${base}.workspace`))} onChange={(v) => update(`${base}.workspace`, v)} />
        <NumberField label="Context Tokens" value={asNumber(getPath(config, `${base}.contextTokens`), 200000)} onChange={(v) => update(`${base}.contextTokens`, v)} min={0} />
        <NumberField label="Timeout (seconds)" value={asNumber(getPath(config, `${base}.timeoutSeconds`), 1800)} onChange={(v) => update(`${base}.timeoutSeconds`, v)} min={0} />
        <NumberField label="Max Concurrent" value={asNumber(getPath(config, `${base}.maxConcurrent`), 4)} onChange={(v) => update(`${base}.maxConcurrent`, v)} min={1} />
        <SelectField label="Compaction Mode" value={asString(getPath(config, `${base}.compaction.mode`), 'safeguard')} onChange={(v) => update(`${base}.compaction.mode`, v)} options={['off', 'safeguard', 'aggressive']} />
        <SelectField label="Sandbox Mode" value={asString(getPath(config, `${base}.sandbox.mode`), 'all')} onChange={(v) => update(`${base}.sandbox.mode`, v)} options={['off', 'all', 'tools']} />
      </div>
      <DynamicMapEditor label="Model Configurations" value={asObjectRecord(getPath(config, `${base}.models`))} onChange={(v) => update(`${base}.models`, v)} />
    </SectionCard>
  );
}

function AgentToolsSection({ config, update }: { config: JsonObject; update: (path: string, v: unknown) => void }) {
  const base = 'tools';
  return (
    <SectionCard title="Tools" icon={<Wrench className="w-4 h-4 text-indigo-400" />}>
      <ToggleField label="Web Search Enabled" value={asBool(getPath(config, `${base}.web.search.enabled`), true)} onChange={(v) => update(`${base}.web.search.enabled`, v)} />
      <ToggleField label="Web Fetch Enabled" value={asBool(getPath(config, `${base}.web.fetch.enabled`), true)} onChange={(v) => update(`${base}.web.fetch.enabled`, v)} />
      <ToggleField label="Agent-to-Agent Enabled" value={asBool(getPath(config, `${base}.agentToAgent.enabled`), true)} onChange={(v) => update(`${base}.agentToAgent.enabled`, v)} />
      <StringArrayEditor label="Agent-to-Agent Allow List" value={asStringArray(getPath(config, `${base}.agentToAgent.allow`))} onChange={(v) => update(`${base}.agentToAgent.allow`, v)} />
      <ToggleField label="Loop Detection Enabled" value={asBool(getPath(config, `${base}.loopDetection.enabled`), true)} onChange={(v) => update(`${base}.loopDetection.enabled`, v)} />
      <NumberField label="Exec Timeout (seconds)" value={asNumber(getPath(config, `${base}.exec.timeoutSec`), 120)} onChange={(v) => update(`${base}.exec.timeoutSec`, v)} min={1} />
      <DynamicMapEditor label="By Provider Overrides" value={asObjectRecord(getPath(config, `${base}.byProvider`))} onChange={(v) => update(`${base}.byProvider`, v)} />
    </SectionCard>
  );
}

function GatewaySection({ config, update }: { config: JsonObject; update: (path: string, v: unknown) => void }) {
  const base = 'gateway';
  return (
    <SectionCard title="Gateway" icon={<Server className="w-4 h-4 text-indigo-400" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField label="Mode" value={asString(getPath(config, `${base}.mode`), 'local')} onChange={(v) => update(`${base}.mode`, v)} options={['local', 'remote', 'tunnel']} />
        <SelectField label="Bind" value={asString(getPath(config, `${base}.bind`), 'loopback')} onChange={(v) => update(`${base}.bind`, v)} options={['loopback', 'all']} />
        <NumberField label="Port" value={asNumber(getPath(config, `${base}.port`), 18789)} onChange={(v) => update(`${base}.port`, v)} min={1} max={65535} />
        <ToggleField label="Control UI Enabled" value={asBool(getPath(config, `${base}.controlUi.enabled`), true)} onChange={(v) => update(`${base}.controlUi.enabled`, v)} />
      </div>
      <SelectField label="Auth Mode" value={asString(getPath(config, `${base}.auth.mode`), 'token')} onChange={(v) => update(`${base}.auth.mode`, v)} options={['none', 'token', 'bearer']} />
      <PasswordField label="Auth Token" value={asString(getPath(config, `${base}.auth.token`))} onChange={(v) => update(`${base}.auth.token`, v)} />
      <StringArrayEditor label="Denied Node Commands" value={asStringArray(getPath(config, `${base}.nodes.denyCommands`))} onChange={(v) => update(`${base}.nodes.denyCommands`, v)} />
    </SectionCard>
  );
}

function ChannelsSection({ config, update }: { config: JsonObject; update: (path: string, v: unknown) => void }) {
  return (
    <SectionCard title="Channels" icon={<MessageSquare className="w-4 h-4 text-indigo-400" />}>
      <h4 className="text-sm font-medium text-slate-300">Telegram</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ToggleField label="Enabled" value={asBool(getPath(config, 'channels.telegram.enabled'), true)} onChange={(v) => update('channels.telegram.enabled', v)} />
        <SelectField label="Streaming" value={asString(getPath(config, 'channels.telegram.streaming'), 'partial')} onChange={(v) => update('channels.telegram.streaming', v)} options={['off', 'partial', 'full']} />
        <SelectField label="DM Policy" value={asString(getPath(config, 'channels.telegram.dmPolicy'), 'pairing')} onChange={(v) => update('channels.telegram.dmPolicy', v)} options={['pairing', 'open', 'deny']} />
        <SelectField label="Group Policy" value={asString(getPath(config, 'channels.telegram.groupPolicy'), 'allowlist')} onChange={(v) => update('channels.telegram.groupPolicy', v)} options={['allowlist', 'denylist', 'open']} />
      </div>
      <PasswordField label="Bot Token" value={asString(getPath(config, 'channels.telegram.botToken'))} onChange={(v) => update('channels.telegram.botToken', v)} />
    </SectionCard>
  );
}

function SecuritySection({ config, update }: { config: JsonObject; update: (path: string, v: unknown) => void }) {
  return (
    <SectionCard title="Security" icon={<Lock className="w-4 h-4 text-indigo-400" />}>
      <StringArrayEditor label="Allowed Origins" value={asStringArray(getPath(config, 'security.allowedOrigins'))} onChange={(v) => update('security.allowedOrigins', v)} />
      <StringArrayEditor label="Trusted Proxies" value={asStringArray(getPath(config, 'security.trustedProxies'))} onChange={(v) => update('security.trustedProxies', v)} />
      <TextField label="Max Body Size" value={asString(getPath(config, 'security.maxBodySize'), '1mb')} onChange={(v) => update('security.maxBodySize', v)} />
      <ToggleField label="Elevated Commands Enabled" value={asBool(getPath(config, 'tools.elevated.enabled'), true)} onChange={(v) => update('tools.elevated.enabled', v)} />
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
const TABS = [
  { id: 'logging', label: 'Logging', icon: FileText },
  { id: 'auth', label: 'Auth', icon: Shield },
  { id: 'environment', label: 'Environment', icon: Box },
  { id: 'models', label: 'Models', icon: Cpu },
  { id: 'defaults', label: 'Agent Defaults', icon: Settings2 },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'gateway', label: 'Gateway', icon: Server },
  { id: 'channels', label: 'Channels', icon: MessageSquare },
  { id: 'security', label: 'Security', icon: Lock },
] as const;

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function ConfigPageClient() {
  const [config, setConfig] = useState<JsonObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('logging');
  const originalRef = useRef<string>('');

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((json: { data?: JsonObject; error?: string }) => {
        if (json.error) {
          setError(json.error);
        } else if (json.data) {
          setConfig(json.data);
          originalRef.current = JSON.stringify(json.data);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const update = useCallback((path: string, value: unknown) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const next = setPath(prev, path, value);
      setDirty(JSON.stringify(next) !== originalRef.current);
      return next;
    });
  }, []);

  const save = useCallback(async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: config }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (json.success) {
        originalRef.current = JSON.stringify(config);
        setDirty(false);
        showToast('Configuration saved successfully', 'success');
      } else {
        showToast(json.error ?? 'Failed to save', 'error');
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Network error', 'error');
    } finally {
      setSaving(false);
    }
  }, [config, showToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-red-400">
        <AlertCircle className="w-5 h-5" />
        <span>{error ?? 'Failed to load config'}</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-neutral-950 py-3 -mt-3 -mx-1 px-1">
        <div>
          <h1 className="text-xl font-semibold text-white">Configuration</h1>
          <p className="text-sm text-slate-400">Edit openclaw.json settings</p>
        </div>
        <div className="flex items-center gap-3">
          {dirty && (
            <span className="text-xs text-amber-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Unsaved changes
            </span>
          )}
          <Button
            onClick={save}
            disabled={saving || !dirty}
            className="bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-800 pb-px">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === id
                ? 'bg-slate-800 text-indigo-300 border-b-2 border-indigo-500'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'logging' && <LoggingSection config={config} update={update} />}
        {activeTab === 'auth' && <AuthSection config={config} update={update} />}
        {activeTab === 'environment' && <EnvironmentSection config={config} update={update} />}
        {activeTab === 'models' && <ModelsSection config={config} update={update} />}
        {activeTab === 'defaults' && <AgentDefaultsSection config={config} update={update} />}
        {activeTab === 'tools' && <AgentToolsSection config={config} update={update} />}
        {activeTab === 'gateway' && <GatewaySection config={config} update={update} />}
        {activeTab === 'channels' && <ChannelsSection config={config} update={update} />}
        {activeTab === 'security' && <SecuritySection config={config} update={update} />}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-sm text-white z-50 ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
