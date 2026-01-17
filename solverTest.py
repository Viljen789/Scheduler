from backend.models import (Candidate, Interviewer)
from backend.solver import solve_schedule as run_solver

candidates = []
interviewers = []
candHeaders = []
inteviewHeaders = []

def formatting(solver_result):
    print(f"Status: ", solver_result["status"])
    for i in solver_result["schedule"]:
        print(f"Candidate: {i['candidate']}, Time: {i['time']}, Panel: {i['panel']}")

    print("-"*50)
    print(f"Interviews pr interviewer: {solver_result['interviews_per_interviewer']}")




with open("data/candidates.csv", "r") as candidates_file:
    candHeadsers = candidates_file.readline()
    for line in candidates_file:
        curCandidate = (line.strip().split(","))
        candidates.append(Candidate(id=curCandidate[0], name=curCandidate[2], gender=curCandidate[1]))




with open("data/interviewers.csv", "r") as interviewers_file:
    interviewHeaders = interviewers_file.readline()
    for line in interviewers_file:
        curInterviewer = line.strip().split(",")
        print(curInterviewer)
        interviewers.append(Interviewer(id=curInterviewer[0], name=curInterviewer[3], gender=curInterviewer[1],availability=[int(i) for i in curInterviewer[2].split(";")],biased=curInterviewer[4].split(";")))


print(candidates)
print(interviewers)
timeslots = [i for i in range(10, 17)]

print(run_solver(candidates=candidates, interviewers=interviewers, panel_size=3, timeslots=timeslots))
formatting(run_solver(candidates=candidates, interviewers=interviewers, panel_size=3, timeslots=timeslots))

