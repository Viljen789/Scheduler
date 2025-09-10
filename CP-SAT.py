from ortools.sat.python import cp_model
import csv
from itertools import combinations
import time


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
                   panel_size,
                   K_gender=1):
    start_time = time.time()
    model = cp_model.CpModel()

    interviewer_panels = list(combinations(interviewers, panel_size))

    x = {}  # x[c][p][t] = 1 => candidates c is interviewed by panel p at time t
    for c in candidates:
        for p_idx, panel in enumerate(interviewer_panels):
            if sum(cand_gender[c] == int_gender[panel[i]] for i in range(panel_size)) >= K_gender:
                for t_idx, timeslot in enumerate(timeslots):
                    x[c, p_idx, t_idx] = model.NewBoolVar(f'x_{c}_{p_idx}_{t_idx}')

    for c in candidates:
        model.Add(sum(x[c, p_idx, t_idx]
                      for p_idx in range(len(interviewer_panels))
                      for t_idx in range(len(timeslots))) == 1)

    for c in candidates:
        for t_idx in range(len(timeslots)):
            model.Add(sum(x[c, p_idx, t_idx] for p_idx in range(len(interviewer_panels))) <= 1)

    for i in interviewers:
        for t_idx in range(len(timeslots)):
            interviews_for_interviewer = []
            for c in candidates:
                for p_idx, panel in enumerate(interviewer_panels):
                    if i in panel:
                        interviews_for_interviewer.append(x[c, p_idx, t_idx])
            if interviews_for_interviewer:
                model.Add(sum(interviews_for_interviewer) <= 1)

    for c in candidates:
        available_timeslots = cand_avail.get(c, [])
        for t_idx, timeslot in enumerate(timeslots):
            if t_idx not in available_timeslots:
                for p_idx in range(len(interviewer_panels)):
                    model.Add(x[c, p_idx, t_idx] == 0)

    for p_idx, panel in enumerate(interviewer_panels):
        for t_idx, timeslot in enumerate(timeslots):
            panel_available = all(t_idx in int_avail.get(i, []) for i in panel)
            if not panel_available:
                for c in candidates:
                    model.Add(x[c, p_idx, t_idx] == 0)

    for c in candidates:
        for i in interviewers:
            if (c, i) in biased_pairs or (i, c) in biased_pairs:
                for p_idx, panel in enumerate(interviewer_panels):
                    if i in panel:
                        for t_idx in range(len(timeslots)):
                            model.Add(x[c, p_idx, t_idx] == 0)

    model.maximize(sum(
        x[c, p_idx, t_idx] for c in candidates for p_idx, panel in enumerate(interviewer_panels) for t_idx in
        range(len(timeslots))))
    load = {}
    for i in interviewers:
        load[i] = model.NewIntVar(0, len(candidates), f'load_{i}')
        # load[i] = number of interviews for interviewer i
        model.Add(load[i] == sum(
            x[c, p_idx, t_idx]
            for c in candidates
            for p_idx, panel in enumerate(interviewer_panels)
            for t_idx in range(len(timeslots))
            if i in panel
        ))
    max_load = model.NewIntVar(0, len(candidates), 'max_load')
    min_load = model.NewIntVar(0, len(candidates), 'min_load')

    for i in interviewers:
        model.Add(load[i] <= max_load)
        model.Add(load[i] >= min_load)

    model.Maximize(
        sum(x[c, p_idx, t_idx] for c in candidates for p_idx, _ in enumerate(interviewer_panels) for t_idx in
            range(
                len(timeslots)))  # More weight to maximizing the amount of interviews, but a small effect to not have too many interviews per interviewer
        * 1000
        - (max_load - min_load)
    )
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 30.0

    status = solver.Solve(model)
    solve_time = time.time() - start_time

    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        schedule = []
        for c in candidates:
            for p_idx, panel in enumerate(interviewer_panels):
                for t_idx, timeslot in enumerate(timeslots):
                    if solver.Value(x[c, p_idx, t_idx]):
                        schedule.append((c, list(panel), timeslot))

        interviewer_loads = {}
        for i in interviewers:
            interviewer_loads[i] = 0

        for _, panel, _ in schedule:
            for i in panel:
                interviewer_loads[i] += 1

        stats = {
            "status": "OPTIMAL" if status == cp_model.OPTIMAL else "FEASIBLE",
            "total_interviews": len(schedule),
            "candidates_interviewed": len(set(c for c, _, _ in schedule)),
            "panel_size": panel_size,
            "solve_time": solve_time,
            "max_interviewer_load": max(interviewer_loads.values()) if interviewer_loads else 0,
            "interviewer_loads": interviewer_loads
        }

        return schedule, stats

    else:
        status_map = {
            cp_model.INFEASIBLE: "INFEASIBLE",
            cp_model.MODEL_INVALID: "MODEL_INVALID",
            cp_model.UNKNOWN: "UNKNOWN"
        }
        return [], {
            "status": status_map.get(status, "UNKNOWN"),
            "solve_time": solve_time,
            "total_interviews": 0,
            "candidates_interviewed": 0,
            "panel_size": panel_size
        }


try:
    candidates, cand_gender, cand_avail = read_candidates('data/candidates.csv')
    interviewers, int_gender, int_avail = read_interviewers('data/interviewers.csv')

    days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    timeslots = [i for i in range(24)]
    panel_size = 3
    K_gender = 1

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
        panel_size=panel_size,
        K_gender=K_gender
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
