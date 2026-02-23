import React from 'react';

export default function Avatar({ name, size = 40 }) {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
  const color = colors[(name?.length || 0) % colors.length];
  const classSize = size === 40 ? 'w-10 h-10 text-sm' : `${size}px ${size}px`;

  return (
    <div className={`rounded-full ${color} flex items-center justify-center text-white font-medium ${classSize}`}>
      {initials}
    </div>
  );
}
