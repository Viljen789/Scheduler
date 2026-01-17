from ortools.sat.python import cp_model
from typing import List, Dict, Any
from .models import (Candidate, Interviewer)


def solve_schedule(
        candidates: List[Candidate],
        interviewers: List[Interviewer],
        panel_size: int,
        timeslots: List[int]
) -> Dict[str, Any]:
    model = cp_model.CpModel()
    schedule = {}
    interviews_per_interviewer = {interviewer.name: 0 for interviewer in interviewers}
    assign = {}

    for candidate in candidates:
        for timeslot in timeslots:
            schedule[(candidate.id, timeslot)] = model.NewBoolVar(f"sched_c{candidate.id}_t{timeslot}")

    for candidate in candidates:
        for timeslot in timeslots:
            for interviewer in interviewers:
                assign[(interviewer.id, candidate.id, timeslot)] = model.NewBoolVar(
                    f"assign_i{interviewer.id}_c{candidate.id}t_{timeslot}")

    # Alle har noyaktig 1 intervju
    for candidate in candidates:
        model.Add(sum([schedule[(candidate.id, t)] for t in timeslots]) == 1)

    # Alle har samme panel storrelse
    for candidate in candidates:
        for timeslot in timeslots:
            assigned_interviewers = sum(
                assign[(interviewer.id, candidate.id, timeslot)] for interviewer in interviewers)
            model.Add(assigned_interviewers == schedule[(candidate.id, timeslot)] * panel_size)

    # Ingen har når de ikke kan/de er inhabile
    for interviewer in interviewers:
        for candidate in candidates:
            for timeslot in timeslots:
                if timeslot not in interviewer.availability or candidate.id in interviewer.biased:
                    model.Add(assign[(interviewer.id, candidate.id, timeslot)] == 0)

    # Ingen intervju parallelt
    for interviewer in interviewers:
        for timeslot in timeslots:
            concurrent_interviews = sum(assign[(interviewer.id, candidate.id, timeslot)] for candidate in candidates)
            model.Add(concurrent_interviews <= 1)

    # Fordele intervju mest mulig likt
    interviewer_loads = []
    for interviewer in interviewers:
        my_assignments = []
        for candidate in candidates:
            for timeslot in timeslots:
                 my_assignments.append(assign[(interviewer.id, candidate.id, timeslot)])
        interviewer_loads.append(sum(my_assignments))

    max_load = model.NewIntVar(0, len(timeslots) * len(candidates), "max_load")
    min_load = model.NewIntVar(0, len(timeslots) * len(candidates), "min_load")

    model.AddMaxEquality(max_load, interviewer_loads)
    model.AddMinEquality(min_load, interviewer_loads)

    diff = model.NewIntVar(0, len(timeslots) * len(candidates), "diff")
    model.Add(diff == max_load - min_load)

    model.Minimize(diff)



    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    if (status in (cp_model.OPTIMAL, cp_model.FEASIBLE)):
        results = []
        for interviewer in interviewers:
            count = 0
            for candidate in candidates:
                for timeslot in timeslots:
                    if solver.BooleanValue(assign[(interviewer.id, candidate.id, timeslot)]):
                        count += 1
            interviews_per_interviewer[interviewer.name] = count
        for candidate in candidates:
            for timeslot in timeslots:
                if solver.BooleanValue(schedule[(candidate.id, timeslot)]):
                    panel = [interviewer.name for interviewer in interviewers if
                             solver.BooleanValue(assign[(interviewer.id, candidate.id, timeslot)])]
                    results.append({
                        "candidate": candidate.name,
                        "time": timeslot,
                        "panel": panel})

        return {"status": "SUCCESS", "schedule": results, "interviews_per_interviewer": interviews_per_interviewer}

    return {"status": "INFEASIBLE", "schedule":[], "interviews_per_interviewer":interviews_per_interviewer}