import { useState } from 'react';
import axios from 'axios';
import type {Candidate, Interviewer} from '../types';

interface Props {
  candidates: Candidate[];
  interviewers: Interviewer[];
}

// Define what the backend returns (The shape of the response)
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
    // 1. Basic Validation
    if (candidates.length === 0 || interviewers.length === 0) {
      setError("You need at least one candidate and one interviewer.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      // 2. The API Call
      // We send the current state directly to Python
      const payload = {
        candidates: candidates,
        interviewers: interviewers,
        panel_size: panelSize
      };

      const response = await axios.post('http://localhost:8000/solve', payload);
      setResult(response.data);

    } catch (err) {
      console.error(err);
      setError("Failed to connect to the solver. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white p-6 rounded shadow border mb-6">
        <h2 className="text-xl font-bold mb-4">Run Scheduler</h2>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-600">Panel Size</label>
            <input
              type="number"
              min="1"
              max="5"
              value={panelSize}
              onChange={(e) => setPanelSize(parseInt(e.target.value))}
              className="border p-2 rounded w-24"
            />
          </div>

          <button
            onClick={handleSolve}
            disabled={loading}
            className={`flex-1 p-3 rounded text-white font-bold transition-colors
              ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {loading ? "Optimizing Schedule..." : "GENERATE SCHEDULE"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 border border-red-200">
            {error}
          </div>
        )}

        {/* Status: Infeasible */}
        {result?.status === "INFEASIBLE" && (
          <div className="bg-orange-50 text-orange-800 p-4 rounded border border-orange-200 text-center">
            <p className="font-bold text-lg">⚠️ No Solution Found</p>
            <p>Try adding more interviewers, reducing the panel size, or checking availability.</p>
          </div>
        )}

        {/* Status: Success (The Table) */}
        {result?.status === "SUCCESS" && (
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2 text-green-700">✓ Optimized Schedule</h3>
            <div className="overflow-hidden border rounded-lg">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left font-semibold text-gray-600">Time</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-600">Candidate</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-600">Interview Panel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {result.schedule
                    .sort((a, b) => a.time - b.time) // Sort by time
                    .map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800 font-mono">
                        {item.time}:00
                      </td>
                      <td className="py-3 px-4 font-medium text-blue-600">
                        {item.candidate}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {item.panel.join(", ")}
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