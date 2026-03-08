'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface StringArrayEditorProps {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
}

export function StringArrayEditor({ label, value, onChange }: StringArrayEditorProps) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const trimmed = draft.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setDraft('');
    }
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm text-slate-400">{label}</label>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Add item..."
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
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded-md border border-slate-700"
            >
              {item}
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-slate-500 hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
