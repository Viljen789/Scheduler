import {useState} from 'react';
import type {Interviewer} from '../types';
import PersonListView from "./PersonListView.tsx";
import {cn} from "../lib/utils";

interface Props {
    data: Interviewer[];
    onAdd: (interviewer: Interviewer) => void;
}

export default function InterviewerManager({data, onAdd}: Props) {
    const [name, setName] = useState("");
    const [id, setId] = useState("");
    const [selectedHours, setSelectedHours] = useState<number[]>([]);

    const toggleHour = (hour: number) => {
        if (selectedHours.includes(hour)) {
            setSelectedHours(selectedHours.filter(h => h !== hour));
        } else {
            setSelectedHours([...selectedHours, hour]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !id) return;

        onAdd({
            id,
            name,
            gender: "NB",
            availability: selectedHours,
            biased: []
        });

        setName("");
        setId("");
        setSelectedHours([]);
    };

    const selectAll = () => setSelectedHours([9, 10, 11, 12, 13, 14, 15, 16]);
    const clearAll = () => setSelectedHours([]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8  max-h-[25em] overflow-hidden">
            <div
                className="lg:col-span-1 border border-zinc-200 rounded-xl p-6 bg-white h-full  overflow-y-auto">
                <h2 className="text-lg font-bold text-zinc-900 mb-1">Legg til Intervjuer</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                    <div className="pt-1">
                        <label className="text-sm font-bold uppercase tracking-wider text-zinc-500">ID</label>
                        <input
                            type="text" placeholder="I-1"
                            value={id} onChange={e => setId(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
                        />
                    </div>
                    <div className="pt-1">
                        <label className="text-sm font-bold uppercase tracking-wider text-zinc-500">Name</label>
                        <input
                            type="text" placeholder="Kari Nordmann"
                            value={name} onChange={e => setName(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
                        />
                    </div>

                    <div className="pt-2">
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Daily
                                Availability (9-17)</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={selectAll}
                                        className="text-xs underline text-zinc-400 hover:text-zinc-900">Alle
                                </button>
                                <button type="button" onClick={clearAll}
                                        className="text-xs underline text-zinc-400 hover:text-zinc-900">Ingen
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            {[9, 10, 11, 12, 13, 14, 15, 16].map(hour => {
                                const isSelected = selectedHours.includes(hour);
                                return (
                                    <button
                                        key={hour}
                                        type="button"
                                        onClick={() => toggleHour(hour)}
                                        className={cn(
                                            "h-9 text-xs font-mono font-medium rounded border transition-all",
                                            isSelected
                                                ? "bg-zinc-900 text-white border-zinc-900"
                                                : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-400"
                                        )}
                                    >
                                        {hour}:00
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!name || !id}
                        className=" mt-3 bg-zinc-900 text-white text-sm font-medium py-2 px-4 rounded hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        +
                    </button>
                </form>
            </div>

            <div
                className="lg:col-span-2 flex flex-col min-h-0 overflow-hidden border border-zinc-200 rounded-xl bg-white max-h-[25em]">
                <div className="flex items-center justify-between mb-4 px-6 pt-6">
                    <h2 className="text-lg font-bold text-zinc-900">Intervjuere</h2>
                    <span
                        className="text-xs font-mono text-zinc-500 bg-zinc-100 px-2 py-1 rounded">{data.length} Aktive</span>
                </div>
                <div className="relative flex-1 min-h-0">
                    <div className="h-full overflow-y-auto px-6 pb-4">
                    <PersonListView data={data}/>
                        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 rounded-b-xl bg-gradient-to-t from-zinc-400 to-transparent" />
                    </div>
                </div>
            </div>
        </div>
    );
}