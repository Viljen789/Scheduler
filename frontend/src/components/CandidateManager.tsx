import {useState} from 'react';
import type {Candidate} from '../types';
import PersonListView from "./PersonListView.tsx";

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
        <div className="grid grid-cols-2 gap-8 bg-slate-50 h-72  overflow-auto">

            <div className="border p-4 rounded shadow-sm min-h-0">
                <h2 className="text-xl font-bold mb-4">Add Candidate</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <input
                        type="text"
                        placeholder="ID (e.g., C1)"
                        value={id}
                        onChange={e => setId(e.target.value)}
                        className="border p-2 rounded"
                    />
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="border p-2 rounded"
                    />
                    <select
                        value={gender}
                        onChange={e => setGender(e.target.value)}
                        className="border p-2 rounded"
                    >
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="NB">Non-Binary</option>
                    </select>
                    <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                        Add Candidate
                    </button>
                </form>
            </div>

            <div className="p-4 flex flex-col min-h-0 overflow-hidden">
                <h2 className="text-xl font-bold mb-4">Current Candidates</h2>
                <PersonListView data={data} />
            </div>
        </div>
    );
}