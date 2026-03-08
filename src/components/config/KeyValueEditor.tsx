'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface KeyValueEditorProps {
  label: string;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export function KeyValueEditor({
  label,
  value,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}: KeyValueEditorProps) {
  const [draftKey, setDraftKey] = useState('');
  const [draftVal, setDraftVal] = useState('');

  const add = () => {
    const k = draftKey.trim();
    if (k) {
      onChange({ ...value, [k]: draftVal });
      setDraftKey('');
      setDraftVal('');
    }
  };

  const remove = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  const entries = Object.entries(value);

  return (
    <div className="space-y-2">
      <label className="text-sm text-slate-400">{label}</label>
      <div className="flex gap-2">
        <input
          value={draftKey}
          onChange={(e) => setDraftKey(e.target.value)}
          placeholder={keyPlaceholder}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        <input
          value={draftVal}
          onChange={(e) => setDraftVal(e.target.value)}
          placeholder={valuePlaceholder}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
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
        <div className="space-y-1">
          {entries.map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 bg-slate-800 rounded-md px-3 py-1.5 border border-slate-700">
              <span className="text-xs text-indigo-400 font-mono min-w-[80px]">{k}</span>
              <span className="text-xs text-slate-500">=</span>
              <span className="text-xs text-slate-300 flex-1 truncate font-mono">{v}</span>
              <button
                type="button"
                onClick={() => remove(k)}
                className="text-slate-500 hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
