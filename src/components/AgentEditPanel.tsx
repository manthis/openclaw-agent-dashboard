'use client';

import { useState, useEffect } from 'react';
import type { Agent } from '@/types/agent';
import { AgentAvatar } from './AgentAvatar';
import { Button } from './ui/button';

const MD_FILES = ['SOUL.md', 'USER.md', 'AGENTS.md', 'HEARTBEAT.md', 'TOOLS.md', 'MEMORY.md', 'IDENTITY.md'] as const;
type MdFile = typeof MD_FILES[number];

interface Props {
  agent: Agent;
  isDirty: boolean;
  setIsDirty: (v: boolean) => void;
  onSaved: () => Promise<void>;
  onClose: () => void;
}

export function AgentEditPanel({ agent, isDirty, setIsDirty, onSaved, onClose }: Props) {
  const [name, setName] = useState(agent.name);
  const [emoji, setEmoji] = useState(agent.emoji);
  const [model, setModel] = useState(agent.model);
  const [theme, setTheme] = useState(agent.theme);
  const [savingMeta, setSavingMeta] = useState(false);

  const [fileContents, setFileContents] = useState<Partial<Record<MdFile, string>>>({});
  const [fileLoading, setFileLoading] = useState<Partial<Record<MdFile, boolean>>>({});
  const [fileSaving, setFileSaving] = useState<Partial<Record<MdFile, boolean>>>({});
  const [activeFile, setActiveFile] = useState<MdFile | null>(null);

  useEffect(() => {
    setName(agent.name);
    setEmoji(agent.emoji);
    setModel(agent.model);
    setTheme(agent.theme);
    setFileContents({});
    setActiveFile(null);
  }, [agent.id]);

  const loadFile = async (filename: MdFile) => {
    if (fileContents[filename] !== undefined) {
      setActiveFile(filename);
      return;
    }
    setFileLoading(prev => ({ ...prev, [filename]: true }));
    try {
      const res = await fetch(`/api/agents/${agent.id}/files/${filename}`);
      if (res.ok) {
        const text = await res.text();
        setFileContents(prev => ({ ...prev, [filename]: text }));
      } else {
        setFileContents(prev => ({ ...prev, [filename]: '' }));
      }
    } finally {
      setFileLoading(prev => ({ ...prev, [filename]: false }));
      setActiveFile(filename);
    }
  };

  const saveFile = async (filename: MdFile) => {
    const content = fileContents[filename] ?? '';
    setFileSaving(prev => ({ ...prev, [filename]: true }));
    try {
      await fetch(`/api/agents/${agent.id}/files/${filename}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain' },
        body: content,
      });
    } finally {
      setFileSaving(prev => ({ ...prev, [filename]: false }));
    }
  };

  const saveMeta = async () => {
    setSavingMeta(true);
    try {
      await fetch(`/api/agents/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, emoji, model, theme }),
      });
      setIsDirty(false);
      await onSaved();
    } finally {
      setSavingMeta(false);
    }
  };

  const fields: { label: string; value: string; set: (v: string) => void }[] = [
    { label: 'Nom', value: name, set: setName },
    { label: 'Emoji', value: emoji, set: setEmoji },
    { label: 'Modèle', value: model, set: setModel },
    { label: 'Thème', value: theme, set: setTheme },
  ];

  return (
    <div className="flex flex-col h-full p-6 gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AgentAvatar agent={agent} size={40} />
          <div>
            <div className="text-neutral-100 font-bold">{agent.name}</div>
            <div className="text-neutral-500 text-xs font-mono">{agent.id}</div>
          </div>
        </div>
        <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 text-xl transition-colors">×</button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-neutral-400 text-xs uppercase tracking-wider font-semibold">Paramètres</div>
        {fields.map(({ label, value, set }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="text-neutral-400 text-xs">{label}</label>
            <input
              value={value}
              onChange={e => { set(e.target.value); setIsDirty(true); }}
              className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-500 transition-colors"
            />
          </div>
        ))}
        <Button
          size="sm"
          disabled={savingMeta}
          onClick={saveMeta}
          className="bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 text-neutral-100 self-end"
        >
          {savingMeta ? 'Sauvegarde…' : 'Sauvegarder'}
        </Button>
      </div>

      <div className="flex flex-col gap-3 flex-1 min-h-0">
        <div className="text-neutral-400 text-xs uppercase tracking-wider font-semibold">Fichiers workspace</div>
        <div className="flex flex-wrap gap-1">
          {MD_FILES.map(f => (
            <button
              key={f}
              onClick={() => loadFile(f)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                activeFile === f
                  ? 'bg-neutral-600 text-neutral-100 border border-neutral-500'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 border border-neutral-700'
              }`}
            >
              {fileLoading[f] ? '…' : f.replace('.md', '')}
            </button>
          ))}
        </div>

        {activeFile && (
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            <textarea
              value={fileContents[activeFile] ?? ''}
              onChange={e => {
                setFileContents(prev => ({ ...prev, [activeFile]: e.target.value }));
                setIsDirty(true);
              }}
              className="flex-1 min-h-[200px] bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 font-mono resize-none focus:outline-none focus:border-neutral-500 transition-colors"
            />
            <Button
              size="sm"
              disabled={fileSaving[activeFile]}
              onClick={() => saveFile(activeFile)}
              className="bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 text-neutral-100 self-end"
            >
              {fileSaving[activeFile] ? 'Sauvegarde…' : `Sauvegarder ${activeFile}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
