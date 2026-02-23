import React from 'react';

export default function StatusBadge({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}
