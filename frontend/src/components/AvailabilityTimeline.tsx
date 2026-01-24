import { DAYS_MAP } from "../utils/timeutils";
import type { Interviewer } from "../types";
import AvailabilityBar from "./AvailabilityBar";

interface AvailabilityTimelineProps {
    availability: Interviewer['availability'];
}

const AvailabilityTimeline = ({ availability }: AvailabilityTimelineProps) => {
    return (
        <div className="mt-3 pt-3 border-t border-zinc-50 flex gap-0.5">
            {DAYS_MAP.map((dayLabel, dayIndex) => {
                const hasAvailability = availability.some(
                    slot => Math.floor(slot / 24) === dayIndex
                );

                return (
                    <AvailabilityBar
                        key={dayIndex}
                        dayLabel={dayLabel}
                        dayIndex={dayIndex}
                        allSlots={availability}
                        isActive={hasAvailability}
                    />
                );
            })}
        </div>
    );
};

export default AvailabilityTimeline;
