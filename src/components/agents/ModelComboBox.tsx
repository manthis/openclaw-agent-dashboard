'use client';
import { useEffect, useRef, useState } from 'react';

interface ModelOption {
  id: string;
  alias?: string;
}

interface ModelComboBoxProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

const INPUT_CLS = 'w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500';

export function ModelComboBox({ value, onChange, placeholder, className }: ModelComboBoxProps) {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch('/api/models')
      .then((r) => r.json())
      .then((data: ModelOption[]) => setModels(data))
      .catch(() => {});
  }, []);

  useEffect(() => { setFilter(value); }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        // Commit typed value on close
        onChange(filter);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, filter, onChange]);

  const filtered = models.filter(
    (m) =>
      m.id.toLowerCase().includes(filter.toLowerCase()) ||
      (m.alias ?? '').toLowerCase().includes(filter.toLowerCase())
  );

  const handleSelect = (id: string) => {
    onChange(id);
    setFilter(id);
    setOpen(false);
  };

  return (
    <div className={`relative ${className ?? ''}`} ref={ref}>
      <input
        className={INPUT_CLS}
        value={filter}
        onChange={(e) => { setFilter(e.target.value); setOpen(true); onChange(e.target.value); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? 'anthropic/claude-sonnet-4-6'}
      />
      {open && filtered.length > 0 && (
        <ul className='absolute z-40 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-52 overflow-y-auto'>
          {filtered.map((m) => (
            <li key={m.id}>
              <button
                type='button'
                className='w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors font-mono'
                onClick={() => handleSelect(m.id)}
              >
                {m.id}
                {m.alias && <span className='ml-2 text-gray-400 dark:text-slate-500 text-xs'>({m.alias})</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
