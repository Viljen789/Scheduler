import { useState } from 'react';
import { cn } from "../lib/utils";
import { formatAvailabilityForDay } from "../utils/timeutils";
import AvailabilityTooltip from "./AvailabilityTooltip";

interface AvailabilityBarProps {
    dayLabel: string;
    dayIndex: number;
    allSlots: number[];
    isActive: boolean;
}

const AvailabilityBar = ({ dayLabel, dayIndex, allSlots, isActive }: AvailabilityBarProps) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const hoursText = isActive ? formatAvailabilityForDay(allSlots, dayIndex) : "Unavailable";

    return (
        <div className="relative flex-1 group/day">
            {/* The Bar */}
            <div
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className={cn(
                    "h-1.5 w-full rounded-full transition-colors",
                    isActive ? "bg-zinc-800" : "bg-zinc-100"
                )}
            />

            {/* Day Label (Below bar) */}
            <div className={cn(
                "text-[9px] text-center mt-1 font-medium transition-colors uppercase",
                isActive ? "text-zinc-600" : "text-zinc-200"
            )}>
                {dayLabel.charAt(0)}
            </div>

            {/* Tooltip */}
            {showTooltip && (
                <AvailabilityTooltip dayLabel={dayLabel} hoursText={hoursText} />
            )}
        </div>
    );
};

export default AvailabilityBar;
