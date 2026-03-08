'use client';

import { useState } from 'react';
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react';

interface DynamicMapEditorProps {
  label: string;
  value: Record<string, Record<string, unknown>>;
  onChange: (v: Record<string, Record<string, unknown>>) => void;
}

export function DynamicMapEditor({ label, value, onChange }: DynamicMapEditorProps) {
  const [draftKey, setDraftKey] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const add = () => {
    const k = draftKey.trim();
    if (k && !(k in value)) {
      onChange({ ...value, [k]: {} });
      setDraftKey('');
      setExpanded((prev) => ({ ...prev, [k]: true }));
    }
  };

  const remove = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateEntry = (key: string, json: string) => {
    try {
      const parsed: unknown = JSON.parse(json);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        onChange({ ...value, [key]: parsed as Record<string, unknown> });
      }
    } catch {
      // ignore invalid JSON while typing
    }
  };

  const entries = Object.entries(value);

  return (
    <div className="space-y-2">
      <label className="text-sm text-slate-400">{label}</label>
      <div className="flex gap-2">
        <input
          value={draftKey}
          onChange={(e) => setDraftKey(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="New key..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={add}
          className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map(([k, v]) => (
            <div key={k} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  onClick={() => toggleExpand(k)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {expanded[k] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <span className="text-sm text-indigo-400 font-mono flex-1">{k}</span>
                <button
                  type="button"
                  onClick={() => remove(k)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {expanded[k] && (
                <div className="px-3 pb-3">
                  <textarea
                    defaultValue={JSON.stringify(v, null, 2)}
                    onBlur={(e) => updateEntry(k, e.target.value)}
                    rows={Math.min(Object.keys(v).length * 2 + 2, 12)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500 resize-y"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
