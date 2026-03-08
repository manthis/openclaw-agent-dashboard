'use client';
import { useRef } from 'react';

interface DirectoryPickerFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

const INPUT_CLS = 'flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500';

export function DirectoryPickerField({ value, onChange, placeholder, className }: DirectoryPickerFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBrowse = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handle = await (window as any).showDirectoryPicker({ mode: 'read' });
        // File System Access API returns the folder name, not the full path
        // We prepend the current value's parent dir if possible
        const name = handle.name as string;
        const parent = value.includes('/') ? value.split('/').slice(0, -1).join('/') : '';
        onChange(parent ? `${parent}/${name}` : `/${name}`);
      } catch {
        // user cancelled, ignore
      }
    } else {
      alert('Directory picker not supported in this browser. Please type the path manually.');
    }
  };

  return (
    <div className={`flex gap-2 ${className ?? ''}`}>
      <input
        ref={inputRef}
        className={INPUT_CLS}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '/path/to/directory'}
      />
      <button
        type='button'
        onClick={() => void handleBrowse()}
        className='bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm px-3 py-2 rounded-lg transition-colors flex-shrink-0'
      >
        Browse
      </button>
    </div>
  );
}
