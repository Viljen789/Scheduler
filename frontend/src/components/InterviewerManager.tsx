import {useState} from 'react';
import type {Interviewer} from '../types';
import PersonListView from "./PersonListView.tsx";

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

    return (
        <div className="grid grid-cols-2 gap-8 h-80 bg-slate-50 overflow-auto">
            <div className="border p-4 rounded shadow-sm">
                <h2 className="text-xl font-bold">Add Interviewer</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <input
                        type="text" placeholder="ID (e.g., I1)"
                        value={id} onChange={e => setId(e.target.value)}
                        className="border p-2 rounded"
                    />
                    <input
                        type="text" placeholder="Name"
                        value={name} onChange={e => setName(e.target.value)}
                        className="border p-2 rounded"
                    />

                    <div className="my-2">
                        <label className="text-sm font-bold block mb-1">Availability (9-17)</label>
                        <div className="flex flex-wrap gap-2 justify-between">
                            {[9, 10, 11, 12, 13, 14, 15, 16].map(hour => (
                                <button
                                    key={hour}
                                    type="button"
                                    onClick={() => toggleHour(hour)}
                                    className={`w-10 h-10 rounded text-sm font-bold border
                    ${selectedHours.includes(hour)
                                        ? "bg-green-500 text-white border-green-600"
                                        : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"}`}
                                >
                                    {hour}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600">
                        Add Interviewer
                    </button>
                </form>
            </div>

            <div className="overflow-scroll">
                <h2 className="text-xl font-bold mb-4">Interviewers</h2>
                <PersonListView data={data}/>
            </div>
        </div>
    );
}