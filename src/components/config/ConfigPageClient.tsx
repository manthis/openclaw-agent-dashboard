'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Save, Loader2, AlertCircle,
  FileText, Shield, Box, Cpu, Settings2,
  Wrench, Server, MessageSquare, Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { SectionCard } from './SectionCard';
import { StringArrayEditor } from './StringArrayEditor';
import { KeyValueEditor } from './KeyValueEditor';
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

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------
function TextField({ label, value, onChange, type = 'text', id }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; id?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm text-slate-400">{label}</label>
      <input
        id={id}
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
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SwitchField({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-slate-400">{label}</label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function JsonTextArea({ label, value, onChange }: {
  label: string; value: unknown; onChange: (v: unknown) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(value ?? {}, null, 2));
  }, [value]);

  const handleBlur = () => {
    try {
      const parsed: unknown = JSON.parse(text);
      setJsonError(null);
      onChange(parsed);
    } catch {
      setJsonError('Invalid JSON');
    }
  };

  return (
    <div className="space-y-1">
      <label className="text-sm text-slate-400">{label}</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        rows={10}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500 resize-y"
      />
      {jsonError && <p className="text-xs text-red-400">{jsonError}</p>}
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
      <JsonTextArea label="Auth Configuration (JSON)" value={getPath(config, 'auth')} onChange={(v) => update('auth', v)} />
    </SectionCard>
  );
}

function EnvironmentSection({ config, update }: { config: JsonObject; update: (path: string, v: unknown) => void }) {
  return (
    <SectionCard title="Environment" icon={<Box className="w-4 h-4 text-indigo-400" />}>
      <KeyValueEditor label="Environment Variables" value={asStringRecord(getPath(config, 'env.vars'))} onChange={(v) => update('env.vars', v)} keyPlaceholder="VAR_NAME" valuePlaceholder="value" />
      <SwitchField label="Shell Env Enabled" checked={asBool(getPath(config, 'env.shellEnv.enabled'))} onChange={(v) => update('env.shellEnv.enabled', v)} />
      <NumberField label="Shell Env Timeout (ms)" value={asNumber(getPath(config, 'env.shellEnv.timeoutMs'), 5000)} onChange={(v) => update('env.shellEnv.timeoutMs', v)} min={0} />
    </SectionCard>
  );
}

function ModelsSection({ config, update }: { config: JsonObject; update: (path: string, v: unknown) => void }) {
  return (
    <SectionCard title="Models" icon={<Cpu className="w-4 h-4 text-indigo-400" />}>
      <SelectField label="Mode" value={asString(getPath(config, 'models.mode'), 'auto')} onChange={(v) => update('models.mode', v)} options={['auto', 'manual', 'fallback']} />
      <JsonTextArea label="Providers (JSON)" value={getPath(config, 'models.providers')} onChange={(v) => update('models.providers', v)} />
    </SectionCard>
  );
}

function AgentDefaultsSection({ config, update }: { config: JsonObject; update: (path: string, v: unknown) => void }) {
  const base = 'agents.defaults';
  return (
    <SectionCard title="Agent Defaults" icon={<Settings2 className="w-4 h-4 text-indigo-400" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="Workspace" value={asString(getPath(config, `${base}.workspace`))} onChange={(v) => update(`${base}.workspace`, v)} />
        <TextField label="Repo Root" value={asString(getPath(config, `${base}.repoRoot`))} onChange={(v) => update(`${base}.repoRoot`, v)} />
        <TextField label="Model" value={asString(getPath(config, `${base}.model`))} onChange={(v) => update(`${base}.model`, v)} />
        <TextField label="Secondary Model" value={asString(getPath(config, `${base}.secondaryModel`))} onChange={(v) => update(`${base}.secondaryModel`, v)} />
        <SwitchField label="Skip Bootstrap" checked={asBool(getPath(config, `${base}.skipBootstrap`))} onChange={(v) => update(`${base}.skipBootstrap`, v)} />
        <SwitchField label="No Cache" checked={asBool(getPath(config, `${base}.noCache`))} onChange={(v) => update(`${base}.noCache`, v)} />
        <SelectField label="Thinking" value={asString(getPath(config, `${base}.thinking`), 'off')} onChange={(v) => update(`${base}.thinking`, v)} options={['off', 'low', 'medium', 'high', 'stream']} />
        <NumberField label="Thinking Budget" value={asNumber(getPath(config, `${base}.thinkingBudget`))} onChange={(v) => update(`${base}.thinkingBudget`, v)} min={0} />
        <NumberField label="Max Tokens" value={asNumber(getPath(config, `${base}.maxTokens`))} onChange={(v) => update(`${base}.maxTokens`, v)} min={0} />
        <NumberField label="Temperature" value={asNumber(getPath(config, `${base}.temperature`))} onChange={(v) => update(`${base}.temperature`, v)} min={0} max={2} step={0.1} />
      </div>
    </SectionCard>
  );
}

function ToolsSection({ config, update }: { config: JsonObject; update: (path: string, v: unknown) => void }) {
  const base = 'tools';
  return (
    <SectionCard title="Tools" icon={<Wrench className="w-4 h-4 text-indigo-400" />}>
      <StringArrayEditor label="Allowed Tools" value={asStringArray(getPath(config, `${base}.allowedTools`))} onChange={(v) => update(`${base}.allowedTools`, v)} />
      <StringArrayEditor label="Denied Tools" value={asStringArray(getPath(config, `${base}.deniedTools`))} onChange={(v) => update(`${base}.deniedTools`, v)} />
      <StringArrayEditor label="Confirm Tools" value={asStringArray(getPath(config, `${base}.confirmTools`))} onChange={(v) => update(`${base}.confirmTools`, v)} />
      <SwitchField label="Allow Shell" checked={asBool(getPath(config, `${base}.allowShell`))} onChange={(v) => update(`${base}.allowShell`, v)} />
      <StringArrayEditor label="Allowed Shell Commands" value={asStringArray(getPath(config, `${base}.allowShellCommands`))} onChange={(v) => update(`${base}.allowShellCommands`, v)} />
    </SectionCard>
  );
}

function GatewaySection({ config, update }: { config: JsonObject; update: (path: string, v: unknown) => void }) {
  const base = 'gateway';
  return (
    <SectionCard title="Gateway" icon={<Server className="w-4 h-4 text-indigo-400" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="Host" value={asString(getPath(config, `${base}.host`), 'localhost')} onChange={(v) => update(`${base}.host`, v)} />
        <NumberField label="Port" value={asNumber(getPath(config, `${base}.port`), 18789)} onChange={(v) => update(`${base}.port`, v)} min={1} max={65535} />
      </div>
      <PasswordField label="Secret" value={asString(getPath(config, `${base}.secret`))} onChange={(v) => update(`${base}.secret`, v)} />
      <SwitchField label="HTTPS" checked={asBool(getPath(config, `${base}.https`))} onChange={(v) => update(`${base}.https`, v)} />
    </SectionCard>
  );
}

function ChannelsSection({ config, update }: { config: JsonObject; update: (path: string, v: unknown) => void }) {
  return (
    <SectionCard title="Channels" icon={<MessageSquare className="w-4 h-4 text-indigo-400" />}>
      <h4 className="text-sm font-medium text-slate-300">Telegram</h4>
      <PasswordField label="Bot Token" value={asString(getPath(config, 'channels.telegram.token'))} onChange={(v) => update('channels.telegram.token', v)} />
      <TextField label="Webhook URL" value={asString(getPath(config, 'channels.telegram.webhookUrl'))} onChange={(v) => update('channels.telegram.webhookUrl', v)} />
      <StringArrayEditor label="Allowed Users" value={asStringArray(getPath(config, 'channels.telegram.allowedUsers'))} onChange={(v) => update('channels.telegram.allowedUsers', v)} />

      <div className="border-t border-slate-700 pt-4 mt-4" />
      <h4 className="text-sm font-medium text-slate-300">Discord</h4>
      <PasswordField label="Bot Token" value={asString(getPath(config, 'channels.discord.token'))} onChange={(v) => update('channels.discord.token', v)} />
      <TextField label="Guild ID" value={asString(getPath(config, 'channels.discord.guildId'))} onChange={(v) => update('channels.discord.guildId', v)} />
    </SectionCard>
  );
}

function SecuritySection({ config, update }: { config: JsonObject; update: (path: string, v: unknown) => void }) {
  return (
    <SectionCard title="Security" icon={<Lock className="w-4 h-4 text-indigo-400" />}>
      <StringArrayEditor label="Allowed Origins" value={asStringArray(getPath(config, 'security.allowedOrigins'))} onChange={(v) => update('security.allowedOrigins', v)} />
      <StringArrayEditor label="Trusted Proxies" value={asStringArray(getPath(config, 'security.trustedProxies'))} onChange={(v) => update('security.trustedProxies', v)} />
      <TextField label="Max Body Size" value={asString(getPath(config, 'security.maxBodySize'), '1mb')} onChange={(v) => update('security.maxBodySize', v)} />
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
const TAB_ITEMS = [
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
      {/* Sticky Header */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-neutral-950 py-3 -mt-3 -mx-1 px-1">
        <div>
          <h1 className="text-xl font-semibold text-white">Configuration</h1>
          <p className="text-sm text-slate-400">Edit openclaw.json settings</p>
        </div>
        <div className="flex items-center gap-3">
          {dirty && (
            <Badge variant="outline" className="text-amber-400 border-amber-400/50">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse mr-1" />
              Unsaved changes
            </Badge>
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

      {/* shadcn/ui Tabs */}
      <Tabs defaultValue="logging">
        <TabsList className="w-full flex-wrap h-auto bg-slate-900/50">
          {TAB_ITEMS.map(({ id, label, icon: Icon }) => (
            <TabsTrigger key={id} value={id} className="gap-1.5 data-[state=active]:text-indigo-300">
              <Icon className="w-3.5 h-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="logging"><LoggingSection config={config} update={update} /></TabsContent>
        <TabsContent value="auth"><AuthSection config={config} update={update} /></TabsContent>
        <TabsContent value="environment"><EnvironmentSection config={config} update={update} /></TabsContent>
        <TabsContent value="models"><ModelsSection config={config} update={update} /></TabsContent>
        <TabsContent value="defaults"><AgentDefaultsSection config={config} update={update} /></TabsContent>
        <TabsContent value="tools"><ToolsSection config={config} update={update} /></TabsContent>
        <TabsContent value="gateway"><GatewaySection config={config} update={update} /></TabsContent>
        <TabsContent value="channels"><ChannelsSection config={config} update={update} /></TabsContent>
        <TabsContent value="security"><SecuritySection config={config} update={update} /></TabsContent>
      </Tabs>

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
