'use client';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import type { Agent } from '@/types/agent';
import { StatusBadge } from './StatusBadge';

const WORKSPACE_FILES = ['SOUL', 'IDENTITY', 'TOOLS', 'MEMORY', 'USER', 'AGENTS', 'HEARTBEAT'] as const;
type WorkspaceFile = typeof WORKSPACE_FILES[number];

const INPUT_CLS = 'w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500';
const SELECT_CLS = INPUT_CLS;
const LABEL_CLS = 'text-slate-500 text-xs block mb-1';

function AgentAvatar({ agent }: { agent: Agent }) {
  const [err, setErr] = useState(false);
  if (agent.avatar && !err) {
    return (
      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-700 flex-shrink-0">
        <Image
          src={`/api/agents/${agent.id}/avatar`}
          alt={agent.name}
          width={56}
          height={56}
          className="object-cover w-full h-full"
          onError={() => setErr(true)}
        />
      </div>
    );
  }
  return <span className="text-4xl">{agent.emoji}</span>;
}

type FileContent = Partial<Record<WorkspaceFile, string>>;

function csvToArr(v: string): string[] {
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}

function arrToCsv(a?: string[]): string {
  return a?.join(', ') ?? '';
}

/* ── Advanced Settings shared fields ── */
interface AdvancedFields {
  toolsProfile: string;
  skills: string;
  sandboxMode: string;
  heartbeatEvery: string;
  heartbeatModel: string;
  allowAgents: string;
  modelFallbacks: string;
  isDefault: boolean;
}

function AdvancedSettingsSection({ adv, setAdv }: { adv: AdvancedFields; setAdv: (fn: (prev: AdvancedFields) => AdvancedFields) => void }) {
  return (
    <div className="space-y-3">
      <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-2">Advanced Settings</h3>
      <div>
        <label className={LABEL_CLS}>Tools Profile</label>
        <select className={SELECT_CLS} value={adv.toolsProfile} onChange={(e) => setAdv((p) => ({ ...p, toolsProfile: e.target.value }))}>
          <option value="">— none —</option>
          <option value="minimal">minimal</option>
          <option value="coding">coding</option>
          <option value="messaging">messaging</option>
          <option value="full">full</option>
        </select>
      </div>
      <div>
        <label className={LABEL_CLS}>Skills (comma-separated)</label>
        <textarea className={INPUT_CLS + ' h-16 resize-y'} value={adv.skills} onChange={(e) => setAdv((p) => ({ ...p, skills: e.target.value }))} placeholder="skill1, skill2" />
      </div>
      <div>
        <label className={LABEL_CLS}>Sandbox Mode</label>
        <select className={SELECT_CLS} value={adv.sandboxMode} onChange={(e) => setAdv((p) => ({ ...p, sandboxMode: e.target.value }))}>
          <option value="">— none —</option>
          <option value="off">off</option>
          <option value="all">all</option>
          <option value="tools">tools</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLS}>Heartbeat Every</label>
          <input className={INPUT_CLS} value={adv.heartbeatEvery} onChange={(e) => setAdv((p) => ({ ...p, heartbeatEvery: e.target.value }))} placeholder="e.g. 30s" />
        </div>
        <div>
          <label className={LABEL_CLS}>Heartbeat Model</label>
          <input className={INPUT_CLS} value={adv.heartbeatModel} onChange={(e) => setAdv((p) => ({ ...p, heartbeatModel: e.target.value }))} placeholder="optional model" />
        </div>
      </div>
      <div>
        <label className={LABEL_CLS}>Allow Agents (comma-separated)</label>
        <textarea className={INPUT_CLS + ' h-16 resize-y'} value={adv.allowAgents} onChange={(e) => setAdv((p) => ({ ...p, allowAgents: e.target.value }))} placeholder="agent1, agent2" />
      </div>
      <div>
        <label className={LABEL_CLS}>Model Fallbacks (comma-separated)</label>
        <textarea className={INPUT_CLS + ' h-16 resize-y'} value={adv.modelFallbacks} onChange={(e) => setAdv((p) => ({ ...p, modelFallbacks: e.target.value }))} placeholder="model1, model2" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="isDefault" checked={adv.isDefault} onChange={(e) => setAdv((p) => ({ ...p, isDefault: e.target.checked }))} className="accent-indigo-500" />
        <label htmlFor="isDefault" className="text-slate-400 text-sm">Default agent</label>
      </div>
    </div>
  );
}

function buildAdvancedBody(adv: AdvancedFields): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (adv.toolsProfile) body.toolsProfile = adv.toolsProfile;
  if (adv.skills.trim()) body.skills = csvToArr(adv.skills);
  if (adv.sandboxMode) body.sandboxMode = adv.sandboxMode;
  if (adv.heartbeatEvery.trim()) body.heartbeatEvery = adv.heartbeatEvery.trim();
  if (adv.heartbeatModel.trim()) body.heartbeatModel = adv.heartbeatModel.trim();
  if (adv.allowAgents.trim()) body.allowAgents = csvToArr(adv.allowAgents);
  if (adv.modelFallbacks.trim()) body.modelFallbacks = csvToArr(adv.modelFallbacks);
  body.isDefault = adv.isDefault;
  return body;
}

/* ── Edit Panel ── */
function AgentEditPanel({
  agent,
  onClose,
  onUpdated,
  onDeleted,
}: {
  agent: Agent;
  onClose: () => void;
  onUpdated: (a: Agent) => void;
  onDeleted: (id: string) => void;
}) {
  const [form, setForm] = useState({
    name: agent.name,
    emoji: agent.emoji,
    model: agent.model,
    theme: agent.theme ?? '',
    workspace: agent.workspace ?? '',
  });
  const [adv, setAdv] = useState<AdvancedFields>({
    toolsProfile: agent.toolsProfile ?? '',
    skills: arrToCsv(agent.skills),
    sandboxMode: agent.sandboxMode ?? '',
    heartbeatEvery: agent.heartbeat?.every ?? '',
    heartbeatModel: agent.heartbeat?.model ?? '',
    allowAgents: arrToCsv(agent.allowAgents),
    modelFallbacks: arrToCsv(agent.modelFallbacks),
    isDefault: agent.isDefault ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeFile, setActiveFile] = useState<WorkspaceFile>('SOUL');
  const [fileContents, setFileContents] = useState<FileContent>({});
  const [fileSaving, setFileSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const loadFile = useCallback(async (file: WorkspaceFile) => {
    if (fileContents[file] !== undefined) return;
    const res = await fetch(`/api/agents/${agent.id}/files/${file.toLowerCase()}`);
    if (res.ok) {
      const data = await res.json() as { content: string };
      setFileContents((prev) => ({ ...prev, [file]: data.content ?? "" }));
    }
  }, [agent.id, fileContents]);

  useEffect(() => { void loadFile(activeFile); }, [activeFile, loadFile]);

  const handleSave = async () => {
    setSaving(true);
    const body = { ...form, ...buildAdvancedBody(adv) };
    const res = await fetch(`/api/agents/${agent.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json() as Agent;
      onUpdated(updated);
      showToast('Agent saved');
    } else {
      showToast('Error saving agent');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete agent ${agent.name}? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/agents/${agent.id}`, { method: 'DELETE' });
    if (res.ok) {
      onDeleted(agent.id);
      onClose();
    } else {
      showToast('Error deleting agent');
    }
    setDeleting(false);
  };

  const handleFileSave = async () => {
    setFileSaving(true);
    const content = fileContents[activeFile] ?? '';
    const res = await fetch(`/api/agents/${agent.id}/files/${activeFile}.md`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      showToast(`${activeFile}.md saved`);
    } else {
      showToast('Error saving file');
    }
    setFileSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {toast && (
          <div className="fixed top-4 right-4 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">{toast}</div>
        )}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <AgentAvatar agent={agent} />
            <div>
              <h2 className="text-white text-lg font-semibold">{agent.name}</h2>
              <p className="text-slate-400 text-xs font-mono">{agent.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-2xl leading-none" aria-label="Close">&times;</button>
        </div>

        <div className="px-6 py-4 space-y-3">
          <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-2">Identity</h3>
          {([['name', 'Name'], ['emoji', 'Emoji'], ['model', 'Model'], ['theme', 'Theme'], ['workspace', 'Workspace']] as const).map(([key, label]) => (
            <div key={key}>
              <label className={LABEL_CLS}>{label}</label>
              <input
                className={INPUT_CLS}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-700/50">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-slate-400 text-xs uppercase tracking-wider hover:text-slate-200 transition-colors"
          >
            {showAdvanced ? '▾' : '▸'} Advanced Settings
          </button>
          {showAdvanced && (
            <div className="mt-3">
              <AdvancedSettingsSection adv={adv} setAdv={setAdv} />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-700/50">
          <div className="flex gap-2">
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="bg-red-900/40 hover:bg-red-800/60 disabled:opacity-50 text-red-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        <div className="px-6 pb-6">
          <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Workspace Files</h3>
          <div className="flex flex-wrap gap-1 mb-3">
            {WORKSPACE_FILES.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFile(f)}
                className={`text-xs px-3 py-1 rounded font-mono transition-colors ${
                  activeFile === f
                    ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {f}.md
              </button>
            ))}
          </div>
          <textarea
            className="w-full h-48 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono rounded-lg p-3 focus:outline-none focus:border-indigo-500 resize-y"
            value={fileContents[activeFile] ?? ''}
            onChange={(e) => setFileContents((prev) => ({ ...prev, [activeFile]: e.target.value }))}
            placeholder={`${activeFile}.md content...`}
          />
          <button
            onClick={() => void handleFileSave()}
            disabled={fileSaving}
            className="mt-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {fileSaving ? 'Saving...' : `Save ${activeFile}.md`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Add Agent Modal ── */
function AddAgentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ id: '', name: '', emoji: '', model: '', workspace: '' });
  const [adv, setAdv] = useState<AdvancedFields>({
    toolsProfile: '', skills: '', sandboxMode: '',
    heartbeatEvery: '', heartbeatModel: '',
    allowAgents: '', modelFallbacks: '', isDefault: false,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = form.id.trim() !== '' && form.name.trim() !== '';

  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    const body = {
      ...form,
      emoji: form.emoji || '🤖',
      model: form.model || 'unknown',
      workspace: form.workspace || '/tmp',
      ...buildAdvancedBody(adv),
    };
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      onCreated();
      onClose();
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setError(typeof data.error === 'string' ? data.error : 'Failed to create agent');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-white text-lg font-semibold">Add Agent</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-2xl leading-none" aria-label="Close">&times;</button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {error && <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</div>}
          <div>
            <label className={LABEL_CLS}>ID (required)</label>
            <input className={INPUT_CLS} value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} placeholder="my-agent" />
          </div>
          <div>
            <label className={LABEL_CLS}>Name (required)</label>
            <input className={INPUT_CLS} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="My Agent" />
          </div>
          <div>
            <label className={LABEL_CLS}>Emoji</label>
            <input className={INPUT_CLS} value={form.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} placeholder="🤖" />
          </div>
          <div>
            <label className={LABEL_CLS}>Model</label>
            <input className={INPUT_CLS} value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} placeholder="claude-sonnet-4-20250514" />
          </div>
          <div>
            <label className={LABEL_CLS}>Workspace</label>
            <input className={INPUT_CLS} value={form.workspace} onChange={(e) => setForm((f) => ({ ...f, workspace: e.target.value }))} placeholder="/path/to/workspace" />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="text-slate-400 text-xs uppercase tracking-wider hover:text-slate-200 transition-colors"
            >
              {showAdvanced ? '▾' : '▸'} Advanced Settings
            </button>
            {showAdvanced && (
              <div className="mt-3">
                <AdvancedSettingsSection adv={adv} setAdv={setAdv} />
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-700">
          <button
            onClick={() => void handleCreate()}
            disabled={saving || !canSubmit}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            {saving ? 'Creating...' : 'Create Agent'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export function AgentsPageClient() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const loadAgents = useCallback(() => {
    void fetch('/api/agents')
      .then((r) => r.json())
      .then((data: Agent[]) => { setAgents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  const handleUpdated = (updated: Agent) => {
    setAgents((prev) => prev.map((a) => a.id === updated.id ? updated : a));
    setSelected(updated);
  };

  const handleDeleted = (id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <main className="flex-1 overflow-auto bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Agents</h1>
            <p className="text-slate-400 text-sm mt-1">{agents.length} agent{agents.length !== 1 ? 's' : ''} configured</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Add Agent
          </button>
        </div>

        {loading ? (
          <div className="text-slate-500 text-sm">Loading agents...</div>
        ) : agents.length === 0 ? (
          <div className="text-slate-500 text-sm">No agents found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelected(agent)}
                className="bg-slate-900 border border-slate-700 hover:border-indigo-500/50 rounded-xl p-4 text-left transition-all hover:shadow-lg hover:shadow-indigo-500/10 group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <AgentAvatar agent={agent} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate group-hover:text-indigo-300 transition-colors">{agent.name}</p>
                    <p className="text-slate-500 text-xs font-mono truncate">{agent.id}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-xs font-mono truncate max-w-[60%]">{agent.model}</p>
                  <StatusBadge status={agent.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <AgentEditPanel
          agent={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}

      {showAdd && (
        <AddAgentModal
          onClose={() => setShowAdd(false)}
          onCreated={loadAgents}
        />
      )}
    </main>
  );
}
