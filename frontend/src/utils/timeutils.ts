export const DAYS_MAP = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const formatAvailabilityForDay = (allSlots: number[], dayIndex: number): string => {
    const daySlots = allSlots
        .filter(slot => Math.floor(slot / 24) === dayIndex) // Get only this day's slots
        .map(slot => slot % 24) // Convert 25 -> 1 (1 AM)
        .sort((a, b) => a - b);

    if (daySlots.length === 0) return "Unavailable";

    return daySlots.map(h => `${h}:00`).join(", ");
};