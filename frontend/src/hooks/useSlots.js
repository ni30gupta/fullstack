export default function useSlots(now = new Date()) {
  const minutes = now.getMinutes();
  const start = new Date(now);
  if (minutes < 30) start.setMinutes(0, 0, 0);
  else start.setMinutes(30, 0, 0);

  const makeRange = (s) => ({ start: new Date(s), end: new Date(s.getTime() + 60 * 60000) });

  const s0 = start;
  const s1 = new Date(start.getTime() + 30 * 60000);
  const s2 = new Date(start.getTime() + 60 * 60000);

  const slots = [
    { key: 'current', range: makeRange(s0), label: 'Current slot' },
    { key: 'next', range: makeRange(s1), label: 'Next slot' },
    { key: 'next_to_next', range: makeRange(s2), label: '2nd next slot' },
  ];

  const fmt = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return { slots, fmt };
}
