import React from 'react'

const BottomTab = () => {
    return (
        <div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                {/* Peak Hours Card */}
                <div className="bg-primary-gradient rounded-2xl p-6 text-white">
                    <h3 className="text-lg font-semibold mb-2">Peak Hours Today</h3>
                    <p className="text-indigo-100 text-sm mb-4">Based on historical data</p>
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold">6-8 AM</p>
                            <p className="text-xs text-indigo-200">Morning Rush</p>
                        </div>
                        <div className="w-px h-10 bg-white/20"></div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">5-7 PM</p>
                            <p className="text-xs text-indigo-200">Evening Rush</p>
                        </div>
                    </div>
                </div>

                {/* Recommendations Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Recommendations</h3>
                    <p className="text-sm text-gray-500 mb-4">Based on current load</p>
                    <ul className="space-y-3">
                        {bodyPartLoad.filter(bp => bp.currentLoad >= 80).slice(0, 3).map(bp => (
                            <li key={bp.id} className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span className="text-sm text-gray-600">
                                    <strong>{bp.name}</strong> area is crowded - consider redirecting members
                                </span>
                            </li>
                        ))}
                        {bodyPartLoad.filter(bp => bp.currentLoad < 30).slice(0, 2).map(bp => (
                            <li key={bp.id} className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span className="text-sm text-gray-600">
                                    <strong>{bp.name}</strong> area has availability
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default BottomTab