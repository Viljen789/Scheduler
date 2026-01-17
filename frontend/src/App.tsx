import { useState, useEffect } from 'react';
import axios from 'axios';
import CandidateManager from "./components/CandidateManager";
import InterviewerManager from "./components/InterviewerManager";
import SolverView from "./components/SolverView";
import type { Candidate, Interviewer } from './types';

export default function App() {
  const [status, setStatus] = useState<string>("Idle");

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setStatus("Loading data...");
      try {
        const response = await axios.get('http://localhost:8000/load-data');
        setCandidates(response.data.candidates);
        setInterviewers(response.data.interviewers);
        setStatus("Data Loaded Successfully");
      } catch (error) {
        console.error("Could not load CSV data", error);
        setStatus("Error: Could not load initial data");
      }
    };
    fetchData();
  }, []);

  const handleAddCandidate = (newPerson: Candidate) => {
    setCandidates([...candidates, newPerson]);
  };

  const handleAddInterviewer = (newPerson: Interviewer) => {
    setInterviewers([...interviewers, newPerson]);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 font-sans text-gray-800">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Scheduler</h1>
        <p className="text-sm text-gray-500 mt-1">Backend Status: {status}</p>
      </div>
      <hr />

      <CandidateManager
        data={candidates}
        onAdd={handleAddCandidate}
      />

      <InterviewerManager
        data={interviewers}
        onAdd={handleAddInterviewer}
      />

      <SolverView
        candidates={candidates}
        interviewers={interviewers}
      />
    </div>
  );
}