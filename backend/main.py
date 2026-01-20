import csv
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .solver import solve_schedule as run_solver
from .models import ScheduleRequests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Backend is active!"}

@app.post("/solve")
def solve_schedule(data: ScheduleRequests):
    print(f"Solving for {len(data.candidates)} candidates...")

    timeslots = list(range(24))

    result = run_solver(
        candidates=data.candidates,
        interviewers=data.interviewers,
        panel_size=data.panel_size,
        timeslots=timeslots
    )

    return result

def parse_availability(avail_str):
    if not avail_str: return []
    return [int(x) for x in avail_str.split(";") if x]

@app.get("/load-data")
def load_csv_data():
    candidates = []
    interviewers = []
    current_dir = os.path.dirname(os.path.abspath(__file__))

    base_path = os.path.join(current_dir, "..", "data")

    if not os.path.exists(base_path):
        base_path = "data"

    print(f"Loading data from: {os.path.abspath(base_path)}")

    cand_path = os.path.join(base_path, "candidates.csv")
    if os.path.exists(cand_path):
        with open(cand_path, "r") as f:
            reader = csv.reader(f)
            next(reader, None)
            for row in reader:
                if row:
                    candidates.append({
                        "id": row[0],
                        "gender": row[1],
                        "name": row[2]
                    })
    else:
        print(f"Warning: Could not find {cand_path}")

    int_path = os.path.join(base_path, "interviewers.csv")
    if os.path.exists(int_path):
        with open(int_path, "r") as f:
            reader = csv.reader(f)
            next(reader, None)
            for row in reader:
                if row:
                    interviewers.append({
                        "id": row[0],
                        "gender": row[1],
                        "availability": parse_availability(row[2]),
                        "name": row[3],
                        "biased": row[4].split(";") if len(row) > 4 and row[4] else []
                    })
    else:
        print(f"Warning: Could not find {int_path}")

    return {"candidates": candidates, "interviewers": interviewers}