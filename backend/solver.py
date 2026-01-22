from ortools.sat.python import cp_model
from typing import List, Dict, Any
from .models import Candidate, Interviewer

def solve_schedule(
        candidates: List[Candidate],
        interviewers: List[Interviewer],
        panel_size: int,
        allowed_hours: List[int] = None
) -> Dict[str, Any]:

    model = cp_model.CpModel()
    schedule = {}
    assign = {}

    # 1. DEFINE THE TIME UNIVERSE
    # Instead of filtering for "perfect" slots, we take ALL slots mentioned in the data.
    all_possible_slots = set()
    for i in interviewers:
        all_possible_slots.update(i.availability)

    # If data is empty, default to standard business hours (Mon-Fri 9-5)
    if not all_possible_slots:
        # 0=Mon 00:00. 9=9am. 24=Tue 00:00.
        # Weekdays: 0, 24, 48, 72, 96
        for day_start in [0, 24, 48, 72, 96]:
            for hour in range(9, 17):
                all_possible_slots.add(day_start + hour)

    sorted_slots = sorted(list(all_possible_slots))

    # Identify genders for the new constraint
    male_interviewers = [i.id for i in interviewers if i.gender == 'M']
    female_interviewers = [i.id for i in interviewers if i.gender == 'F']

    # --- 2. CREATE VARIABLES ---
    bad_time_vars = []

    for candidate in candidates:
        for t in sorted_slots:
            # Main Schedule Variable
            schedule[(candidate.id, t)] = model.NewBoolVar(f"sched_{candidate.id}_{t}")

            for interviewer in interviewers:
                # Assignment Variable
                # We create this for EVERY interviewer, not just available ones
                # (unless they are biased against this candidate)
                if candidate.id not in interviewer.biased:
                    assign[(interviewer.id, candidate.id, t)] = model.NewBoolVar(f"assign_{interviewer.id}_{candidate.id}_{t}")

                    # SOFT CONSTRAINT LOGIC:
                    # If we assign this interviewer, but 't' is NOT in their availability,
                    # it's a "Bad Time". We track this penalty.
                    if t not in interviewer.availability:
                        model.AddImplication(assign[(interviewer.id, candidate.id, t)], True)
                        # We just track the cost in the objective below

    # --- 3. HARD CONSTRAINTS ---

    # A. Each candidate = exactly 1 interview
    for candidate in candidates:
        model.Add(sum(schedule[(candidate.id, t)] for t in sorted_slots) == 1)

    # B. Panel Size & Linkage
    for candidate in candidates:
        for t in sorted_slots:
            # Valid interviewers for this candidate (excluding biased ones)
            valid_ids = [i.id for i in interviewers if (i.id, candidate.id, t) in assign]

            # Sum(assignments) == Panel Size * IsScheduled
            model.Add(sum(assign[(i_id, candidate.id, t)] for i_id in valid_ids) ==
                      schedule[(candidate.id, t)] * panel_size)

            # C. GENDER CONSTRAINT (New!)
            # If scheduled, we need >= 1 Male AND >= 1 Female
            # We use `OnlyEnforceIf` to apply this only when the interview actually happens

            # Sum of Males assigned >= 1 * IsScheduled
            male_vars = [assign[(mid, candidate.id, t)] for mid in male_interviewers if (mid, candidate.id, t) in assign]
            if male_vars:
                model.Add(sum(male_vars) >= 1).OnlyEnforceIf(schedule[(candidate.id, t)])

            # Sum of Females assigned >= 1 * IsScheduled
            female_vars = [assign[(fid, candidate.id, t)] for fid in female_interviewers if (fid, candidate.id, t) in assign]
            if female_vars:
                model.Add(sum(female_vars) >= 1).OnlyEnforceIf(schedule[(candidate.id, t)])

    # D. No Parallel Interviews
    for interviewer in interviewers:
        for t in sorted_slots:
            # Sum of all assignments for this interviewer at time t must be <= 1
            concurrent = []
            for c in candidates:
                if (interviewer.id, c.id, t) in assign:
                    concurrent.append(assign[(interviewer.id, c.id, t)])
            if concurrent:
                model.Add(sum(concurrent) <= 1)

    # --- 4. OPTIMIZATION ---

    # Objective 1: Minimize "Bad Times" (High Priority)
    # Objective 2: Balance Load (Low Priority)

    penalty_terms = []

    # Calculate Bad Time Cost
    for t in sorted_slots:
        for i in interviewers:
            if t not in i.availability:
                # Check if variable exists (might be skipped due to bias)
                for c in candidates:
                    if (i.id, c.id, t) in assign:
                        # Weight = 100. It's expensive to use a bad time.
                        penalty_terms.append(assign[(i.id, c.id, t)] * 100)

    # Calculate Load Imbalance (Simple max load minimization)
    max_load = model.NewIntVar(0, len(candidates), "max_load")
    loads = []
    for i in interviewers:
        my_assignments = []
        for c in candidates:
            for t in sorted_slots:
                if (i.id, c.id, t) in assign:
                    my_assignments.append(assign[(i.id, c.id, t)])

        load_var = model.NewIntVar(0, len(candidates), f"load_{i.id}")
        model.Add(load_var == sum(my_assignments))
        loads.append(load_var)

    model.AddMaxEquality(max_load, loads)

    # Combine: Minimize (BadTimes + MaxLoad)
    # BadTimes has weight 100 per violation, MaxLoad has weight 1.
    # This means the solver will fix availability first, then balance the team.
    model.Minimize(sum(penalty_terms) + max_load)

    # --- 5. SOLVE ---
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10.0

    status = solver.Solve(model)

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        results = []
        for candidate in candidates:
            for t in sorted_slots:
                if solver.BooleanValue(schedule[(candidate.id, t)]):
                    panel_names = []
                    for i in interviewers:
                        if (i.id, candidate.id, t) in assign and solver.BooleanValue(assign[(i.id, candidate.id, t)]):
                            # Mark if they are working overtime (bad time)
                            is_overtime = t not in i.availability
                            marker = " (Overtime)" if is_overtime else ""
                            panel_names.append(f"{i.name}{marker}")

                    results.append({
                        "candidate": candidate.name,
                        "time": t,
                        "panel": panel_names
                    })
        return {"status": "SUCCESS", "schedule": results}

    return {"status": "INFEASIBLE", "schedule": []}