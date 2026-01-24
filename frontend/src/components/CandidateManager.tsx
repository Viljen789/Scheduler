import {useState} from 'react';
import type {Candidate} from '../types';
import PersonListView from "./PersonListView.tsx";
import {cn} from "../lib/utils";

interface Props {
    data: Candidate[];
    onAdd: (person: Candidate) => void;
}

export default function CandidateManager({data, onAdd}: Props) {
    const [name, setName] = useState("");
    const [id, setId] = useState("");
    const [gender, setGender] = useState("M");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !id) return;
        onAdd({id, name, gender});
        setName("");
        setId("");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-78 overflow-hidden">
            <div
                className="lg:col-span-1 border border-zinc-200 rounded-xl p-6 bg-white h-full overflow-y-auto">
                <h2 className="text-lg font-bold text-zinc-900 mb-1">Legg til kandidat</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                    <div className="gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">ID</label>
                            <input
                                type="text" placeholder="C-101"
                                value={id} onChange={e => setId(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
                            />
                        </div>
                        <div className="mt-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Navn</label>
                            <input
                                type="text" placeholder="Ola Nordmann"
                                value={name} onChange={e => setName(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Kjønn</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['M', 'F', 'NB'].map((g) => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setGender(g)}
                                    className={cn(
                                        "text-md font-medium py-1 rounded border transition-all",
                                        gender === g
                                            ? "bg-zinc-900 text-white border-zinc-900"
                                            : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"
                                    )}
                                >
                                    {g}
                                </button>
                            ))}
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
                className="lg:col-span-2 flex flex-col min-h-0 border border-zinc-200 rounded-xl bg-white max-h-[22em] ">
                <div className="flex items-center justify-between mb-4 px-6 pt-6">
                    <h2 className="text-lg font-bold text-zinc-900">Kandidater</h2>
                    <span
                        className="text-xs font-mono text-zinc-500 bg-zinc-100 px-2 py-1 rounded">{data.length} Total</span>
                </div>
                <div className="relative flex-1 min-h-0">
                    <div className="h-full overflow-y-auto px-6 pb-4">
                        <PersonListView data={data}/>
                    </div>
                    {/*<div className="pointer-events-none absolute bottom-4 left-0  h-4 rounded-bl-xl bg-black w-6" />*/}
                    {/*<div className="pointer-events-none absolute bottom-4 right-0  h-4 rounded-br-xl bg-black w-6" />*/}
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 rounded-b-xl bg-gradient-to-t from-zinc-400 to-transparent" />
                </div>
            </div>
        </div>
    );
}