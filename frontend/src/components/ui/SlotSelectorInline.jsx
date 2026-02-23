import React, { useState, useRef, useEffect } from 'react';
import useSlots from '../../hooks/useSlots';

export default function SlotSelectorInline({ selected, onChange }) {
  const { slots, fmt } = useSlots();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = slots.find((s) => s.key === selected) || slots[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 border rounded-md px-3 py-1 text-sm bg-white hover:shadow-sm"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="text-left">
          <div className="text-xs text-gray-500">{current.label}</div>
          <div className="text-sm font-medium text-gray-800">
            {fmt(current.range.start)} - {fmt(current.range.end)}
          </div>
        </div>
        <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 8l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <ul role="listbox" className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-50">
          {slots.map((s) => (
            <li key={s.key} role="option" aria-selected={s.key === selected}>
              <button
                onClick={() => {
                  onChange && onChange(s.key);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 flex flex-col"
              >
                <span className="text-xs text-gray-500">{s.label}</span>
                <span className="text-sm font-medium">{fmt(s.range.start)} - {fmt(s.range.end)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
