import { useState } from 'react';
import type { Candidate, Interviewer } from "../types.ts";
import { DAYS_MAP, formatAvailabilityForDay } from "../utils/timeutils.ts";
import { cn } from "../lib/utils";

interface PersonListViewProps {
    data: Candidate[] | Interviewer[];
}

const PersonListView = ({ data }: PersonListViewProps) => {
    return (
        <ul className="space-y-2 min-h-0 overflow-auto flex-1 pb-10">
            {data.map((person) => {
                const isInterviewer = "availability" in person;

                return (
                    <li
                        key={person.id}
                        className="group flex flex-col bg-white border border-zinc-200 rounded-lg p-3 hover:border-zinc-300 transition-all"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-900">{person.name}</h3>
                                <span className="text-xs font-mono text-zinc-400">#{person.id}</span>
                            </div>

                            {/* Minimalist Gender Badge */}
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider border border-zinc-100 px-1.5 py-0.5 rounded bg-zinc-50">
                                {person.gender}
                            </span>
                        </div>

                        {/* Availability Visualization (Only for Interviewers) */}
                        {isInterviewer && (
                            <div className="mt-3 pt-3 border-t border-zinc-50 flex gap-0.5">
                                {DAYS_MAP.map((dayLabel, dayIndex) => {
                                    const hasAvailability = (person as Interviewer).availability.some(
                                        slot => Math.floor(slot / 24) === dayIndex
                                    );

                                    return (
                                        <AvailabilitySquare
                                            key={dayIndex}
                                            dayLabel={dayLabel}
                                            dayIndex={dayIndex}
                                            allSlots={(person as Interviewer).availability}
                                            isActive={hasAvailability}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </li>
                );
            })}
            {data.length === 0 && (
                <div className="h-24 flex items-center justify-center border border-dashed border-zinc-200 rounded-lg">
                    <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">No records found</p>
                </div>
            )}
        </ul>
    );
};

// --- Minimalist Sub-Component ---
const AvailabilitySquare = ({ dayLabel, dayIndex, allSlots, isActive }: {
    dayLabel: string,
    dayIndex: number,
    allSlots: number[],
    isActive: boolean
}) => {
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

            <div className={cn(
                "text-[9px] text-center mt-1 font-medium transition-colors uppercase",
                isActive ? "text-zinc-600" : "text-zinc-200"
            )}>
                {dayLabel.charAt(0)}
            </div>

            {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] z-50">
                    <div className="bg-zinc-900 text-white text-[10px] rounded py-1.5 px-3 shadow-xl text-center">
                        <div className="font-bold mb-1 border-b border-zinc-700 pb-1 text-zinc-300">{dayLabel}</div>
                        <div className="font-mono text-white">{hoursText}</div>
                    </div>
                    {/* Arrow */}
                    <div className="w-2 h-2 bg-zinc-900 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                </div>
            )}
        </div>
    );
};

export default PersonListView;