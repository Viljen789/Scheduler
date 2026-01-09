from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .models import ScheduleRequests
from .solver import solve_schedule as run_solver

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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