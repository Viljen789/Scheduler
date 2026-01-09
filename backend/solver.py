from ortools.sat.python import cp_model
from typing import List, Dict, Any
from .models import Person, Interviewer


def solve_schedule(
        candidates: List[Person],
        interviewers: List[Interviewer],
        panel_size: int,
        timeslots: List[int]
) -> Dict[str, Any]:
    model = cp_model.CpModel()
    schedule = {}
    for candidate in candidates:
        for timeslot in timeslots:
            schedule[(candidate.id, timeslot)] = model.NewBoolVar(f"sched_c{candidate.id}_t{timeslot}")
    assign = {}

    for candidate in candidates:
        for timeslot in timeslots:
            for interviewer in interviewers:
                assign[(interviewer.id, candidate.id, timeslot)] = model.NewBoolVar(
                    f"assign_i{interviewer.id}_c{candidate.id}t_{timeslot}")

    for candidate in candidates:
        model.add(sum([schedule[(candidate.id, t)] for t in timeslots]) == 1)

    for candidate in candidates:
        for timeslot in timeslots:
            assigned_interviewers = sum(
                assign[(interviewer.id, candidate.id, timeslot)] for interviewer in interviewers)
            model.Add(assigned_interviewers == schedule[(candidate.id, timeslot)] * panel_size)

    for interviewer in interviewers:
        for candidate in candidates:
            for timeslot in timeslots:
                if timeslot not in interviewer.availability or candidate.id in interviewer.biased:
                    model.Add(assign[(interviewer.id, candidate.id, timeslot)] == 0)

    for interviewer in interviewers:
        for timeslot in timeslots:
            concurrent_interviews = sum(assign[(interviewer.id, candidate.id, timeslot)] for candidate in candidates)
            model.Add(concurrent_interviews <= 1)

    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    if (status in (cp_model.OPTIMAL, cp_model.FEASIBLE)):
        results = []
        for candidate in candidates:
            for timeslot in timeslots:
                if solver.BooleanValue(schedule[(candidate.id, timeslot)]):
                    panel = [interviewer.name for interviewer in interviewers if
                             solver.BooleanValue(assign[(interviewer.id, candidate.id, timeslot)])]
                    results.append({
                        "candidate": candidate.name,
                        "time": timeslot,
                        "panel": panel})
        return {"status": "SUCCESS", "schedule": results}
    return {"status": "INFEASIBLE", "schedule":[]}