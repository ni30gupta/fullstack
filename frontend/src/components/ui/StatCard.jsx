import React from 'react';

const StatCard = ({ title, value, change, total_load }) => {
  const safeName = String(title).toLowerCase().replace(/\s+/g, '');
  const imageSrc = new URL(`../../assets/body_parts/${safeName}.jpeg`, import.meta.url).href;

  // Compute percentage for ring relative to the passed total_load. If
  // total_load is missing or zero, fall back to using the raw `value` as a
  // percentage (this keeps the previous behavior for standalone use).
  let percent = parseFloat(value) || 0;
  if (total_load && total_load > 0) {
    percent = (value / total_load) * 100;
  }
  // clamp between 0 and 100
  percent = Math.max(0, Math.min(100, percent));
  const radius = 64;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl p-3 hover:shadow-lg transition-shadow duration-300 flex flex-col items-center w-52 m-1">
      {/* Circular image with speedometer ring */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Single progress ring (colored arc) */}
        <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle
            stroke="#10b981"
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            r={normalizedRadius}
            cx="64"
            cy="64"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        {/* Circular image */}
        <img
          src={imageSrc}
          alt={title}
          className="w-24 h-24 rounded-full object-cover shadow-md z-10"
        />
      </div>

      {/* Stats below */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {/* change indicator: up arrow for positive, down for negative, grey for zero */}
        {typeof change === 'number' && (
          <div
            className={`flex items-center justify-center gap-1 mt-1 text-sm ${
              change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            <svg
              className={`w-3 h-3 transform ${change < 0 ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
            <span>{change > 0 ? `+${change}` : change}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
