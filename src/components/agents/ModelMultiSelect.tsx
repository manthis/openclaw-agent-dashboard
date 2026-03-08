'use client';
import { useEffect, useRef, useState } from 'react';

interface ModelOption {
  id: string;
  alias?: string;
}

interface ModelMultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function ModelMultiSelect({ values, onChange, placeholder }: ModelMultiSelectProps) {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch('/api/models')
      .then((r) => r.json())
      .then((data: ModelOption[]) => setModels(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const filtered = models.filter(
    (m) =>
      !values.includes(m.id) &&
      (m.id.toLowerCase().includes(filter.toLowerCase()) ||
        (m.alias ?? '').toLowerCase().includes(filter.toLowerCase()))
  );

  const addModel = (id: string) => {
    if (!values.includes(id)) onChange([...values, id]);
    setFilter('');
    setOpen(false);
  };

  const removeModel = (id: string) => onChange(values.filter((v) => v !== id));

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filter.trim()) {
      e.preventDefault();
      if (!values.includes(filter.trim())) onChange([...values, filter.trim()]);
      setFilter('');
      setOpen(false);
    } else if (e.key === 'Backspace' && !filter && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div className='relative' ref={ref}>
      <div className='flex flex-wrap gap-1 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-2 py-1.5 min-h-[40px]'>
        {values.map((v) => (
          <span key={v} className='flex items-center gap-1 bg-indigo-900/40 border border-indigo-700/50 text-indigo-200 text-xs px-2 py-0.5 rounded font-mono'>
            {v}
            <button type='button' onClick={() => removeModel(v)} className='text-indigo-400 hover:text-red-400 leading-none'>&times;</button>
          </span>
        ))}
        <input
          className='flex-1 min-w-[180px] bg-transparent text-gray-900 dark:text-slate-200 text-sm outline-none py-0.5'
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          placeholder={values.length === 0 ? (placeholder ?? 'Add fallback model...') : ''}
        />
      </div>
      {open && filtered.length > 0 && (
        <ul className='absolute z-40 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-52 overflow-y-auto'>
          {filtered.map((m) => (
            <li key={m.id}>
              <button
                type='button'
                className='w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors font-mono'
                onClick={() => addModel(m.id)}
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
