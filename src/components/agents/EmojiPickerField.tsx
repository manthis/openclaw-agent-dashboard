'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EmojiPickerProps = Record<string, any>;
const Picker = dynamic<EmojiPickerProps>(() => import('@emoji-mart/react').then((m) => ({ default: m.default ?? m }) as { default: React.ComponentType<EmojiPickerProps> }), { ssr: false });

interface EmojiPickerFieldProps {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}

export function EmojiPickerField({ value, onChange, className }: EmojiPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [emojiData, setEmojiData] = useState<unknown>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !emojiData) {
      void import('@emoji-mart/data').then((m) => setEmojiData(m.default ?? m));
    }
  }, [open, emojiData]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelect = (e: any) => {
    if (e?.native) {
      onChange(e.native as string);
      setOpen(false);
    }
  };

  return (
    <div className={`relative inline-block ${className ?? ''}`} ref={ref}>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        className='text-2xl w-12 h-10 flex items-center justify-center bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg hover:border-indigo-500 transition-colors'
        aria-label='Pick emoji'
      >
        {value || '🤖'}
      </button>
      {open && (
        <div className='absolute z-50 top-12 left-0'>
          {emojiData ? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <Picker data={emojiData as any} theme='dark' onEmojiSelect={handleSelect} />
          ) : (
            <div className='bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 text-gray-500 dark:text-slate-400 text-sm'>Loading...</div>
          )}
        </div>
      )}
    </div>
  );
}
