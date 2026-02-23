import React from 'react';

const getLoadColor = (load) => {
  if (load >= 80) return { bg: 'bg-red-500', text: 'text-red-600', bgLight: 'bg-red-50', border: 'border-red-200' };
  if (load >= 60) return { bg: 'bg-orange-500', text: 'text-orange-600', bgLight: 'bg-orange-50', border: 'border-orange-200' };
  if (load >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-600', bgLight: 'bg-yellow-50', border: 'border-yellow-200' };
  return { bg: 'bg-green-500', text: 'text-green-600', bgLight: 'bg-green-50', border: 'border-green-200' };
};

const getLoadLabel = (load) => {
  if (load >= 80) return 'High';
  if (load >= 60) return 'Moderate';
  if (load >= 40) return 'Normal';
  return 'Low';
};

const BodyPartCard = ({ bodyPart }) => {
  const colors = getLoadColor(bodyPart.currentLoad);

  return (
    <div className={`bg-white rounded-2xl border ${colors.border} p-5 hover:shadow-lg transition-shadow duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{bodyPart.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{bodyPart.name}</h3>
            <p className="text-xs text-gray-500">
              {bodyPart.currentUsers}/{bodyPart.maxCapacity} users
            </p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors.bgLight} ${colors.text}`}>
          {getLoadLabel(bodyPart.currentLoad)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">Current Load</span>
          <span className={`text-sm font-bold ${colors.text}`}>{bodyPart.currentLoad}%</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bg} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${bodyPart.currentLoad}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{bodyPart.currentUsers}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{bodyPart.maxCapacity - bodyPart.currentUsers}</p>
          <p className="text-xs text-gray-500">Available</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{bodyPart.maxCapacity}</p>
          <p className="text-xs text-gray-500">Capacity</p>
        </div>
      </div>
    </div>
  );
};

export default BodyPartCard;
