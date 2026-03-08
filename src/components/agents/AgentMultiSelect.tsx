'use client';
import { useRef, useState } from 'react';
import type { Agent } from '@/types/agent';

interface AgentMultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  agents: Agent[];
}

export function AgentMultiSelect({ values, onChange, agents }: AgentMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
  };

  // Attach/detach listener
  if (typeof document !== 'undefined') {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }

  const allOption = { id: '*', emoji: '🌍', name: 'All agents (*)' };
  const options = [allOption, ...agents.map((a) => ({ id: a.id, emoji: a.emoji, name: a.name }))];
  const filtered = options.filter(
    (o) =>
      !values.includes(o.id) &&
      (o.id.toLowerCase().includes(filter.toLowerCase()) ||
        o.name.toLowerCase().includes(filter.toLowerCase()))
  );

  const add = (id: string) => {
    if (!values.includes(id)) onChange([...values, id]);
    setFilter('');
    setOpen(false);
  };

  const remove = (id: string) => onChange(values.filter((v) => v !== id));

  const getDisplay = (id: string) => {
    if (id === '*') return '🌍 *';
    const a = agents.find((ag) => ag.id === id);
    return a ? `${a.emoji} ${a.name}` : id;
  };

  return (
    <div className='relative' ref={ref}>
      <div className='flex flex-wrap gap-1 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-2 py-1.5 min-h-[40px]'>
        {values.map((v) => (
          <span key={v} className='flex items-center gap-1 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 text-xs px-2 py-0.5 rounded'>
            {getDisplay(v)}
            <button type='button' onClick={() => remove(v)} className='text-gray-400 dark:text-slate-400 hover:text-red-400 leading-none'>&times;</button>
          </span>
        ))}
        <input
          className='flex-1 min-w-[140px] bg-transparent text-gray-900 dark:text-slate-200 text-sm outline-none py-0.5'
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={values.length === 0 ? 'Add agent or * for all...' : ''}
        />
      </div>
      {open && filtered.length > 0 && (
        <ul className='absolute z-40 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-52 overflow-y-auto'>
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                type='button'
                className='w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors'
                onClick={() => add(o.id)}
              >
                {o.emoji} <span className='font-medium'>{o.name}</span>
                {o.id !== '*' && <span className='ml-1 text-gray-400 dark:text-slate-500 font-mono text-xs'>({o.id})</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
