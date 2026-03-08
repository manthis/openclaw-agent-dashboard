'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { Agent } from '@/types/agent';
import { StatusBadge } from './StatusBadge';
import { Switch } from './ui/switch';
import { EmojiPickerField } from './agents/EmojiPickerField';
import { ModelComboBox } from './agents/ModelComboBox';
import { ModelMultiSelect } from './agents/ModelMultiSelect';
import { DirectoryPickerField } from './agents/DirectoryPickerField';
import { AgentMultiSelect } from './agents/AgentMultiSelect';

const WORKSPACE_FILES = ['SOUL', 'IDENTITY', 'TOOLS', 'MEMORY', 'USER', 'AGENTS', 'HEARTBEAT'] as const;
type WorkspaceFile = typeof WORKSPACE_FILES[number];

const INPUT_CLS = 'w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500';
const SELECT_CLS = INPUT_CLS;
const LABEL_CLS = 'text-slate-500 text-xs block mb-1';

function AgentAvatar({ agent }: { agent: Agent }) {
  const [err, setErr] = useState(false);
  if (agent.avatar && !err) {
    return (
      <div className='w-14 h-14 rounded-full overflow-hidden border-2 border-slate-700 flex-shrink-0'>
        <Image
          src={`/api/agents/${agent.id}/avatar`}
          alt={agent.name}
          width={56}
          height={56}
          className='object-cover w-full h-full'
          onError={() => setErr(true)}
        />
      </div>
    );
  }
  return <span className='text-4xl'>{agent.emoji}</span>;
}

type FileContent = Partial<Record<WorkspaceFile, string>>;

function TagsInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) onChange([...tags, input.trim()]);
      setInput('');
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };
  return (
    <div className='flex flex-wrap gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 min-h-[40px]'>
      {tags.map((t) => (
        <span key={t} className='flex items-center gap-1 bg-slate-700 text-slate-200 text-xs px-2 py-0.5 rounded'>
          {t}
          <button type='button' onClick={() => onChange(tags.filter((x) => x !== t))} className='text-slate-400 hover:text-red-400 leading-none'>&times;</button>
        </span>
      ))}
      <input
        className='flex-1 min-w-[120px] bg-transparent text-slate-200 text-sm outline-none py-0.5'
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder ?? 'Enter to add'}
      />
    </div>
  );
}

type SectionId = 'identity' | 'model' | 'tools' | 'sandbox' | 'heartbeat' | 'subagents';
function SectionPanel({
  title, dirty, open, onToggle, onSave, saving, children,
}: {
  title: string; dirty: boolean; open: boolean;
  onToggle: () => void; onSave: () => void; saving: boolean; children: React.ReactNode;
}) {
  return (
    <div className='border-t border-slate-700/50'>
      <button
        type='button'
        className='w-full flex items-center justify-between px-6 py-3 text-left hover:bg-slate-800/30 transition-colors'
        onClick={onToggle}
      >
        <span className='flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider'>
          {title}
          {dirty && <span className='w-2 h-2 rounded-full bg-amber-500 inline-block' title='Unsaved changes' />}
        </span>
        <span className='text-slate-600'>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className='px-6 pb-4 space-y-3'>
          {children}
          <button
            type='button'
            onClick={onSave}
            disabled={saving}
            className='mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors'
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}

function AgentEditPanel({
  agent, agents, onClose, onUpdated, onDeleted,
}: {
  agent: Agent;
  agents: Agent[];
  onClose: () => void;
  onUpdated: (a: Agent) => void;
  onDeleted: (id: string) => void;
}) {
  const [identity, setIdentity] = useState({
    name: agent.name,
    emoji: agent.emoji,
    theme: agent.theme ?? '',
    avatar: agent.avatar ?? '',
    workspace: agent.workspace ?? '',
  });
  const [modelFields, setModelFields] = useState({
    model: agent.model,
    modelFallbacks: agent.modelFallbacks ?? [],
    isDefault: agent.default ?? false,
  });
  const [toolsFields, setToolsFields] = useState({
    toolsProfile: agent.toolsProfile ?? '',
    toolsAllow: agent.toolsAllow ?? [],
    toolsDeny: agent.toolsDeny ?? [],
    skills: agent.skills ?? [],
  });
  const [sandboxFields, setSandboxFields] = useState({
    sandboxMode: agent.sandboxMode ?? '',
  });
  const [heartbeatFields, setHeartbeatFields] = useState({
    heartbeatEvery: agent.heartbeatEvery ?? '',
    heartbeatTarget: agent.heartbeatTarget ?? '',
    heartbeatModel: agent.heartbeatModel ?? '',
    heartbeatPrompt: agent.heartbeatPrompt ?? '',
  });
  const [subagentsFields, setSubagentsFields] = useState({
    subagentsAllowAgents: agent.subagentsAllowAgents ?? [],
  });

  const initRef = useRef({
    identity: { name: agent.name, emoji: agent.emoji, theme: agent.theme ?? '', avatar: agent.avatar ?? '', workspace: agent.workspace ?? '' },
    modelFields: { model: agent.model, modelFallbacks: agent.modelFallbacks ?? [], isDefault: agent.default ?? false },
    toolsFields: { toolsProfile: agent.toolsProfile ?? '', toolsAllow: agent.toolsAllow ?? [], toolsDeny: agent.toolsDeny ?? [], skills: agent.skills ?? [] },
    sandboxFields: { sandboxMode: agent.sandboxMode ?? '' },
    heartbeatFields: { heartbeatEvery: agent.heartbeatEvery ?? '', heartbeatTarget: agent.heartbeatTarget ?? '', heartbeatModel: agent.heartbeatModel ?? '', heartbeatPrompt: agent.heartbeatPrompt ?? '' },
    subagentsFields: { subagentsAllowAgents: agent.subagentsAllowAgents ?? [] },
  });

  const [dirty, setDirty] = useState<Record<SectionId, boolean>>({
    identity: false, model: false, tools: false, sandbox: false, heartbeat: false, subagents: false,
  });
  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>({
    identity: true, model: false, tools: false, sandbox: false, heartbeat: false, subagents: false,
  });
  const [saving, setSaving] = useState<Record<SectionId, boolean>>({
    identity: false, model: false, tools: false, sandbox: false, heartbeat: false, subagents: false,
  });
  const [deleting, setDeleting] = useState(false);
  const [activeFile, setActiveFile] = useState<WorkspaceFile>('SOUL');
  const [fileContents, setFileContents] = useState<FileContent>({});
  const [fileSaving, setFileSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const init = initRef.current;
    setDirty({
      identity: JSON.stringify(identity) !== JSON.stringify(init.identity),
      model: JSON.stringify(modelFields) !== JSON.stringify(init.modelFields),
      tools: JSON.stringify(toolsFields) !== JSON.stringify(init.toolsFields),
      sandbox: JSON.stringify(sandboxFields) !== JSON.stringify(init.sandboxFields),
      heartbeat: JSON.stringify(heartbeatFields) !== JSON.stringify(init.heartbeatFields),
      subagents: JSON.stringify(subagentsFields) !== JSON.stringify(init.subagentsFields),
    });
  }, [identity, modelFields, toolsFields, sandboxFields, heartbeatFields, subagentsFields]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const loadFile = useCallback(async (file: WorkspaceFile) => {
    if (fileContents[file] !== undefined) return;
    const res = await fetch(`/api/agents/${agent.id}/files/${file.toLowerCase()}`);
    if (res.ok) {
      const data = await res.json() as { content: string };
      setFileContents((prev) => ({ ...prev, [file]: data.content ?? '' }));
    }
  }, [agent.id, fileContents]);

  useEffect(() => { void loadFile(activeFile); }, [activeFile, loadFile]);

  const saveSection = async (sectionId: SectionId, body: Record<string, unknown>) => {
    setSaving((s) => ({ ...s, [sectionId]: true }));
    const res = await fetch(`/api/agents/${agent.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json() as Agent;
      onUpdated(updated);
      if (sectionId === 'identity') initRef.current.identity = { ...identity };
      if (sectionId === 'model') initRef.current.modelFields = { ...modelFields };
      if (sectionId === 'tools') initRef.current.toolsFields = { ...toolsFields };
      if (sectionId === 'sandbox') initRef.current.sandboxFields = { ...sandboxFields };
      if (sectionId === 'heartbeat') initRef.current.heartbeatFields = { ...heartbeatFields };
      if (sectionId === 'subagents') initRef.current.subagentsFields = { ...subagentsFields };
      setDirty((d) => ({ ...d, [sectionId]: false }));
      showToast('Saved');
    } else { showToast('Error saving'); }
    setSaving((s) => ({ ...s, [sectionId]: false }));
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete agent ${agent.name}? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/agents/${agent.id}`, { method: 'DELETE' });
    if (res.ok) { onDeleted(agent.id); onClose(); }
    else showToast('Error deleting agent');
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
    if (res.ok) showToast(`${activeFile}.md saved`);
    else showToast('Error saving file');
    setFileSaving(false);
  };

  const toggleSection = (s: SectionId) => setOpenSections((o) => ({ ...o, [s]: !o[s] }));

  // Other agents for subagent multi-select (exclude self)
  const otherAgents = agents.filter((a) => a.id !== agent.id);

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60' onClick={onClose}>
      <div className='bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto' onClick={(e) => e.stopPropagation()}>
        {toast && <div className='fixed top-4 right-4 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50'>{toast}</div>}
        <div className='flex items-center justify-between px-6 py-4 border-b border-slate-700'>
          <div className='flex items-center gap-3'>
            <AgentAvatar agent={agent} />
            <div>
              <h2 className='text-white text-lg font-semibold'>{agent.name}</h2>
              <p className='text-slate-400 text-xs font-mono'>{agent.id}</p>
            </div>
          </div>
          <div className='flex items-center gap-3'>
            <button onClick={() => void handleDelete()} disabled={deleting} className='bg-red-900/40 hover:bg-red-800/60 disabled:opacity-50 text-red-400 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors'>
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <button onClick={onClose} className='text-slate-500 hover:text-slate-300 text-2xl leading-none' aria-label='Close'>&times;</button>
          </div>
        </div>

        {/* IDENTITY */}
        <SectionPanel title='Identity' dirty={dirty.identity} open={openSections.identity} onToggle={() => toggleSection('identity')} onSave={() => void saveSection('identity', { name: identity.name, emoji: identity.emoji, theme: identity.theme, avatar: identity.avatar || null, workspace: identity.workspace || undefined })} saving={saving.identity}>
          <div><label className={LABEL_CLS}>Name</label><input className={INPUT_CLS} value={identity.name} onChange={(e) => setIdentity((p) => ({ ...p, name: e.target.value }))} /></div>
          <div>
            <label className={LABEL_CLS}>Emoji</label>
            <div className='flex items-center gap-3'>
              <EmojiPickerField value={identity.emoji} onChange={(emoji) => setIdentity((p) => ({ ...p, emoji }))} />
              <span className='text-slate-500 text-xs'>Click to open emoji picker</span>
            </div>
          </div>
          <div><label className={LABEL_CLS}>Theme</label><input className={INPUT_CLS} value={identity.theme} onChange={(e) => setIdentity((p) => ({ ...p, theme: e.target.value }))} /></div>
          <div><label className={LABEL_CLS}>Avatar (filename)</label><input className={INPUT_CLS} value={identity.avatar} onChange={(e) => setIdentity((p) => ({ ...p, avatar: e.target.value }))} placeholder='agent.png' /></div>
          <div>
            <label className={LABEL_CLS}>Workspace directory</label>
            <DirectoryPickerField value={identity.workspace} onChange={(workspace) => setIdentity((p) => ({ ...p, workspace }))} placeholder='/Users/me/.openclaw/workspace/agent' />
          </div>
        </SectionPanel>

        {/* MODEL */}
        <SectionPanel title='Model' dirty={dirty.model} open={openSections.model} onToggle={() => toggleSection('model')} onSave={() => void saveSection('model', { model: modelFields.model, modelFallbacks: modelFields.modelFallbacks, default: modelFields.isDefault })} saving={saving.model}>
          <div>
            <label className={LABEL_CLS}>Primary model</label>
            <ModelComboBox value={modelFields.model} onChange={(model) => setModelFields((p) => ({ ...p, model }))} />
          </div>
          <div>
            <label className={LABEL_CLS}>Fallback models</label>
            <ModelMultiSelect values={modelFields.modelFallbacks} onChange={(modelFallbacks) => setModelFields((p) => ({ ...p, modelFallbacks }))} />
          </div>
          <div className='flex items-center gap-3'>
            <Switch
              id='editDefault'
              checked={modelFields.isDefault}
              onCheckedChange={(checked) => setModelFields((p) => ({ ...p, isDefault: checked }))}
            />
            <label htmlFor='editDefault' className='text-slate-400 text-sm cursor-pointer'>Default agent</label>
          </div>
        </SectionPanel>

        {/* TOOLS */}
        <SectionPanel title='Tools & Skills' dirty={dirty.tools} open={openSections.tools} onToggle={() => toggleSection('tools')} onSave={() => void saveSection('tools', { toolsProfile: toolsFields.toolsProfile || undefined, toolsAllow: toolsFields.toolsAllow, toolsDeny: toolsFields.toolsDeny, skills: toolsFields.skills })} saving={saving.tools}>
          <div><label className={LABEL_CLS}>Tools Profile</label>
            <select className={SELECT_CLS} value={toolsFields.toolsProfile} onChange={(e) => setToolsFields((p) => ({ ...p, toolsProfile: e.target.value }))}>
              <option value=''>— none —</option>
              <option value='minimal'>minimal</option>
              <option value='coding'>coding</option>
              <option value='messaging'>messaging</option>
              <option value='full'>full</option>
            </select>
          </div>
          <div><label className={LABEL_CLS}>Tools Allow (Enter to add)</label><TagsInput tags={toolsFields.toolsAllow} onChange={(t) => setToolsFields((p) => ({ ...p, toolsAllow: t }))} placeholder='tool_name or group:category' /></div>
          <div><label className={LABEL_CLS}>Tools Deny (Enter to add)</label><TagsInput tags={toolsFields.toolsDeny} onChange={(t) => setToolsFields((p) => ({ ...p, toolsDeny: t }))} placeholder='tool_name' /></div>
          <div><label className={LABEL_CLS}>Skills (Enter to add)</label><TagsInput tags={toolsFields.skills} onChange={(t) => setToolsFields((p) => ({ ...p, skills: t }))} placeholder='skill-name' /></div>
        </SectionPanel>

        {/* SANDBOX */}
        <SectionPanel title='Sandbox' dirty={dirty.sandbox} open={openSections.sandbox} onToggle={() => toggleSection('sandbox')} onSave={() => void saveSection('sandbox', { sandboxMode: sandboxFields.sandboxMode || undefined })} saving={saving.sandbox}>
          <div><label className={LABEL_CLS}>Sandbox Mode</label>
            <select className={SELECT_CLS} value={sandboxFields.sandboxMode} onChange={(e) => setSandboxFields((p) => ({ ...p, sandboxMode: e.target.value }))}>
              <option value=''>— none —</option>
              <option value='off'>off</option>
              <option value='non-main'>non-main</option>
              <option value='all'>all</option>
            </select>
          </div>
        </SectionPanel>

        {/* HEARTBEAT */}
        <SectionPanel title='Heartbeat' dirty={dirty.heartbeat} open={openSections.heartbeat} onToggle={() => toggleSection('heartbeat')} onSave={() => void saveSection('heartbeat', { heartbeatEvery: heartbeatFields.heartbeatEvery || undefined, heartbeatTarget: heartbeatFields.heartbeatTarget || undefined, heartbeatModel: heartbeatFields.heartbeatModel || undefined, heartbeatPrompt: heartbeatFields.heartbeatPrompt || undefined })} saving={saving.heartbeat}>
          <div className='grid grid-cols-2 gap-3'>
            <div><label className={LABEL_CLS}>Every (e.g. 30m)</label><input className={INPUT_CLS} value={heartbeatFields.heartbeatEvery} onChange={(e) => setHeartbeatFields((p) => ({ ...p, heartbeatEvery: e.target.value }))} placeholder='30m' /></div>
            <div><label className={LABEL_CLS}>Target</label>
              <select className={SELECT_CLS} value={heartbeatFields.heartbeatTarget} onChange={(e) => setHeartbeatFields((p) => ({ ...p, heartbeatTarget: e.target.value }))}>
                <option value=''>— none —</option>
                <option value='none'>none</option>
                <option value='last'>last</option>
                <option value='telegram'>telegram</option>
                <option value='whatsapp'>whatsapp</option>
                <option value='signal'>signal</option>
                <option value='discord'>discord</option>
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL_CLS}>Heartbeat Model</label>
            <ModelComboBox value={heartbeatFields.heartbeatModel} onChange={(heartbeatModel) => setHeartbeatFields((p) => ({ ...p, heartbeatModel }))} placeholder='optional model override' />
          </div>
          <div><label className={LABEL_CLS}>Heartbeat Prompt</label><textarea className={INPUT_CLS + ' h-20 resize-y'} value={heartbeatFields.heartbeatPrompt} onChange={(e) => setHeartbeatFields((p) => ({ ...p, heartbeatPrompt: e.target.value }))} placeholder='Custom heartbeat prompt...' /></div>
        </SectionPanel>

        {/* SUB-AGENTS */}
        <SectionPanel title='Sub-agents' dirty={dirty.subagents} open={openSections.subagents} onToggle={() => toggleSection('subagents')} onSave={() => void saveSection('subagents', { subagentsAllowAgents: subagentsFields.subagentsAllowAgents })} saving={saving.subagents}>
          <div>
            <label className={LABEL_CLS}>Allow Agents (* for all)</label>
            <AgentMultiSelect
              values={subagentsFields.subagentsAllowAgents}
              onChange={(subagentsAllowAgents) => setSubagentsFields((p) => ({ ...p, subagentsAllowAgents }))}
              agents={otherAgents}
            />
          </div>
        </SectionPanel>

        {/* WORKSPACE FILES */}
        <div className='px-6 pb-6 border-t border-slate-700/50 pt-4'>
          <h3 className='text-slate-400 text-xs uppercase tracking-wider mb-3'>Workspace Files</h3>
          <div className='flex flex-wrap gap-1 mb-3'>
            {WORKSPACE_FILES.map((f) => (
              <button key={f} onClick={() => setActiveFile(f)} className={`text-xs px-3 py-1 rounded font-mono transition-colors ${activeFile === f ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}>{f}.md</button>
            ))}
          </div>
          <textarea className='w-full h-48 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono rounded-lg p-3 focus:outline-none focus:border-indigo-500 resize-y' value={fileContents[activeFile] ?? ''} onChange={(e) => setFileContents((prev) => ({ ...prev, [activeFile]: e.target.value }))} placeholder={`${activeFile}.md content...`} />
          <button onClick={() => void handleFileSave()} disabled={fileSaving} className='mt-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-sm font-medium px-4 py-2 rounded-lg transition-colors'>
            {fileSaving ? 'Saving...' : `Save ${activeFile}.md`}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddAgentModal({ agents, onClose, onCreated }: { agents: Agent[]; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ id: '', name: '', emoji: '🤖', model: '', workspace: '' });
  const [toolsProfile, setToolsProfile] = useState('');
  const [sandboxMode, setSandboxMode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = form.id.trim() !== '' && form.name.trim() !== '';

  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    const body: Record<string, unknown> = {
      ...form,
      emoji: form.emoji || '🤖',
      model: form.model || 'unknown',
      workspace: form.workspace || '/tmp',
      default: isDefault,
    };
    if (toolsProfile) body.toolsProfile = toolsProfile;
    if (sandboxMode) body.sandboxMode = sandboxMode;
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) { onCreated(); onClose(); }
    else {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setError(typeof data.error === 'string' ? data.error : 'Failed to create agent');
    }
    setSaving(false);
  };

  // Suppress unused agents warning — used in future multi-select
  void agents;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60' onClick={onClose}>
      <div className='bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto' onClick={(e) => e.stopPropagation()}>
        <div className='flex items-center justify-between px-6 py-4 border-b border-slate-700'>
          <h2 className='text-white text-lg font-semibold'>Add Agent</h2>
          <button onClick={onClose} className='text-slate-500 hover:text-slate-300 text-2xl leading-none' aria-label='Close'>&times;</button>
        </div>
        <div className='px-6 py-4 space-y-3'>
          {error && <div className='text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2'>{error}</div>}
          <div><label className={LABEL_CLS}>ID (required)</label><input className={INPUT_CLS} value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} placeholder='my-agent' /></div>
          <div><label className={LABEL_CLS}>Name (required)</label><input className={INPUT_CLS} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder='My Agent' /></div>
          <div>
            <label className={LABEL_CLS}>Emoji</label>
            <div className='flex items-center gap-3'>
              <EmojiPickerField value={form.emoji} onChange={(emoji) => setForm((f) => ({ ...f, emoji }))} />
              <span className='text-slate-500 text-xs'>Click to pick</span>
            </div>
          </div>
          <div>
            <label className={LABEL_CLS}>Model</label>
            <ModelComboBox value={form.model} onChange={(model) => setForm((f) => ({ ...f, model }))} placeholder='anthropic/claude-sonnet-4-6' />
          </div>
          <div>
            <label className={LABEL_CLS}>Workspace</label>
            <DirectoryPickerField value={form.workspace} onChange={(workspace) => setForm((f) => ({ ...f, workspace }))} placeholder='/path/to/workspace' />
          </div>
          <div><label className={LABEL_CLS}>Tools Profile</label>
            <select className={SELECT_CLS} value={toolsProfile} onChange={(e) => setToolsProfile(e.target.value)}>
              <option value=''>— none —</option>
              <option value='minimal'>minimal</option>
              <option value='coding'>coding</option>
              <option value='messaging'>messaging</option>
              <option value='full'>full</option>
            </select>
          </div>
          <div><label className={LABEL_CLS}>Sandbox Mode</label>
            <select className={SELECT_CLS} value={sandboxMode} onChange={(e) => setSandboxMode(e.target.value)}>
              <option value=''>— none —</option>
              <option value='off'>off</option>
              <option value='non-main'>non-main</option>
              <option value='all'>all</option>
            </select>
          </div>
          <div className='flex items-center gap-3'>
            <Switch id='addDefault' checked={isDefault} onCheckedChange={setIsDefault} />
            <label htmlFor='addDefault' className='text-slate-400 text-sm cursor-pointer'>Default agent</label>
          </div>
        </div>
        <div className='px-6 py-4 border-t border-slate-700'>
          <button onClick={() => void handleCreate()} disabled={saving || !canSubmit} className='w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors'>
            {saving ? 'Creating...' : 'Create Agent'}
          </button>
        </div>
      </div>
    </div>
  );
}

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

  const handleDeleted = (id: string) => setAgents((prev) => prev.filter((a) => a.id !== id));

  return (
    <main className='flex-1 overflow-auto bg-slate-950 p-6'>
      <div className='max-w-6xl mx-auto'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-white text-2xl font-bold'>Agents</h1>
            <p className='text-slate-400 text-sm mt-1'>{agents.length} agent{agents.length !== 1 ? 's' : ''} configured</p>
          </div>
          <button onClick={() => setShowAdd(true)} className='bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors'>+ Add Agent</button>
        </div>
        {loading ? (
          <div className='text-slate-500 text-sm'>Loading agents...</div>
        ) : agents.length === 0 ? (
          <div className='text-slate-500 text-sm'>No agents found.</div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {agents.map((agent) => (
              <button key={agent.id} onClick={() => setSelected(agent)} className='bg-slate-900 border border-slate-700 hover:border-indigo-500/50 rounded-xl p-4 text-left transition-all hover:shadow-lg hover:shadow-indigo-500/10 group'>
                <div className='flex items-start gap-3 mb-3'>
                  <AgentAvatar agent={agent} />
                  <div className='flex-1 min-w-0'>
                    <p className='text-white text-sm font-semibold truncate group-hover:text-indigo-300 transition-colors'>{agent.name}</p>
                    <p className='text-slate-500 text-xs font-mono truncate'>{agent.id}</p>
                  </div>
                </div>
                <div className='flex items-center justify-between'>
                  <p className='text-slate-400 text-xs font-mono truncate max-w-[60%]'>{agent.model}</p>
                  <StatusBadge status={agent.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {selected && <AgentEditPanel agent={selected} agents={agents} onClose={() => setSelected(null)} onUpdated={handleUpdated} onDeleted={handleDeleted} />}
      {showAdd && <AddAgentModal agents={agents} onClose={() => setShowAdd(false)} onCreated={loadAgents} />}
    </main>
  );
}
