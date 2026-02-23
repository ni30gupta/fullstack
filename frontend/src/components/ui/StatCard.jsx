import React from 'react';

const StatCard = ({ title, value, total_load }) => {
  const safeName = String(title).toLowerCase().replace(/\s+/g, '');
  const imageSrc = new URL(`../../assets/body_parts/${safeName}.jpeg`, import.meta.url).href;

  // Parse percentage value for the progress ring
  const percent = parseInt(value, 10) || 0;
  const radius = 64;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl p-3 hover:shadow-lg transition-shadow duration-300 flex flex-col items-center w-52 m-1">
      {/* Circular image with speedometer ring */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Background ring (gray track) */}
        <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx="64"
            cy="64"
          />
          {/* Progress ring (colored arc) */}
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
        <div className="flex items-center justify-center gap-1 mt-1 text-sm text-green-600">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          <span>{total_load}</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
