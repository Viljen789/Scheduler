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
@app.get("/")
def read_root():
    return {"message": "Scheduler API is running"}

@app.post("/solve")
def solve_schedule(data: ScheduleRequests):
    print(f"Recieved request for {len(data.candidates)} candidates and {len(data.interviewers)} interviewers")
    candidates = data.candidates
    interviewers = data.interviewers
    return {
        "status": "recieved",
        "info": f"Ready to schedule {len(candidates)} candidates with {len(interviewers)} interviewers"
    }