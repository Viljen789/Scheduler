import {useState} from 'react';
import type {Candidate, Interviewer} from "../types.ts";
import {DAYS_MAP, formatAvailabilityForDay} from "../utils/timeutils.ts";

interface PersonListViewProps {
    data: Candidate[] | Interviewer[];
}

const PersonListView = ({data}: PersonListViewProps) => {
    return (
        <ul className="space-y-3 min-h-0 overflow-auto flex-1 p-1 pb-10"> {/* Added pb-10 for tooltip space */}
            {data.map((person) => {
                const isInterviewer = "availability" in person;

                return (
                    <li
                        key={person.id}
                        className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all relative"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-semibold text-gray-800 leading-tight">{person.name}</h3>
                                <span className="text-xs text-gray-400 font-mono">#{person.id}</span>
                            </div>

                            {isInterviewer && (
                                <div className="mt-3 pt-2 border-t border-gray-100 flex gap-1">
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
                            <span
                                className={`
                                    text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                                    ${person.gender === "M" ? "bg-blue-100 text-blue-700" :
                                    person.gender === "F" ? "bg-pink-100 text-pink-700" :
                                        "bg-purple-100 text-purple-700"}
                                `}
                            >
                                {person.gender}
                            </span>
                        </div>
                    </li>
                );
            })}
            {data.length === 0 && <p className="text-gray-500 italic text-center mt-4">No data found.</p>}
        </ul>
    );
};

// --- Sub-Component for the Hover Logic ---
const AvailabilitySquare = ({dayLabel, dayIndex, allSlots, isActive}: {
    dayLabel: string,
    dayIndex: number,
    allSlots: number[],
    isActive: boolean
}) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const hoursText = isActive ? formatAvailabilityForDay(allSlots, dayIndex) : "Unavailable";

    return (
        <div className="relative flex flex-col items-center">
            {/* The Square */}
            <div
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className={`
                    w-8 h-8 rounded flex items-center justify-center text-[10px] font-medium cursor-help transition-colors
                    ${isActive
                    ? "bg-green-500 text-white shadow-sm hover:bg-green-600"
                    : "bg-gray-100 text-gray-300 hover:bg-gray-200"
                }
                `}
            >
                {dayLabel}
            </div>

            {/* The Tooltip (Only shows on hover) */}
            {showTooltip && (
                <div className="absolute bottom-full mb-2 w-max max-w-[150px] z-50">
                    <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg text-center">
                        <div className="font-bold mb-1 border-b border-gray-600 pb-1">{dayLabel}</div>
                        <div className="font-mono">{hoursText}</div>
                    </div>
                    {/* Little triangle pointer */}
                    <div className="w-2 h-2 bg-gray-800 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                </div>
            )}
        </div>
    );
};

export default PersonListView;