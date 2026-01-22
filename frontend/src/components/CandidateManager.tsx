import { useState } from 'react';
import type { Candidate } from '../types';
import PersonListView from "./PersonListView.tsx";
import { cn } from "../lib/utils";

interface Props {
    data: Candidate[];
    onAdd: (person: Candidate) => void;
}

export default function CandidateManager({ data, onAdd }: Props) {
    const [name, setName] = useState("");
    const [id, setId] = useState("");
    const [gender, setGender] = useState("M");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !id) return;
        onAdd({ id, name, gender });
        setName("");
        setId("");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full max-h-[800px] overflow-hidden">
            {/* Left Col: The Form */}
            <div className="lg:col-span-1 border border-zinc-200 rounded-xl p-6 bg-white h-full lg:h-fit overflow-y-auto">
                <h2 className="text-lg font-bold text-zinc-900 mb-1">Add Candidate</h2>
                <p className="text-xs text-zinc-500 mb-6">Enter candidate details below.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Unique ID</label>
                        <input
                            type="text"
                            placeholder="e.g. C-101"
                            value={id}
                            onChange={e => setId(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Full Name</label>
                        <input
                            type="text"
                            placeholder="Jane Doe"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Gender</label>
                        <div className="grid grid-cols-3 gap-2">
                             {['M', 'F', 'NB'].map((g) => (
                                 <button
                                    key={g}
                                    type="button"
                                    onClick={() => setGender(g)}
                                    className={cn(
                                        "text-xs font-medium py-2 rounded border transition-all",
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
                        className="mt-2 bg-zinc-900 text-white text-sm font-medium p-2.5 rounded hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Add Candidate
                    </button>
                </form>
            </div>

            {/* Right Col: The List */}
            <div className="lg:col-span-2 flex flex-col min-h-0 overflow-hidden border border-zinc-200 rounded-xl bg-white">
                <div className="flex items-center justify-between mb-4 px-6 pt-6">
                    <h2 className="text-lg font-bold text-zinc-900">Candidate Roster</h2>
                    <span className="text-xs font-mono text-zinc-400 bg-zinc-100 px-2 py-1 rounded">{data.length} Total</span>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
                    <PersonListView data={data} />
                </div>
            </div>
        </div>
    );
}