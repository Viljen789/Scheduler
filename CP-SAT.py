from ortools.sat.python import cp_model
import csv
from itertools import combinations


def read_candidates(path):
    candidates = []
    cand_gender = {}
    cand_avail = {}

    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cid = row['id']
            candidates.append(cid)
            cand_gender[cid] = row.get('gender') or None
            avail_raw = row.get('availability', '').strip()
            cand_avail[cid] = [int(s) for s in avail_raw.split(';') if s.strip()] if avail_raw else []

    return candidates, cand_gender, cand_avail


def read_interviewers(path):
    interviewers = []
    int_gender = {}
    int_avail = {}

    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            iid = row['id']
            interviewers.append(iid)
            int_gender[iid] = row.get('gender') or None
            avail_raw = row.get('availability', '').strip()
            int_avail[iid] = [int(s) for s in avail_raw.split(';') if s.strip()] if avail_raw else []

    return interviewers, int_gender, int_avail


def display_schedule(schedule):
    if not schedule:
        print("Ingen intervu planlagt.")
        return

    print("\n=== Intervju plan: ===")

    schedule_sorted = sorted(schedule, key=lambda x: (x[2], x[0]))

    current_timeslot = None
    for candidate, interviewer_panel, timeslot in schedule_sorted:
        if timeslot != current_timeslot:
            print(f"\nTimeslot {timeslot}:")
            current_timeslot = timeslot
        interviewer_list = ", ".join(sorted(interviewer_panel))
        print(f"  Candidate {candidate} -> Interviewers [{interviewer_list}]")


def build_schedule(candidates, interviewers, timeslots,
                   cand_gender, int_gender,
                   cand_avail, int_avail,
                   biased_pairs,
                   panel_size=2,
                   K_per_candidate=1,
                   interviewer_capacity=None
                   ):
    model = cp_model.CpModel()

    interviewer_panels = list(combinations(interviewers, panel_size))

    print(f"Finnes {len(interviewer_panels)} mulige panel av størrelse {panel_size}")

    feasible = []
    for c in candidates:
        for panel in interviewer_panels:

            if any((c, i) in biased_pairs for i in panel):
                continue

            if cand_gender.get(c) is None:
                continue

            has_same_gender = any(int_gender.get(i) == cand_gender.get(c)
                                  for i in panel if int_gender.get(i) is not None)
            if not has_same_gender:
                continue

            candidate_avail = set(cand_avail.get(c, []))
            panel_avail = candidate_avail
            for i in panel:
                interviewer_avail = set(int_avail.get(i, []))
                panel_avail = panel_avail & interviewer_avail

            for t in panel_avail:
                if t in timeslots:
                    feasible.append((c, panel, t))

    if not feasible:
        print("Ingen mulige kombinasjoner!")
        return [], {"status": "NO_FEASIBLE_COMBINATIONS"}

    print(f"Fant {len(feasible)} mulige (candidate, panel, timeslot) kombinasjoner")

    x = {}
    for (c, panel, t) in feasible:
        panel_str = "_".join(sorted(panel))
        x[(c, panel, t)] = model.NewBoolVar(f"x_{c}_{panel_str}_{t}")

    cand_vars = {c: [] for c in candidates}
    int_vars = {i: [] for i in interviewers}
    int_time_vars = {(i, t): [] for i in interviewers for t in timeslots}
    cand_time_vars = {(c, t): [] for c in candidates for t in timeslots}

    for (c, panel, t), var in x.items():
        cand_vars[c].append(var)
        cand_time_vars[(c, t)].append(var)

        for i in panel:
            int_vars[i].append(var)
            int_time_vars[(i, t)].append(var)

    for c in candidates:
        if cand_vars[c]:
            model.Add(sum(cand_vars[c]) == K_per_candidate)

    for (i, t), vars_it in int_time_vars.items():
        if vars_it:
            model.Add(sum(vars_it) <= 1)

    for (c, t), vars_ct in cand_time_vars.items():
        if vars_ct:
            model.Add(sum(vars_ct) <= 1)

    if interviewer_capacity:
        for i in interviewers:
            if int_vars[i]:
                cap = interviewer_capacity.get(i, len(timeslots))
                model.Add(sum(int_vars[i]) <= cap)

    total_assigned_expr = sum(x.values())
    model.Maximize(total_assigned_expr)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 30.0
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)

    schedule = []
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for (c, panel, t), var in x.items():
            if solver.Value(var):
                schedule.append((c, panel, t))

        total_assigned = len(schedule)
        candidates_interviewed = len(set(c for c, panel, t in schedule))
        max_interviewer_load = 0
        interviewer_loads = {}

        if schedule:
            for i in interviewers:
                load = sum(1 for (c, panel, t) in schedule if i in panel)
                interviewer_loads[i] = load
                if load > max_interviewer_load:
                    max_interviewer_load = load

        stats = {
            "total_interviews": int(total_assigned),
            "candidates_interviewed": int(candidates_interviewed),
            "max_interviewer_load": int(max_interviewer_load),
            "interviewer_loads": interviewer_loads,
            "panel_size": panel_size,
            "status": "OPTIMAL" if status == cp_model.OPTIMAL else "FEASIBLE",
            "solve_time": solver.WallTime()
        }
        return schedule, stats
    else:
        return [], {"status": "INFEASIBLE", "solve_time": solver.WallTime()}


try:

    candidates, cand_gender, cand_avail = read_candidates('data/candidates.csv')
    interviewers, int_gender, int_avail = read_interviewers('data/interviewers.csv')

    timeslots = range(0, 24)
    biased_pairs = set()

    print(f"Lasta {len(candidates)} kandidater og {len(interviewers)} intervuere")

    schedule, stats = build_schedule(
        candidates=candidates,
        interviewers=interviewers,
        timeslots=timeslots,
        cand_gender=cand_gender,
        int_gender=int_gender,
        cand_avail=cand_avail,
        int_avail=int_avail,
        biased_pairs=biased_pairs,
        panel_size=2,
        K_per_candidate=1,
    )

    print(f"\nStatus:: {stats.get('status', 'UNKNOWN')}")
    print(f"Antall intervu: {stats.get('total_interviews', 0)}")
    print(f"Kandidater intervjua: {stats.get('candidates_interviewed', 0)}")
    print(f"Panel størrelse: {stats.get('panel_size', 0)} intervuer pr intervju")
    print(f"Solve time: {stats.get('solve_time', 0):.2f}s")

    if schedule:
        display_schedule(schedule)
        print(f"\nStatistics:")
        print(f"  Max intervuer load: {stats.get('max_interviewer_load', 0)}")
        print(f"  intervuer loads: {stats.get('interviewer_loads', {})}")

except FileNotFoundError as e:
    print(f"Error: fant ikkje csv fil - {e}")
    print("Pass på 'data/candidates.csv' og 'data/interviewers.csv' eksisterer.")
except Exception as e:
    print(f"Error ved å kjøre scheduleren: {e}")
