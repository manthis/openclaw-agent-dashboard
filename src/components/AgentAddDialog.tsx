'use client';

import { useState } from 'react';
import { Button } from './ui/button';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => Promise<void>;
}

type FormFields = 'id' | 'name' | 'emoji' | 'model' | 'workspace' | 'theme' | 'avatar';

const FIELD_LABELS: [FormFields, string][] = [
  ['id', 'ID (lowercase, tirets autorisés)'],
  ['name', 'Nom'],
  ['emoji', 'Emoji'],
  ['model', 'Modèle (ex: anthropic/claude-sonnet-4-6)'],
  ['workspace', 'Workspace path'],
  ['theme', 'Thème / description'],
  ['avatar', 'Avatar path (optionnel)'],
];

export function AgentAddDialog({ open, onOpenChange, onCreated }: Props) {
  const [form, setForm] = useState<Record<FormFields, string>>({
    id: '', name: '', emoji: '\ud83e\udd16', model: '', workspace: '', theme: '', avatar: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const set = (field: FormFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleCreate = async () => {
    setError('');
    if (!form.id || !form.name || !form.model || !form.workspace) {
      setError('id, name, model et workspace sont obligatoires');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json() as { error: unknown };
        setError(JSON.stringify(data.error));
        return;
      }
      await onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-neutral-100 font-bold text-lg mb-4">Nouvel agent</h2>
        <div className="flex flex-col gap-3">
          {FIELD_LABELS.map(([field, label]) => (
            <div key={field} className="flex flex-col gap-1">
              <label className="text-neutral-400 text-xs">{label}</label>
              <input
                value={form[field]}
                onChange={set(field)}
                className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-500 transition-colors"
              />
            </div>
          ))}
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 text-sm transition-colors"
          >
            Annuler
          </button>
          <Button
            size="sm"
            disabled={saving}
            onClick={handleCreate}
            className="bg-indigo-600 hover:bg-indigo-500 text-white border-none"
          >
            {saving ? 'Création…' : 'Créer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
