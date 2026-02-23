import { useEffect, useState, useRef } from "react"
import { useBodyPartLoad } from "../../hooks"
import StatCard from './StatCard';
import SlotSelectorInline from './SlotSelectorInline';


function getTotalBodyPartLoad(payload) {
    return (payload.time_slot || []).reduce((total, slot) => {
        const breakdown = slot.body_part_breakdown || {};
        return (
            total +
            Object.values(breakdown).reduce((sum, value) => sum + value, 0)
        );
    }, 0);
}

const GymRush = () => {
    const { getCurrentRush } = useBodyPartLoad()
    const [gymRushdata, setGymRushData] = useState(null);
    const [totalLoad , setTotalLoad ] = useState(0)
    const [selectedSlot, setSelectedSlot] = useState('current');

    useEffect(() => {
        let mounted = true;
        async function load() {
            const today = new Date();
            // strip to 'YYYY-MM-DD' format
            const dateStr = today.toISOString().split('T')[0];
            const { data } = await getCurrentRush(dateStr);
            if (!mounted) return;
            setGymRushData(data);
            setTotalLoad(getTotalBodyPartLoad(data));
        }
        load().catch(console.error);
        return () => { mounted = false; };
    }, [getCurrentRush]);
    

    return (
        <div>
            {/* Top controls: total load and slot selector */}
            <div className="flex items-center justify-between mb-2 mx-4">
                <div>
                    <p className="text-sm text-gray-500 mb-1">Total Load</p>
                    <p className="text-2xl font-bold text-gray-900">{totalLoad}</p>
                </div>

                <div>
                    <SlotSelectorInline selected={selectedSlot} onChange={setSelectedSlot} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-20 mb-6">
                {gymRushdata && Object.entries(gymRushdata.time_slot[0].body_part_breakdown).map(([bodyPart, load]) => (
                        <StatCard
                            key={bodyPart}
                            title={bodyPart}
                            value={load}
                            total_load={totalLoad}
                        />
                    )   )
                }
           
            </div>

            {/* <div className="bg-white rounded-2xl border border-gray-200 p-5 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Equipment Load by Body Part</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Real-time usage of gym equipment categories</p>
                    </div>
                    <SlotSelector
                        slots={slots}
                        selectedSlot={selectedSlot}
                        onSlotChange={changeSlot}
                        loading={loadLoading}
                    />
                </div>

                {loadLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {bodyPartLoad.map((bodyPart) => (
                            <BodyPartCard key={bodyPart.id} bodyPart={bodyPart} />
                        ))}
                    </div>
                )}

                {!loadLoading && bodyPartLoad.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-3">🏋️</div>
                        <p className="text-gray-500">No data available for the selected time slot</p>
                    </div>
                )}
            </div> */}
        </div>
    )
}

export default GymRush