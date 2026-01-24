interface AvailabilityTooltipProps {
    dayLabel: string;
    hoursText: string;
}

const AvailabilityTooltip = ({ dayLabel, hoursText }: AvailabilityTooltipProps) => {
    return (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] z-50">
            <div className="bg-zinc-900 text-white text-[10px] rounded py-1.5 px-3 shadow-xl text-center">
                <div className="font-bold mb-1 border-b border-zinc-700 pb-1 text-zinc-300">{dayLabel}</div>
                <div className="font-mono text-white">{hoursText}</div>
            </div>
            {/* Arrow */}
            <div className="w-2 h-2 bg-zinc-900 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
        </div>
    );
};

export default AvailabilityTooltip;
