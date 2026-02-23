import React from 'react';

const SlotSelector = ({ slots, selectedSlot, onSlotChange, loading }) => {
  return (
    <div className="relative">
      <select
        value={selectedSlot}
        onChange={(e) => onSlotChange(e.target.value)}
        disabled={loading}
        className="
          appearance-none w-full sm:w-64
          px-4 py-2.5 pr-10
          bg-white border border-gray-200 rounded-xl
          text-sm font-medium text-gray-700
          shadow-sm
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          cursor-pointer
        "
      >
        {slots.map((slot) => (
          <option key={slot.id} value={slot.id}>
            {slot.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

export default SlotSelector;
