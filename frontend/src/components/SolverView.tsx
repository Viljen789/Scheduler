import { useState } from 'react';
import axios from 'axios';
import type { Candidate, Interviewer } from '../types';
import { cn } from "../lib/utils";

interface Props {
  candidates: Candidate[];
  interviewers: Interviewer[];
}

interface ScheduleItem {
  candidate: string;
  time: number;
  panel: string[];
}

interface SolveResponse {
  status: "SUCCESS" | "INFEASIBLE";
  schedule: ScheduleItem[];
}

export default function SolverView({ candidates, interviewers }: Props) {
  const [panelSize, setPanelSize] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SolveResponse | null>(null);
  const [error, setError] = useState("");

  const handleSolve = async () => {
    if (candidates.length === 0 || interviewers.length === 0) {
      setError("Please add at least one candidate and one interviewer.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const payload = { candidates, interviewers, panel_size: panelSize };
      const response = await axios.post('http://localhost:8000/solve', payload);
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError("Connection failed. Is the backend server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white border border-zinc-200 rounded-xl p-8">
        <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8 border-b border-zinc-100 pb-8">
          <div className="flex-1">
             <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Schedule Generator</h2>
             <p className="text-zinc-500 mt-1 text-sm">Review your pool and generate an optimized timeline.</p>
          </div>

          <div className="flex items-end gap-4">
             <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Panel Size</label>
                <input
                  type="number"
                  min="1" max="5"
                  value={panelSize}
                  onChange={(e) => setPanelSize(parseInt(e.target.value))}
                  className="w-20 bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-sm text-center focus:ring-1 focus:ring-zinc-900 focus:bg-white"
                />
             </div>
             <button
                onClick={handleSolve}
                disabled={loading}
                className="bg-zinc-900 text-white px-6 py-2 rounded text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors h-[38px]"
             >
                {loading ? "Optimizing..." : "Run Solver"}
             </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded text-sm border border-red-100 flex items-center gap-2 mb-6">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        {result?.status === "INFEASIBLE" && (
          <div className="bg-zinc-50 text-zinc-600 px-6 py-8 rounded border border-zinc-200 text-center">
            <p className="font-bold text-lg mb-1">No Solution Found</p>
            <p className="text-sm text-zinc-400">Try reducing panel size or increasing interviewer availability.</p>
          </div>
        )}

        {result?.status === "SUCCESS" && (
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 mb-4">Generated Schedule</h3>
            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Time</th>
                    <th className="py-3 px-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Candidate</th>
                    <th className="py-3 px-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Panel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {result.schedule
                    .sort((a, b) => a.time - b.time)
                    .map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-mono text-zinc-400">
                        {item.time}:00
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-zinc-900">
                        {item.candidate}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                           {item.panel.map((p, i) => (
                               <span key={i} className="text-[10px] font-bold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded uppercase tracking-wide border border-zinc-200">
                                   {p}
                               </span>
                           ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}